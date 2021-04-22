import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions, UserError } from '@sapphire/framework';
import { BucketType } from '@sapphire/framework';
import axios from 'axios';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { code as config } from '@/config/commands/general';
import settings from '@/config/settings';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';
import { convertSize } from '@/utils';

const wraps = new Map([
  ['c', '#include <stdio.h>\nint main() { {code} }'],
  ['cpp', '#include <iostream>\nint main() { {code} }'],
  ['java', 'public class Main {\n\tpublic static void main(String[] args) {\n\t{code}\n\t}\n}'],
  ['kotlin', 'fun main(args: Array<String>) {\n{code}\n}'],
]);

@ApplyOptions<CommandOptions>({
  ...config.options,
  quotes: [],
  strategyOptions: {
    flags: ['wrap'],
  },
  preconditions: [{
    name: 'Cooldown',
    context: {
      // TODO?: Make it Guild?
      bucketType: BucketType.User,
      delay: 60_000,
      limit: 3,
    },
  }],
})
export default class CodeCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    if (this.context.client.remainingCompilerApiCredits <= 0) {
      await message.channel.send(config.messages.noMoreCredits);
      return;
    }

    const lang = await args.pickResult('codeLanguage');
    if (lang.error) {
      // TODO: This is trash (both typings and handling).
      const { parameter } = (lang.error as UserError & { parameter: string });
      if (['info', 'infos', 'information', 'informations'].includes(parameter)) {
        await this._showInfos(message);
        return;
      }
      await message.channel.send(pupa(config.messages.unknownLanguage, { parameter }));
      return;
    }

    const shouldWrap = args.getFlags('wrap');

    const codeArg = await args.restResult('code');
    if (codeArg.error) {
      await message.channel.send(config.messages.noCode);
      return;
    }
    let code = codeArg.value;
    if (shouldWrap)
      code = pupa(wraps.get(lang.value.language), { code });

    void message.channel.startTyping();

    let response = { data: { cpuTime: 0, memory: 0, output: code } };
    if (settings.configuration.enableCompilerApi) {
      this.context.client.remainingCompilerApiCredits--;
      response = await axios.post(settings.apis.compiler, {
        script: code,
        language: lang.value.language,
        versionIndex: lang.value.versionIndex,
        clientId: process.env.COMPILERAPI_ID,
        clientSecret: process.env.COMPILERAPI_SECRET,
      });
    }

    // TODO(discord.js>=13.0.0): Replace with a reply.
    await message.channel.send(pupa(config.messages.result, {
      message,
      lang,
      response,
      memory: convertSize(response.data.memory),
    }));
    // Ph (placeholder) prevents Discord from taking the first line as a language identifier for markdown and remove it
    await message.channel.send(`\`\`\`ph\n${response.data.output}\`\`\``);

    message.channel.stopTyping();
  }

  private async _showInfos(message: GuildMessage): Promise<void> {
    const embed = new MessageEmbed()
      .setColor(settings.colors.default)
      .addFields(
        settings.languages.map(lang => ({
          name: lang.display,
          value: pupa(config.messages.informationBlock, { lang, formattedSlugs: `\`${lang.slugs.join('`, `')}\`` }),
          inline: true,
        })),
      );
    await message.channel.send(embed);
  }
}

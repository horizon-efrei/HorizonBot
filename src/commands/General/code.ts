import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { BucketScope } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import axios from 'axios';
import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { code as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import { convertSize, generateSubcommands, inlineCodeList } from '@/utils';

const wraps = {
  c: '#include <stdio.h>\n#include <stdlib.h>\nint main() { {code} }',
  cpp: '#include <iostream>\nint main() { {code} }',
  java: 'public class Main {\n\tpublic static void main(String[] args) {\n\t{code}\n\t}\n}',
  javascript: ';(async () => { {code} } )();',
} as const;

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  quotes: [],
  flags: ['wrap'],
  options: ['input'],
  preconditions: [{
    name: 'Cooldown',
    context: {
      // TODO?: Make it Guild?
      bucketType: BucketScope.User,
      delay: 60_000,
      limit: 3,
      silent: true,
    },
  }],
  subCommands: generateSubcommands(['list'], {
    main: { aliases: [], default: true },
  }),
})
export default class CodeCommand extends HorizonSubCommand {
  public async main(message: Message, args: Args): Promise<void> {
    if (this.container.client.remainingCompilerApiCredits <= 0) {
      await message.channel.send(config.messages.noMoreCredits);
      return;
    }

    const lang = await args.pickResult('codeLanguage');
    if (lang.error) {
      const languages = settings.languages.map(lng => lng.slugs[0]);
      await message.channel.send(pupa(config.messages.unknownLanguage, { languages: inlineCodeList(languages) }));
      return;
    }

    const shouldWrap = args.getFlags('wrap');
    const input = args.getOption('input');

    const codeArg = await args.restResult('code');
    if (codeArg.error) {
      await message.channel.send(config.messages.noCode);
      return;
    }
    let code = codeArg.value;
    if (shouldWrap && Object.keys(wraps).includes(lang.value.language))
      code = pupa(wraps[lang.value.language as keyof typeof wraps], { code });

    void message.channel.sendTyping();

    let response = { data: { cpuTime: 0, memory: 0, output: code } };
    if (settings.configuration.enableCompilerApi) {
      this.container.client.remainingCompilerApiCredits--;
      response = await axios.post(settings.apis.compiler, {
        script: code,
        stdin: input,
        language: lang.value.language,
        versionIndex: lang.value.versionIndex,
        clientId: process.env.COMPILERAPI_ID,
        clientSecret: process.env.COMPILERAPI_SECRET,
      });
    }

    await message.reply(
      pupa(config.messages.result, {
        message,
        lang,
        cpuTime: response.data.cpuTime ?? 0,
        memory: convertSize(response.data.memory),
      }),
    );
    // Ph (placeholder) prevents Discord from taking the first line as a language identifier for markdown and remove it
    await message.channel.send(`\`\`\`ph\n${response.data.output}\`\`\``);
  }

  public async list(message: Message, _args: Args): Promise<void> {
    const remaining = this.container.client.remainingCompilerApiCredits;
    const embed = new MessageEmbed()
      .setColor(settings.colors.default)
      .setDescription(pupa(config.messages.creditStatus, { remaining }))
      .addFields(
        settings.languages.map(lang => ({
          name: lang.display,
          value: pupa(config.messages.informationBlock, { lang, formattedSlugs: inlineCodeList(lang.slugs) }),
          inline: true,
        })),
      );
    await message.channel.send({ embeds: [embed] });
  }
}

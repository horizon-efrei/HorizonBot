
import { ApplyOptions } from '@sapphire/decorators';
import { SelectMenuLimits } from '@sapphire/discord-utilities';
import { BucketScope, Result } from '@sapphire/framework';
import axios from 'axios';
import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
} from 'discord.js';
import pupa from 'pupa';
import InteractionPrompter from '@/app/lib/structures/InteractionPrompter';
import type { CodeLanguageResult } from '@/app/lib/types';
import { code as config } from '@/config/commands/general';
import settings from '@/config/settings';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import { convertSize, extractCodeBlocks, trimText } from '@/utils';

const wraps = {
  c: '#include <stdio.h>\n#include <stdlib.h>\nint main() {\n\t{code}\n}',
  cpp: '#include <iostream>\nint main() {\n\t{code}\n}',
  java: 'public class Main {\n\tpublic static void main(String[] args) {\n\t{code}\n\t}\n}',
  nodejs: ';(async () => {\n\t{code}\n} )();',
} as const;

type WrappableLanguage = CodeLanguageResult & {
  language: keyof typeof wraps;
};

const isWrappable = (lang: CodeLanguageResult): lang is WrappableLanguage => Object.keys(wraps).includes(lang.language);

type ExtractedCodes = ReturnType<typeof extractCodeBlocks>;
const codeMenu = (codes: ExtractedCodes): ActionRowBuilder<StringSelectMenuBuilder> =>
  new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('code-select-menu')
      .setPlaceholder(config.messages.codeSelectMenu.placeholder)
      .addOptions(codes.map((code, i) => ({
        label: pupa(
          config.messages.codeSelectMenu[code.lang ? 'itemWithLanguage' : 'itemWithoutLanguage'],
          { i: i + 1, code },
        ),
        value: i.toString(),
        description: trimText(code.text, SelectMenuLimits.MaximumLengthOfNameOfOption),
      }))),
  );

const languageSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId('language-select-menu')
    .setPlaceholder(config.messages.languageSelectMenu.placeholder)
    .addOptions(settings.languages.map(option => ({
      label: option.display,
      value: option.language,
      description: option.version,
    }))),
);

const wrapConfirmation = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId('wrap-yes')
    .setLabel(config.messages.wrapConfirmation.yes)
    .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
    .setCustomId('wrap-no')
    .setLabel(config.messages.wrapConfirmation.no)
    .setStyle(ButtonStyle.Primary),
);

@ApplyOptions<HorizonCommand.Options>({
  ...config,
  preconditions: [{
    name: 'Cooldown',
    context: {
      bucketType: BucketScope.User,
      delay: 60_000,
      limit: 3,
    },
  }],
})
export default class CodeCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerContextMenuCommand(
      command => command
        .setName(this.descriptions.name)
        .setType(ApplicationCommandType.Message)
        .setDMPermission(false),
    );
  }

  public override async contextMenuRun(interaction: HorizonCommand.ContextMenuInteraction): Promise<void> {
    if (!interaction.channel)
      return;

    if (this.container.client.remainingCompilerApiCredits <= 0) {
      await interaction.reply({ content: this.messages.noMoreCredits, ephemeral: true });
      return;
    }

    const message = await interaction.channel.messages.fetch(interaction.targetId);
    if (!message) {
      await interaction.reply({ content: this.messages.messageNotFound, ephemeral: true });
      return;
    }

    const prompter = new InteractionPrompter(interaction);

    // 1. Extract code blocks from the message
    const codes = extractCodeBlocks(message.content);
    let codeToRun = codes[0]?.text ?? message.content;
    let language = settings.languages.find(lang => codes[0]?.lang && lang.slugs.includes(codes[0].lang));

    // 2. If multiple codes were found, ask the user which one to use
    if (codes.length > 1) {
      const result = await this._askWhichCode(prompter, codes);
      if (result.isErr())
        return;
      codeToRun = result.unwrap().codeToRun;
      language = result.unwrap().language;
    }

    // 3. Ask for the language, if necessary
    if (!language) {
      const result = await this._askLanguage(prompter);
      if (result.isErr())
        return;
      language = result.unwrap();
    }

    // 4. Ask for the wrapping, if necessary
    if (isWrappable(language)) {
      const result = await this._askShouldWrap(prompter, language);
      if (result.isErr())
        return;

      if (result.unwrap())
        codeToRun = pupa(wraps[language.language], { code: codeToRun });
    }

    // 5. Run the code
    this.container.client.remainingCompilerApiCredits--;
    const response = await axios.post(settings.apis.compiler, {
      script: codeToRun,
      language: language.language,
      versionIndex: language.versionIndex,
      clientId: process.env.COMPILERAPI_ID,
      clientSecret: process.env.COMPILERAPI_SECRET,
    });

    // 6. Send the response
    await prompter.send({
      content: pupa(config.messages.result, {
        language,
        cpuTime: response.data.cpuTime ?? 0,
        memory: convertSize(response.data.memory as number),
        output: response.data.output,
      }),
      components: [],
    });
  }

  private async _askWhichCode(
    prompter: InteractionPrompter,
    codes: ExtractedCodes,
  ): Promise<Result<{ codeToRun: string; language: CodeLanguageResult | undefined }, null>> {
    await prompter.send({ content: this.messages.codeSelectMenu.prompt, components: [codeMenu(codes)] });

    // 2.b Get the language response
    const codeInteraction = await prompter.awaitMessageComponent({
      componentType: ComponentType.SelectMenu,
      filter: int => int.customId === 'code-select-menu' && int.user.id === prompter.interaction.user.id,
    });
    if (codeInteraction.isErr())
      return Result.err(null);

    const chosenCode = codes[Number(codeInteraction.unwrap().values[0])];
    return Result.ok({
      codeToRun: chosenCode.text,
      language: settings.languages.find(lang => chosenCode.lang && lang.slugs.includes(chosenCode.lang)),
    });
  }

  private async _askLanguage(prompter: InteractionPrompter): Promise<Result<CodeLanguageResult, null>> {
    await prompter.send({ content: this.messages.languageSelectMenu.prompt, components: [languageSelectMenu] });

    // 3.b Get the language response
    const languageInteraction = await prompter.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: int => int.customId === 'language-select-menu' && int.user.id === prompter.interaction.user.id,
    });
    if (languageInteraction.isErr())
      return Result.err(null);

    return Result.ok(
      settings.languages.find(lang => lang.language === languageInteraction.unwrap().values[0])!,
    );
  }

  private async _askShouldWrap(
    prompter: InteractionPrompter,
    language: WrappableLanguage,
  ): Promise<Result<boolean, null>> {
    await prompter.send({
      content: pupa(this.messages.wrapConfirmation.prompt, {
        code: pupa(wraps[language.language], { code: '// Ton code ici...' }),
        wrapName: this.messages.wrapNames[language.language],
      }),
      components: [wrapConfirmation],
    });

    // 4.b Get the wrapping response
    const wrapInteraction = await prompter.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: int => ['wrap-yes', 'wrap-no'].includes(int.customId) && int.user.id === prompter.interaction.user.id,
    });
    if (wrapInteraction.isErr())
      return Result.err(null);

    // 4.c Wrap the code if necessary
    return Result.ok(wrapInteraction.unwrap().customId === 'wrap-yes');
  }
}

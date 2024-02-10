import { ApplyOptions } from '@sapphire/decorators';
import { EmbedBuilder } from 'discord.js';
import pupa from 'pupa';
import { faq as config } from '@/config/commands/general';
import { Faq } from '@/models/faq';
import { PaginatedContentMessageEmbed } from '@/structures/PaginatedContentMessageEmbed';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Name = 'nom',
}

@ApplyOptions<HorizonCommand.Options>(config)
export class FaqCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .addStringOption(
          option => option
            .setName(Options.Name)
            .setDescription(this.descriptions.options.name)
            .setAutocomplete(true),
        ),
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const name = interaction.options.getString(Options.Name);
    const faq = await Faq.findOne({ guildId: interaction.guildId, name });

    if (!faq) {
      const questions = await Faq.find({ guildId: interaction.guildId });
      if (questions.length === 0) {
        await interaction.reply({ content: this.messages.noEntries, ephemeral: true });
        return;
      }

      await new PaginatedContentMessageEmbed()
        .setTemplate(new EmbedBuilder().setTitle(pupa(this.messages.listTitle, { total: questions.length })))
        .setItems(questions.map(t => pupa(this.messages.listLine, { name: t.name, uses: t.uses })))
        .setItemsPerPage(10)
        .make()
        .run(interaction);
      return;
    }

    await interaction.reply(faq.content);
    faq.uses++;
    await faq.save();
  }
}

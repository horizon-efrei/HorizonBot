import { ApplyOptions } from '@sapphire/decorators';
import { EmbedBuilder } from 'discord.js';
import pupa from 'pupa';
import { tag as config } from '@/config/commands/general';
import { settings } from '@/config/settings';
import { Tag } from '@/models/tags';
import { PaginatedContentMessageEmbed } from '@/structures/PaginatedContentMessageEmbed';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Name = 'nom',
}

@ApplyOptions<HorizonCommand.Options>(config)
export class TagCommand extends HorizonCommand<typeof config> {
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
    const tag = await Tag.findOne({ guildId: interaction.guildId, name });

    if (!tag) {
      const tags = await Tag.find({ guildId: interaction.guildId });
      if (tags.length === 0) {
        await interaction.reply({ content: this.messages.noTags, ephemeral: true });
        return;
      }

      await new PaginatedContentMessageEmbed()
        .setTemplate(new EmbedBuilder().setTitle(pupa(this.messages.listTitle, { total: tags.length })))
        .setItems(tags.map(t => pupa(this.messages.listLine, { name: t.name, uses: t.uses })))
        .setItemsPerPage(10)
        .make()
        .run(interaction);
      return;
    }

    if (tag.isEmbed) {
      const embed = new EmbedBuilder()
        .setColor(settings.colors.default)
        .setDescription(tag.content)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply(tag.content);
    }
    tag.uses++;
    await tag.save();
  }
}

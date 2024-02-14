import { ApplyOptions } from '@sapphire/decorators';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { AttachmentBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { AnnouncementMessage } from '@/app/lib/models/announcementMessage';
import { messages } from '@/config/messages';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class PreAnnouncementCopyButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction): Option<never> {
    if (interaction.customId !== 'pre-announcement-copy' || !interaction.channel?.isThread())
      return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction<'cached'>): Promise<void> {
    const messageData = await AnnouncementMessage.findOne({ preAnnouncementThreadId: interaction.channelId });
    if (!messageData) {
      await interaction.reply({ content: messages.preAnnouncements.noAnnouncement, ephemeral: true });
      return;
    }

    const announcementChannel = interaction.guild.channels.resolve(messageData.announcementChannelId);
    if (!announcementChannel?.isTextBased()) {
      await interaction.reply({ content: messages.preAnnouncements.copyButton.noAnnouncementChannel, ephemeral: true });
      return;
    }

    const announcementMessage = await announcementChannel.messages.fetch(messageData.announcementMessageId);
    if (!announcementMessage) {
      await interaction.reply({ content: messages.preAnnouncements.copyButton.noAnnouncementMessage, ephemeral: true });
      return;
    }

    await interaction.reply({
      content: messages.preAnnouncements.copyButton.success,
      ephemeral: true,
      files: [
        new AttachmentBuilder(Buffer.from(announcementMessage.content), { name: 'Annonce.txt' }),
      ],
    });
  }
}

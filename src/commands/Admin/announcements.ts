import { ApplyOptions } from '@sapphire/decorators';
import { MessageLinkRegex } from '@sapphire/discord-utilities';
import { Result } from '@sapphire/framework';
import type {
  AnyThreadChannel,
  GuildTextBasedChannel,
  Message,
  Webhook,
} from 'discord.js';
import { ChannelType, PermissionsBitField } from 'discord.js';
import { announcements as config } from '@/config/commands/admin';
import { messages } from '@/config/messages';
import { settings } from '@/config/settings';
import { AnnouncementMessage } from '@/models/announcementMessage';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';
import { nullop } from '@/utils';

enum Options {
  Channel = 'salon',
  MessageLink = 'lien-message',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'send', chatInputRun: 'send' },
    { name: 'edit', chatInputRun: 'edit' },
  ],
})
export class SetupCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MentionEveryone)
        .addSubcommand(
          subcommand => subcommand
            .setName('send')
            .setDescription(this.descriptions.subcommands.send)
            .addChannelOption(
              option => option
                .setName(Options.Channel)
                .setDescription(this.descriptions.options.channel)
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('edit')
            .setDescription(this.descriptions.subcommands.edit)
            .addStringOption(
              option => option
                .setName(Options.MessageLink)
                .setDescription(this.descriptions.options.messageLink)
                .setRequired(false),
            ),
        ),
    );
  }

  public async send(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.channel?.isThread()) {
      await interaction.followUp(this.messages.errorThreadOnly);
      return;
    }

    const starterMessage = await interaction.channel.fetchStarterMessage();
    if (!starterMessage) {
      await interaction.followUp(this.messages.errorNoStarterMessage);
      return;
    }

    const destinationChannel = interaction.options.getChannel<ChannelType.GuildText>(Options.Channel, true);
    const webhook = await this._getWebhook(destinationChannel);
    if (webhook.isErr()) {
      await interaction.followUp(webhook.unwrapErr());
      return;
    }

    try {
      const announcementMessage = await webhook.unwrap().send({
        content: starterMessage.content,
        files: starterMessage.attachments.map(attachment => attachment.url),
      });

      await AnnouncementMessage.create({
        announcementChannelId: destinationChannel.id,
        announcementMessageId: announcementMessage.id,
        preAnnouncementChannelId: interaction.channel.parentId,
        preAnnouncementThreadId: interaction.channelId,
        guildId: interaction.guildId,
      });
    } catch {
      await interaction.followUp(this.messages.errorWebhookSend);
      return;
    }

    await interaction.followUp(this.messages.success);

    await interaction.channel.send({
      content: this.messages.announcementSent,
      components: [...messages.preAnnouncements.copyButton.components],
    });
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.channel?.isThread()) {
      await interaction.followUp(this.messages.errorThreadOnly);
      return;
    }

    const messageData = await AnnouncementMessage.findOne({ preAnnouncementThreadId: interaction.channelId });
    if (!messageData) {
      await interaction.followUp(messages.preAnnouncements.noAnnouncement);
      return;
    }

    let sourceMessage: Message;

    const messageLink = interaction.options.getString(Options.MessageLink);
    if (messageLink) {
      const matches = MessageLinkRegex.exec(messageLink);
      if (!matches) {
        await interaction.followUp(this.messages.errorMessageNotFound);
        return;
      }

      const [channelId, messageId] = [matches[2], matches[3]];
      const resolvedChannel = await interaction.guild.channels.fetch(channelId).catch(nullop);
      if (!resolvedChannel?.isTextBased()) {
        await interaction.followUp(this.messages.errorMessageNotFound);
        return;
      }

      const resolvedMessage = await resolvedChannel.messages.fetch(messageId).catch(nullop);
      if (!resolvedMessage) {
        await interaction.followUp(this.messages.errorMessageNotFound);
        return;
      }

      sourceMessage = resolvedMessage;
    } else {
      const starterMessage = await interaction.channel.fetchStarterMessage();
      if (!starterMessage) {
        await interaction.followUp(this.messages.errorNoStarterMessage);
        return;
      }

      sourceMessage = starterMessage;
    }

    const destinationChannel = interaction.guild.channels.resolve(messageData.announcementChannelId);
    if (!destinationChannel?.isTextBased() || destinationChannel.isThread()) {
      await interaction.followUp(this.messages.errorDestinationChannelNotFound);
      return;
    }

    const webhook = await this._getWebhook(destinationChannel);
    if (webhook.isErr()) {
      await interaction.followUp(webhook.unwrapErr());
      return;
    }

    try {
      await webhook.unwrap().editMessage(messageData.announcementMessageId, {
        content: sourceMessage.content,
        files: sourceMessage.attachments.map(attachment => attachment.url),
      });
    } catch {
      await interaction.followUp(this.messages.errorWebhookSend);
      return;
    }

    await interaction.followUp(this.messages.success);

    await interaction.channel.send({
      content: this.messages.announcementSent,
      components: [...messages.preAnnouncements.copyButton.components],
    });
  }

  private async _getWebhook(
    channel: Exclude<GuildTextBasedChannel, AnyThreadChannel>,
  ): Promise<Result<Webhook, string>> {
    const allWebhooks = await channel.fetchWebhooks();
    const webhooks = allWebhooks.filter(wh =>
      wh.isIncoming() && wh.name.startsWith(settings.configuration.announcementWebhookPrefix));

    if (webhooks.size > 1)
      return Result.err(this.messages.errorMultipleWebhooks);

    const webhook = webhooks.first()
      ?? await channel.createWebhook({
        name: `${settings.configuration.announcementWebhookPrefix} Annonces`,
        avatar: settings.configuration.announcementWebhookAvatar,
      });

    return Result.ok(webhook);
  }
}

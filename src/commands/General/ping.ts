import { ApplyOptions } from '@sapphire/decorators';
import { Message } from 'discord.js';
import pupa from 'pupa';
import { ping as config } from '@/config/commands/general';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

@ApplyOptions<HorizonCommand.Options>(config)
export default class PingCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(true),
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const defer = await interaction.deferReply({ fetchReply: true });
    if (!(defer instanceof Message))
      return;

    const botPing = (defer.editedAt ?? defer.createdAt).getTime() - interaction.createdAt.getTime();
    const apiPing = Math.round(this.container.client.ws.ping);

    await interaction.followUp(pupa(this.messages.message, { botPing, apiPing }));
  }
}

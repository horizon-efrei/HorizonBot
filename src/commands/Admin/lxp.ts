import { ApplyOptions } from '@sapphire/decorators';
import { Permissions } from 'discord.js';
import pupa from 'pupa';
import { lxp as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import { EclassStatus } from '@/types/database';
import { firstSemesterDay } from '@/utils';

interface AggregatedEclass {
  _id: string;
  time: number;
}

@ApplyOptions<HorizonCommand.Options>(config)
export default class LxpCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD),
      { guildIds: settings.mainGuildIds },
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const firstDate = firstSemesterDay();
    const result = await Eclass.aggregate<AggregatedEclass>([
      {
        $match: {
          date: { $gte: firstDate.toDate() },
          status: { $ne: EclassStatus.Canceled },
        },
      }, {
        $group: {
          _id: '$professorId',
          time: {
            $sum: { $divide: ['$duration', 60 * 60 * 1000] },
          },
        },
      },
    ]);

    const firstDay = firstDate.format(settings.configuration.dayFormat);

    if (result.length === 0) {
      await interaction.reply(pupa(this.messages.noEclasses, { firstDay }));
      return;
    }

    await interaction.reply(
      pupa(this.messages.summary, { firstDay })
      + result
        .map(({ _id, time }) => pupa(this.messages.summaryLine, { prof: _id, time: time.toFixed(1) }))
        .join(',\n'),
    );
  }
}

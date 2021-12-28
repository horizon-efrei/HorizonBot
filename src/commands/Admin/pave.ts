import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { stripIndent } from 'common-tags';
import pupa from 'pupa';
import { pave as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { EclassStatus } from '@/types/database';
import { firstSemesterDay } from '@/utils';

interface AggregatedEclass {
  _id: string;
  time: number;
}

@ApplyOptions<CommandOptions>({
  ...config.options,
  preconditions: ['GuildOnly', 'AdminOnly'],
})
export default class PaveCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage): Promise<void> {
    const firstDate = firstSemesterDay();
    const result: AggregatedEclass[] = await Eclass.aggregate([
      {
        $match: {
          date: { $gte: firstDate.unix() * 1000 },
          status: { $ne: EclassStatus.Canceled },
        },
      }, {
        $group: {
          _id: '$professor',
          time: {
            $sum: { $divide: ['$duration', 60 * 60 * 1000] },
          },
        },
      },
    ]);

    const firstDay = firstDate.format(settings.configuration.dayFormat);

    if (result.length === 0) {
      await message.channel.send(pupa(config.messages.noEclasses, { firstDay }));
      return;
    }

    await message.channel.send(stripIndent`
      ${pupa(config.messages.summary, { firstDay })}
      ${result.map(({ _id, time }) => pupa(config.messages.summaryLine, { prof: _id, time: time.toFixed(1) }))}
    `);
  }
}

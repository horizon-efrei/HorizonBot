/* eslint-disable unicorn/no-thenable */
import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import dayjs from 'dayjs';
import {
  EmbedBuilder,
  PermissionsBitField,
  time,
  TimestampStyles,
} from 'discord.js';
import pupa from 'pupa';
import { analytics as config } from '@/config/commands/admin';
import { messages } from '@/config/messages';
import { settings } from '@/config/settings';
import { Eclass } from '@/models/eclass';
import { EclassParticipation } from '@/models/eclassParticipation';
import { resolveDate } from '@/resolvers';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { EclassDocument } from '@/types/database';
import { makeMessageLink } from '@/utils';

enum Options {
  Query = 'query',
  ClassId = 'class-id',
  After = 'après',
}

interface AttendanceHeatmapResult {
  date: {
    year: number;
    month: number;
    day: number;
  };
  count: number;
}

interface AverageAttendanceDurationResult {
  isSubscribed: boolean;
  averageDuration: number;
}

interface EclassPopularityResult {
  count: number;
  subscribedCount: number;
  nonSubscribedCount: number;
  eclass: EclassDocument;
}

interface JoinsOverTimeResult {
  timestamp: number;
  total: number;
  isSubscribed: number;
  notSubscribed: number;
}

interface SubscriptionImpactResult {
  isSubscribed: boolean;
  count: number;
  averageDuration: number;
  retention: number;
}

interface CountResult {
  count: number;
}

interface RetentionRateResult {
  isSubscribed: boolean;
  userRetention: number;
}

const queries = [
  { name: 'attendance-heatmap', value: 'attendance-heatmap' },
  { name: 'average-attendance-duration', value: 'average-attendance-duration' },
  { name: 'eclass-popularity', value: 'eclass-popularity' },
  { name: 'joins-over-time', value: 'joins-over-time' },
  { name: 'subscription-impact', value: 'subscription-impact' },
  { name: 'totals', value: 'totals' },
  { name: 'retention-rate', value: 'retention-rate' },
] as const;

@ApplyOptions<HorizonCommand.Options>(config)
export class AnalyticsCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addStringOption(
          option => option
            .setName(Options.Query)
            .setDescription(this.descriptions.options.query)
            .setChoices(...queries)
            .setRequired(false),
        )
        .addStringOption(
          option => option
            .setName(Options.ClassId)
            .setDescription(this.descriptions.options.classId)
            .setAutocomplete(true)
            .setRequired(false),
        )
        .addStringOption(
          option => option
            .setName(Options.After)
            .setDescription(this.descriptions.options.after)
            .setRequired(false),
        ),
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    switch (interaction.options.getString(Options.Query)) {
      case queries[0].value: {
        const data = await this._attendanceHeatmap();
        const content = data.map(({ date, count }) => {
          const parsedDate = new Date(date.year, date.month - 1, date.day);
          return `${time(parsedDate, TimestampStyles.LongDate)}: ${count}`;
        }).join('\n');
        await interaction.reply(pupa(this.messages.attendanceHeatmap, { content }));
        break;
      }

      case queries[1].value: {
        const data = await this._averageAttendanceDuration();
        const subscribed = dayjs.duration(data.find(doc => doc.isSubscribed)!.averageDuration).humanize();
        const unsubscribed = dayjs.duration(data.find(doc => !doc.isSubscribed)!.averageDuration).humanize();
        await interaction.reply(pupa(this.messages.averageAttendanceDuration, { subscribed, unsubscribed }));
        break;
      }

      case queries[2].value: {
        const data = await this._eclassPopularity();

        const content = data
          .filter(({ eclass }) => Boolean(eclass))
          .map(({
            eclass, count, subscribedCount, nonSubscribedCount,
          }) => pupa(this.messages.eclassPopularityLine, {
              eclass,
              link: this._getMessageLink(eclass),
              count,
              subscribedCount,
              nonSubscribedCount,
            }))
          .join('\n');
        await interaction.reply(pupa(this.messages.eclassPopularity, { content }));
        break;
      }

      case queries[3].value: {
        const classId = interaction.options.getString(Options.ClassId);
        const eclass = await Eclass.findOne({ classId });
        if (!eclass?.id) {
          await interaction.reply({ content: this.messages.eclassNotFound, ephemeral: true });
          return;
        }

        const data = await this._joinsOverTime(eclass.id as string);
        const content = data.map(({ timestamp, ...values }) => {
          const date = new Date(timestamp);
          return pupa(this.messages.joinsOverTimeLine, { date, ...values });
        }).join('\n');

        await interaction.reply(pupa(this.messages.joinsOverTime, { content }));
        break;
      }

      case queries[4].value: {
        const data = await this._subscriptionImpact();

        const subscribed = data.find(doc => doc.isSubscribed)!;
        const unsubscribed = data.find(doc => !doc.isSubscribed)!;

        await interaction.reply(pupa(this.messages.subscriptionImpact, {
          subscribed: {
            ...subscribed,
            averageDuration: dayjs.duration(subscribed.averageDuration).humanize(),
            retention: Math.round(subscribed.retention * 100),
          },
          unsubscribed: {
            ...unsubscribed,
            averageDuration: dayjs.duration(unsubscribed.averageDuration).humanize(),
            retention: Math.round(unsubscribed.retention * 100),
          },
        }));
        break;
      }

      case queries[5].value: {
        const after = resolveDate(interaction.options.getString(Options.After) ?? '').unwrapOr(interaction.guild.createdAt);
        const data = await this._totals(after);

        await interaction.reply(pupa(this.messages.totals, {
          eclassCount: data.numberEclasses.count,
          eclassDuration: dayjs.duration(data.hoursEclasses.count).humanize(),
          participations: data.participants.count,
        }));
        break;
      }

      case queries[6].value: {
        const data = await this._retentionRate();

        const subscribed = data.find(doc => doc.isSubscribed)!.userRetention;
        const unsubscribed = data.find(doc => !doc.isSubscribed)!.userRetention;

        await interaction.reply(pupa(this.messages.retentionRate, {
          subscribed: Math.round(subscribed * 100),
          unsubscribed: Math.round(unsubscribed * 100),
        }));
        break;
      }

      default: {
        const paginator = new PaginatedMessage({ template: new EmbedBuilder().setColor(settings.colors.default) })
          .setWrongUserInteractionReply(user => ({
            content: pupa(messages.errors.wrongUserInteractionReply, { user }),
            ephemeral: true,
            allowedMentions: { users: [], roles: [] },
          }))
          .setSelectMenuOptions(pageIndex => ({ label: this.messages.pipelines[pageIndex - 1].title }));

        for (const pipeline of this.messages.pipelines)
          paginator.addPageEmbed(embed => embed.setTitle(pipeline.title).setDescription(pipeline.value));

        await paginator.run(interaction);
        break;
      }
    }
  }

  private _getMessageLink(eclass: EclassDocument): string {
    const channel = this.container.client.configManager.getFromCache(eclass.announcementChannelId, eclass.guildId);
    if (!channel)
      throw new Error(`Could not find [eclass:${eclass.classId}] announcement's channel (${eclass.announcementChannelId}).`);
    return makeMessageLink(eclass.guildId, channel.id, eclass.announcementMessageId);
  }

  private async _attendanceHeatmap(): Promise<AttendanceHeatmapResult[]> {
    return await EclassParticipation.aggregate<AttendanceHeatmapResult>([
      {
        $group: {
          _id: {
            year: { $year: '$joinedAt' },
            month: { $month: '$joinedAt' },
            day: { $dayOfMonth: '$joinedAt' },
          },
          count: { $sum: 1 },
        },
      }, {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      }, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);
  }

  private async _averageAttendanceDuration(): Promise<AverageAttendanceDurationResult[]> {
    return await EclassParticipation.aggregate<AverageAttendanceDurationResult>([
      {
        $match: { leftAt: { $ne: null } },
      }, {
        $addFields: {
          duration: {
            $subtract: ['$leftAt', '$joinedAt'],
          },
        },
      }, {
        $group: {
          _id: {
            userId: '$anonUserId',
            eclass: 'eclass',
            isSubscribed: '$isSubscribed',
          },
          totalDuration: { $sum: '$duration' },
        },
      }, {
        $group: {
          _id: '$_id.isSubscribed',
          averageDuration: { $avg: '$totalDuration' },
        },
      }, {
        $project: {
          _id: 0,
          isSubscribed: '$_id',
          averageDuration: 1,
        },
      },
    ]);
  }

  private async _eclassPopularity(): Promise<EclassPopularityResult[]> {
    return await EclassParticipation.aggregate<EclassPopularityResult>([
      {
        $group: {
          _id: '$eclass',
          count: { $sum: 1 },
          subscribedCount: {
            $sum: { $cond: { if: '$isSubscribed', then: 1, else: 0 } },
          },
          nonSubscribedCount: {
            $sum: { $cond: { if: '$isSubscribed', then: 0, else: 1 } },
          },
        },
      }, {
        $sort: { count: -1 },
      }, {
        $lookup: {
          from: 'eclasses',
          localField: '_id',
          foreignField: '_id',
          as: 'eclass',
        },
      }, {
        $project: {
          _id: 0,
          count: 1,
          subscribedCount: 1,
          nonSubscribedCount: 1,
          eclass: { $arrayElemAt: ['$eclass', 0] },
        },
      },
    ]);
  }

  private async _joinsOverTime(classId: string): Promise<JoinsOverTimeResult[]> {
    return await EclassParticipation.aggregate<JoinsOverTimeResult>([
      {
        $match: { eclass: classId },
      }, {
        $project: {
          joinedAt: 1,
          leftAt: 1,
          isSubscribed: 1,
          joinedAtBucket: {
            $subtract: [
              '$joinedAt',
              { $mod: [{ $toLong: '$joinedAt' }, 1000 * 60 * 5] },
            ],
          },
          leftAtBucket: {
            $subtract: [
              '$leftAt',
              { $mod: [{ $toLong: '$leftAt' }, 1000 * 60 * 5] },
            ],
          },
        },
      }, {
        $group: {
          _id: {
            joinedAtBucket: '$joinedAtBucket',
            isSubscribed: '$isSubscribed',
          },
          count: { $sum: 1 },
        },
      }, {
        $group: {
          _id: '$_id.joinedAtBucket',
          total: { $sum: '$count' },
          isSubscribed: {
            $sum: { $cond: { if: '$_id.isSubscribed', then: '$count', else: 0 } },
          },
          notSubscribed: {
            $sum: { $cond: { if: '$_id.isSubscribed', then: 0, else: '$count' } },
          },
        },
      }, {
        $project: {
          _id: 0,
          timestamp: '$_id',
          total: 1,
          isSubscribed: 1,
          notSubscribed: 1,
        },
      }, {
        $sort: { timestamp: 1 },
      },
    ]);
  }

  private async _subscriptionImpact(): Promise<SubscriptionImpactResult[]> {
    return await EclassParticipation.aggregate<SubscriptionImpactResult>([
      {
        $group: {
          _id: '$isSubscribed',
          count: { $sum: 1 },
          averageDuration: {
            $avg: { $subtract: ['$leftAt', '$joinedAt'] },
          },
          retention: {
            $avg: {
              $cond: { if: { $gte: ['$count', 2] }, then: 1, else: 0 },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          isSubscribed: '$_id',
          count: 1,
          averageDuration: 1,
          retention: 1,
        },
      },
    ]);
  }

  private async _totals(after: Date): Promise<{
    numberEclasses: CountResult;
    hoursEclasses: CountResult;
    participants: CountResult;
  }> {
    const [numberEclasses] = await Eclass.aggregate<CountResult>([
      {
        $match: { date: { $gte: after } },
      }, {
        $count: 'count',
      },
    ]);
    const [hoursEclasses] = await Eclass.aggregate<CountResult>([
      {
        $match: { date: { $gte: after } },
      }, {
        $group: {
          _id: null,
          count: { $sum: '$duration' },
        },
      },
    ]);
    const [participants] = await Eclass.aggregate<CountResult>([
      {
        $match: { date: { $gte: after } },
      }, {
        $project: { tot: { $size: '$subscriberIds' } },
      }, {
        $group: {
          _id: null,
          count: { $sum: '$tot' },
        },
      },
    ]);

    return { numberEclasses, hoursEclasses, participants };
  }

  private async _retentionRate(): Promise<RetentionRateResult[]> {
    return await EclassParticipation.aggregate<RetentionRateResult>([
      {
        $group: {
          _id: '$anonUserId',
          count: { $sum: 1 },
          isSubscribed: { $first: '$isSubscribed' },
        },
      }, {
        $group: {
          _id: '$isSubscribed',
          userRetention: {
            $avg: { $cond: { if: { $gte: ['$count', 2] }, then: 1, else: 0 } },
          },
        },
      }, {
        $project: {
          _id: 0,
          isSubscribed: '$_id',
          userRetention: 1,
        },
      },
    ]);
  }
}

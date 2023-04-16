import { Listener, Option } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';
import Eclass from '@/models/eclass';
import EclassParticipation from '@/models/eclassParticipation';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import type { EclassPopulatedDocument } from '@/types/database';
import { DiscordLogType, EclassStatus, EclassStep } from '@/types/database';

export default class VoiceStateUpdateListener extends Listener {
  public async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!oldState.member || !newState.member)
      return;

    if (!oldState.channel && newState.channel)
      await this._join(newState);
    else if (oldState.channel && !newState.channel)
      await this._leave(oldState);
    else if (oldState.channel && newState.channel && oldState.channel?.id !== newState.channel?.id)
      await this._moved(newState, oldState);
  }

  private async _join(state: VoiceState): Promise<void> {
    await DiscordLogManager.logAction({
      type: DiscordLogType.VoiceJoin,
      context: state.member!.id,
      content: state.channel!.id,
      guildId: state.guild.id,
      severity: 1,
    });

    const eclass = await this._eclassesInProgressInChannel(state.channel!.id);
    if (eclass.isSome()) {
      await EclassParticipation.create({
        anonUserId: EclassParticipation.generateHash(state.member!.id),
        eclass: eclass.unwrap()._id,
        joinedAt: new Date(),
        isSubscribed: eclass.unwrap().subscriberIds.includes(state.member!.id),
      });
    }
  }

  private async _leave(state: VoiceState): Promise<void> {
    await DiscordLogManager.logAction({
      type: DiscordLogType.VoiceLeave,
      context: state.member!.id,
      content: state.channel!.id,
      guildId: state.guild.id,
      severity: 1,
    });

    if (this.container.client.currentlyRunningEclassIds.size === 0)
      return;

    const eclass = await this._eclassesInProgressInChannel(state.channel!.id);
    if (eclass.isSome()) {
      await EclassParticipation.findOneAndUpdate(
        {
          anonUserId: EclassParticipation.generateHash(state.member!.id),
          eclass: eclass.unwrap()._id,
          leftAt: null,
        },
        { leftAt: new Date() },
      );
    }
  }

  private async _moved(newState: VoiceState, oldState: VoiceState): Promise<void> {
    await DiscordLogManager.logAction({
      type: DiscordLogType.VoiceMove,
      context: newState.member!.id,
      content: { before: oldState.channel!.id, after: newState.channel!.id },
      guildId: newState.guild.id,
      severity: 1,
    });

    if (this.container.client.currentlyRunningEclassIds.size === 0)
      return;

    const leavingEclass = await this._eclassesInProgressInChannel(oldState.channel!.id);
    if (leavingEclass.isSome()) {
      await EclassParticipation.findOneAndUpdate(
        {
          anonUserId: EclassParticipation.generateHash(oldState.member!.id),
          eclass: leavingEclass.unwrap()._id,
          leftAt: null,
        },
        { leftAt: new Date() },
      );
    }

    const joiningEclass = await this._eclassesInProgressInChannel(newState.channel!.id);
    if (joiningEclass.isSome()) {
      await EclassParticipation.create({
        anonUserId: EclassParticipation.generateHash(newState.member!.id),
        eclass: joiningEclass.unwrap()._id,
        joinedAt: new Date(),
        isSubscribed: joiningEclass.unwrap().subscriberIds.includes(newState.member!.id),
      });
    }
  }

  private async _eclassesInProgressInChannel(channelId: string): Promise<Option<EclassPopulatedDocument>> {
    // TODO: Cache/memoize the result of the database call for a few minutes
    const eclassesInProgress = await Eclass.find({
      $or: [
        { step: EclassStep.Prepared },
        { end: { $gte: new Date(Date.now() - 5 * 60 * 1000), $lte: new Date(Date.now() + 5 * 60 * 1000) } },
        { status: EclassStatus.InProgress },
      ],
    });

    const eclass = eclassesInProgress.find(c => c.subject.voiceChannelId === channelId);
    return Option.from(eclass);
  }
}

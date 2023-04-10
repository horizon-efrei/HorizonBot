import { Listener } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';
import Eclass from '@/models/eclass';
import EclassParticipation from '@/models/eclassParticipation';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

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

    if (this.container.client.currentlyRunningEclassIds.size === 0)
      return;

    // TODO: Cache this
    const eclassesInProgress = await Eclass.find({
      classId: { $in: this.container.client.currentlyRunningEclassIds.values().toArray() },
    });

    const eclass = eclassesInProgress.find(c => c.subject.voiceChannelId === state.channel!.id);
    if (eclass) {
      await EclassParticipation.create({
        anonUserId: EclassParticipation.generateHash(state.member!.id),
        classId: eclass.classId,
        joinedAt: new Date(),
        isSubscribed: eclass.subscriberIds.includes(state.member!.id),
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

    // TODO: Cache this
    const eclassesInProgress = await Eclass.find({
      classId: { $in: this.container.client.currentlyRunningEclassIds.values().toArray() },
    });

    const eclass = eclassesInProgress.find(c => c.subject.voiceChannelId === state.channel!.id);
    if (eclass) {
      await EclassParticipation.findOneAndUpdate(
        { anonUserId: EclassParticipation.generateHash(state.member!.id), classId: eclass.classId, leftAt: null },
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

    // TODO: Cache this
    const eclassesInProgress = await Eclass.find({
      classId: { $in: this.container.client.currentlyRunningEclassIds.values().toArray() },
    });

    const leavingEclass = eclassesInProgress.find(c => c.subject.voiceChannelId === oldState.channel!.id);
    if (leavingEclass) {
      await EclassParticipation.findOneAndUpdate(
        {
          anonUserId: EclassParticipation.generateHash(oldState.member!.id),
          classId: leavingEclass.classId,
          leftAt: null,
        },
        { leftAt: new Date() },
      );
    }

    const joiningEclass = eclassesInProgress.find(c => c.subject.voiceChannelId === newState.channel!.id);
    if (joiningEclass) {
      await EclassParticipation.create({
        anonUserId: EclassParticipation.generateHash(newState.member!.id),
        classId: joiningEclass.classId,
        joinedAt: new Date(),
        isSubscribed: joiningEclass.subscriberIds.includes(newState.member!.id),
      });
    }
  }
}

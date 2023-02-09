import { ApplyOptions } from '@sapphire/decorators';
import settings from '@/config/settings';
import * as EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';
import { EclassStatus, EclassStep } from '@/types/database';

@ApplyOptions<TaskOptions>({ interval: 2 * 60 * 1000 /* Every 2 minutes */ })
export default class ManageEclassTask extends Task {
  public async run(): Promise<void> {
    const eclasses = Eclass.find({
      // This queries find classes that:
      // - are planned, and we are 15 minutes before (to send a reminder)
      // - are planned, and we reached the beginning (to start it)
      // - are in progress, and we reach the end (to finish it)
      // - are finished since a week (to delete its associated role)
      $or: [{
        status: EclassStatus.Planned,
        date: { $lte: Date.now() + settings.configuration.eclassReminderTime },
        step: EclassStep.None,
      }, {
        status: EclassStatus.Planned,
        date: { $lte: Date.now() },
        step: EclassStep.Reminded,
      }, {
        status: EclassStatus.InProgress,
        end: { $lte: Date.now() },
      }, {
        status: EclassStatus.Finished,
        end: { $lte: Date.now() - settings.configuration.eclassRoleExpiration },
        step: EclassStep.Reminded,
      }],
    });

    for await (const eclass of eclasses) {
      if (eclass.status === EclassStatus.Planned && eclass.step === EclassStep.None)
        await EclassManager.remindClass(eclass);
      else if (eclass.status === EclassStatus.Planned && eclass.step === EclassStep.Reminded)
        await EclassManager.startClass(eclass);
      else if (eclass.status === EclassStatus.InProgress)
        await EclassManager.finishClass(eclass);
      else if (eclass.status === EclassStatus.Finished && eclass.step === EclassStep.Reminded)
        await EclassManager.cleanupClass(eclass);
    }
  }
}

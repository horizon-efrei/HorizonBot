import { ApplyOptions } from '@sapphire/decorators';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import EclassManager from '@/structures/EclassManager';
import Task from '@/structures/Task';
import type { TaskOptions } from '@/structures/Task';
import { EclassStatus } from '@/types/database';

@ApplyOptions<TaskOptions>({ interval: 2 * 60 * 1000 /* Every 2 minutes */ })
export default class ManageEclassTask extends Task {
  public async run(): Promise<void> {
    const eclasses = await Eclass.find({
      // This queries find classes that:
      // - are planned and we reached the beggining (to start it)
      // - are planned and we are 15 minutes before (to send a reminder)
      // - are in progress and we reach the end (to finish it)
      $or: [{
        status: EclassStatus.Planned,
        date: { $lte: Date.now() },
        reminded: true,
      }, {
        status: EclassStatus.Planned,
        date: { $lte: Date.now() + settings.configuration.eclassReminderTime },
        reminded: false,
      }, {
        status: EclassStatus.InProgress,
        end: { $lte: Date.now() },
      }],
    });
    if (eclasses.length === 0)
      return;

    for (const eclass of eclasses) {
      if (eclass.status === EclassStatus.Planned && eclass.reminded)
        await EclassManager.startClass(eclass);
      if (eclass.status === EclassStatus.Planned && !eclass.reminded)
        await EclassManager.remindClass(eclass);
      else if (eclass.status === EclassStatus.InProgress)
        await EclassManager.finishClass(eclass);
    }
  }
}

import settings from '@/config/settings';

const coursesAndProfs = new Map<string[], string>([
  [settings.channels.matieresId.info, settings.channels.eProfsId.info],
  [settings.channels.matieresId.maths, settings.channels.eProfsId.maths],
  [settings.channels.matieresId.physique, settings.channels.eProfsId.physique],
]);

export default {
  findProf(channelId: string): string {
    for (const [matiereId, eProfId] of coursesAndProfs) {
      if (matiereId.includes(channelId))
        return eProfId;
    }
  },
};

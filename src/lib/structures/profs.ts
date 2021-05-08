import settings from '@/config/settings';


export default class Profs {
    coursesAndProfs: Map<string[], string>;

    constructor() {
        this.coursesAndProfs = new Map<string[], string>([
            [settings.channels.matieresId.info, settings.channels.eProfsId.info],
            [settings.channels.matieresId.maths, settings.channels.eProfsId.maths],
            [settings.channels.matieresId.physique, settings.channels.eProfsId.physique],
        ]);
    }

    public findProf(channelId: string): string {
        for (const [matiereId, eProfId] of this.coursesAndProfs) {
            if (matiereId.includes(channelId))
                return eProfId;
        }
    }
}

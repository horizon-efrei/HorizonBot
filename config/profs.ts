type Find = (channelId: string) => string;

export default class Profs {
    matieresId = {
        info: ['799660807881359380', '799660606525407232', '694637242496450582', '836219855833268227', '799660540011216896'],
        maths: ['694637521254219839', '808432914287165471', '808432941301760062'],
        physique: ['808432662732996628', '808432809697345606', '808432842249076808'],
    };

    // I need eProfs roles Ids //
    eProfsId = {
        info: 'eProfInfoId',
        maths: 'eProfMathId',
        physique: 'eProfPhysiqueId',
    };

    laMap: Map<string[], string>;

    constructor() {
        this.laMap = new Map<string[], string>([
            [this.matieresId.info, this.eProfsId.info],
            [this.matieresId.maths, this.eProfsId.maths],
            [this.matieresId.physique, this.eProfsId.physique],
        ]);
    }

    public findProf(channelId: string): string {
        for (const [matieresId, eProfId] of this.laMap) {
            if (matieresId.includes(channelId))
                return eProfId;
        }
    };
}

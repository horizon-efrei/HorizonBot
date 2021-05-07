/* eslint-disable import/prefer-default-export */
import { stripIndent } from 'common-tags';

export const eclass = {
  options: {
    aliases: ['cours', 'class'],
    description: stripIndent`
      Permet d'exécuter du code directement depuis Discord.
      • Pour certains langages (Java, C, C++...), tu peux ajouter le drapeau \`--wrap\` pour automatiquement ajouter la fonction/classe \`main\` autour de ton code.
      • Tu peux écrire ton code directement après le langage, ou dans un bloc de code Markdown.
      • Pour voir la liste des langages supportés, tape \`{prefix}code info\`.
      • Si ton programme *demande* des données à l'utilisateur, tu peux en fournir via \`--input=123\` ou \`--input="mes données"\` avec des guillements si ton texte contient plusieurs mots.
      • Je ne peux pas faire cette commande un nombre illimité de fois : elle est cappée à 200 utilisations par jour, en tout. Merci de ne pas en abuser pour que tout le monde puisse en profiter ! :) (ne vous étonnez pas si elle ne répond plus quand vous l'executez : vous l'avez surement trop spammée.)
    `,
    enabled: true,
    usage: 'run info|<langage> [--wrap] <code>',
    examples: ['code info', 'run java --wrap System.out.println("Test");', 'run js console.log("test");'],
  },
  messages: {
    noMoreCredits: 'Cette commande peut malheureusement être utilisée maximum 200 fois par jour en tout, et ce quota a été atteint... Réessaye à partir de 13h !',
    unknownLanguage: 'Le langage que tu as spécifié (`{parameter}`) est invalide. Il se peut que je ne le supporte pas ou que tu ais oublié de le spécifier.',
    noCode: "Tu as oublié d'ajouter du code à exécuter !",
    result: "Résultat de l'éxecution du code de {message.member} en {lang.value.display}. (Temps CPU : {cpuTime} / Memoire : {memory})",
    informationBlock: stripIndent`
      Abbréviations : {formattedSlugs}
      Version : {lang.version}
    `,
    prompts: {
      classChannel: {
        base: 'Entrez le salon associé au cours que vous souhaitez donner (mentionnez-le ou entrez son nom ou son ID) :',
        invalid: 'Ce salon est invalide.',
      },
      topic: {
        base: 'Entrez le sujet du cours que vous souhaitez donner (nom du chapitre, thème du cours...) :',
        invalid: 'Ce sujet est invalide.',
      },
      date: {
        base: 'Entrez la date du cours que vous souhaitez donner (au format "jj/MM") :',
        invalid: 'Cette date est invalide.',
      },
      hour: {
        base: "Entrez l'heure de début du cours que vous souhaitez donner (au format \"HH:mm\") :",
        invalid: 'Cette heure est invalide.',
      },
      duration: {
        base: 'Entrez une durée pour votre cours (en anglais ou en francais).\nVous pouvez par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Vous pouvez également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
        invalid: 'Cette durée est invalide.',
      },
      professor: {
        base: 'Entrez le professeur qui va donner le cours (mentionnez-le ou entrez son pseudo ou son ID) :',
        invalid: 'Ce membre est invalide.',
      },
      targetRole: {
        base: 'Entrez le rôle visé (L1, L2...) (mentionnez-le ou entrez son nom ou son ID) :',
        invalid: 'Ce rôle est invalide.',
      },

      stoppedPrompting: "Tu as bien abandonné la commande ! Aucun cours n'a été créé.",
    },
  },
};

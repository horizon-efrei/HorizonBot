/* eslint-disable import/prefer-default-export */
import { stripIndent } from 'common-tags';

export const eclass = {
  options: {
    aliases: ['cours', 'class'],
    description: stripIndent`
      Commande permettant de créer un cours. Vous pouvez utiliser \`!cours create\` ou \`!cours add\` suivit de tous les arguments nécessaires (\`!cours help\`), ou vous laisser guider par \`!cours setup\`.
      Quand le cours sera créé, des messages seront envoyés dans les bons salons pour prévenir les membres, et un rôle spécial sera créé pour que les personnes voulant assister au cours puissent être notifiées.
      Vous pourrez ensuite lancer le cours manuellement avec \`!cours start @role-spécial\`. Le cours s'arrêtera au bout de la durée spécifiée. S'il se finit avant, vous pouvez l'arrêter manuellement avec \`cours finish @role-spécial\`
    `,
    enabled: true,
    usage: 'cours <add|setup|help|start>',
    examples: ['!cours setup', '!cours add #⚡-electricité-générale "Low and High pass filters" 24/04 20h30 2h15 @professeur @L1', '!cours start'],
  },
  messages: {
    onlyProfessor: 'Seul les professeurs peuvent effectuer cette action !',
    unresolvedProfessor: ':x: Impossible de retrouver le professeur pour ce cours !',
    notOriginalProfessor: "Vous n'êtes pas le professeur à l'origine de ce cours, vous ne pouvez donc pas le commencer ! Seul {professor.displayName} peut le commencer.",

    helpEmbedTitle: 'Aide de la commande de cours',
    helpEmbedDescription: [
      { name: "Créer un cours à partir d'arguments donnés", value: '`!cours create <#salon | salon | ID> <sujet> <date> <heure> <durée> <@professeur | professeur | ID> <@role-audience | role audience | ID>`' },
      { name: 'Créer un cours de manière intéractive', value: '`!cours setup`' },
      { name: 'Commencer un cours', value: '`!cours start @role-cours`' },
      { name: 'Terminer un cours manuellement', value: '`!cours finish @role-cours`' },
      { name: 'Supprimer un cours manuellement', value: '`!cours remove @role-cours`' },
      { name: "Page d'aide", value: '`!cours help`' },
    ],

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

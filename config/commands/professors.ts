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

export const editSummaryCalendar = {
  options: {
    aliases: ['summary-calendar', 'sumcal', 'scal'],
    description: stripIndent`
      TODO
    `,
    enabled: true,
    usage: 'scal <add|remove|edit|create|archive|reset|help>',
    examples: ['!scal add #cours-de-la-semaine #🐍-python 28/06 20h 2h @<Pseudo eProf> @<Type Prof> ',
               '!scal remove #cours-de-la-semaine #🐍-python 28/06 20h',
               '!scal edit #cours-de-la-semaine #🐍-python 28/06 20h -prof @<Nouveau eProf> -hour 18h -duration 1h30',
               '!scal create #cours-de-la-semaine'],
  },
  messages: {
    onlyProfessor: 'Seuls les professeurs peuvent effectuer cette action !',
    
    //TODO: Changer le header message, archive, reset

    helpEmbedTitle: 'Aide de la commande de calendrier sommaire',
    helpEmbedDescription: [
      { name: "Ajouter un cours à un calendrier sommaire", value: '`!scal add <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> <date> <heure> <durée> <@professeur|professeur|ID rôle> <@role-audience|role audience|ID rôle>`' },
      { name: "Retirer un cours d'un calendrier sommaire", value: '`!scal remove <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> <date> <heure>`' },
      { name: "Modifier un cours d'un calendrier sommaire", value: '`!scal edit <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> <date> <heure> -<champ 1> <nouvelle valeur champ1> -<champ 2> <nouvelle valeur champ2>...`' },
      { name: 'Créer un calendrier dans un channel', value: '`!scal create <#salon|salon|ID salon calendrier> <headerMessage>`' },
      { name: "Page d'aide", value: '`!scal help`' },
    ],



    prompts: {
      action: {
        base: "Entrez l'action que vous voulez accomplir (-a/add: ajouter une un cours -r/remove: retirer un cours, -e/edit: modifier un cours, -c/create: créer un calendrier de sommaire, -arc/archive: archiver un cours, -h/help: afficher le menu d'aide) :",
        invalid: "Cette action est invalide.",
      },
      channel: {
        base: 'Entrez le channel dont vous souhaitez modifier le calendrier',
        invalid: 'Ce channel est invalide.',
      },
      targetHeaderMessage: {
        base: "Entrez le message du header du calendrier",
        invalid: 'Ce message est invalide.',
      },
      targetClass: {
        base: 'Entrez le nom de la matière visée (entre double quotes si elle contient des espaces)',
        invalid: 'Cette matière est invalide.',
      },
      targetDate: {
        base: 'Entrez la date correspondant au cours visé',
        invalid: 'Cette date est invalide.',
      },
      targetHour: {
        base: "Entrez l'heure correspondant au cours visé",
        invalid: 'Cette heure est invalide.',
      },
      targetDuration: {
        base: "Entrez la durée correspondant au cours visé",
        invalid: 'Cette durée est invalide.',
      },
      targetTeacher: {
        base: "Entrez le membre correspondant au professeur qui donnera le cours visé",
        invalid: 'Ce membre est invalide.',
      },
      targetRole: {
        base: "Entrez le rôle de l'audience correspondant au cours visé",
        invalid: 'Ce rôle est invalide.',
      },
      field: {
        base: "Entrez le champ dont vous voulez changer la valeur",
        invalid: 'Ce champ est invalide.',
      },
      fieldNewValue: {
        base: "Entrez la nouvelle valeur voulue pour ce champ",
        invalid: 'Cette valeur est invalide.',
      },
      stoppedPrompting: "Tu as bien abandonné la commande ! Le calendrier sommaire n'a pas été créé/modifié.",
    },
  },
};


export const editYearCalendar = {
  options: {
    aliases: ['year-calendar', 'year-cal', 'yearcal', 'ycal'],
    description: stripIndent`
      TODO
    `,
    enabled: true,
    usage: 'ycal <add|remove|edit|create|archive|reset|help>', // name -> nom complet de la matière, voice -> channel vocal, exam -> date des examens, cours -> sommaire d'un cours
    examples: ['!ycal add #calendrier-l1 #🐍-python "Python" <#9214792132120081237127>',
    '!ycal add #calendrier-l1 #🐍-python -exam "CE" 21/12 8h',
    '!ycal remove #calendrier-l1 #🐍-python -exam 28/06',
    '!ycal edit #calendrier-l1 #🐍-python -cours 28/06 20h -prof @<Nouveau eProf> -hour 18h -duration 1h30',
    '!ycal create #calendrier-l1'],
  },
  prefixes: {
    "calendar": "calendar-"
  },
  messages: {
    onlyProfessor: 'Seuls les professeurs peuvent effectuer cette action !',
    //unresolvedProfessor: ':x: Impossible de retrouver le professeur pour ce cours !',
    //notOriginalProfessor: "Vous n'êtes pas le professeur à l'origine de ce cours, vous ne pouvez donc pas le commencer ! Seul {professor.displayName} peut le commencer.",

    //TODO: Changer le header message, archive, reset

    helpEmbedTitle: 'Aide de la commande de cours',
    helpEmbedDescription: [
      { name: "Ajouter une matière à un calendrier de promotion", value: '`!ycal add <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> <nom matière> <channel vocal de la matière>`' },
      { name: "Ajouter un exam à un calendrier de promotion", value: '`!ycal add <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -exam <type exam> <date> <heure>`' },
      { name: "Ajouter un cours à un calendrier de promotion", value: '`!ycal add <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -cours <date> <heure> <durée> <@professeur|professeur|ID rôle> <@role-audience|role audience|ID rôle>`' },
      { name: "Retirer une matière d'un calendrier de promotion", value: '`!ycal remove <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière>`' },
      { name: "Retirer un exam d'un calendrier de promotion", value: '`!ycal remove <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -exam <type exam>`' },
      { name: "Retirer un cours d'un calendrier de promotion", value: '`!ycal remove <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -cours <date> <heure>`' },
      { name: "Modifier une matière d'un calendrier de promotion", value: '`!ycal edit <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -name <nouveau nom> / -voice <nouveau channel vocal>...`' },
      { name: "Modifier une un exam d'un calendrier de promotion", value: '`!ycal edit <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -exam <type exam> <date> <heure> -<champ 1> <nouvelle valeur champ1> -<champ 2> <nouvelle valeur champ2>...`' },
      { name: "Modifier une un cours d'un calendrier de promotion", value: '`!ycal edit <#salon|salon|ID salon calendrier> <matière|#salon|salon|ID salon matière> -cours <date> <heure> -<champ 1> <nouvelle valeur champ1> -<champ 2> <nouvelle valeur champ2>...`' },
      { name: 'Créer un calendrier dans un channel', value: '`!ycal create <#salon|salon|ID salon calendrier> <headerMessage>`' },
      { name: "Page d'aide", value: '`!ycal help`' },
    ],
    prompts: {
      action: {
        base: "Entrez l'action que vous voulez accomplir (-a/add: ajouter une un cours -r/remove: retirer un cours, -e/edit: modifier un cours, -c/create: créer un calendrier de de promotion, -arc/archive: archiver un cours, -h/help: afficher le menu d'aide) :",
        invalid: "Cette action est invalide.",
      },
      channel: {
        base: 'Entrez le channel dont vous souhaitez modifier le calendrier',
        invalid: 'Ce channel est invalide.',
      },
      targetHeaderMessage: {
        base: "Entrez le message du header du calendrier",
        invalid: 'Ce message est invalide.',
      },
      targetClass: {
        base: 'Entrez le nom de la matière visée (entre double quotes si elle contient des espaces)',
        invalid: 'Cette matière est invalide.',
      },
      targetInfoType: {
        base: "Entrez le type d'information que vous voulez modifier (channel de voix, nom de matière, cours lié à la matière, examen lié à la matière)",
        invalid: "Ce type d'information est invalide.",
      },
      targetVoiceChannel: {
        base: "Entrez le channel vocal correspondant à la matière",
        invalid: 'Ce channel vocal est invalide.',
      },
      targetName: {
        base: "Entrez le nom de la matière",
        invalid: 'Ce nom est invalide.',
      },
      targetTypeExam: {
        base: "Entrez le type de l'examen",
        invalid: "Ce type d'examen est invalide.",
      },
      targetDate: {
        base: "Entrez la date correspondant au cours/à l'exam visé",
        invalid: 'Cette date est invalide.',
      },
      targetHour: {
        base: "Entrez l'heure correspondant au cours visé",
        invalid: 'Cette heure est invalide.',
      },
      targetDuration: {
        base: "Entrez la durée correspondant au cours visé",
        invalid: 'Cette durée est invalide.',
      },
      targetTeacher: {
        base: "Entrez le membre correspondant au professeur qui donnera le cours visé",
        invalid: 'Ce membre est invalide.',
      },
      targetRole: {
        base: "Entrez le rôle de l'audience correspondant au cours visé",
        invalid: 'Ce rôle est invalide.',
      },
      field: {
        base: "Entrez le champ dont vous voulez changer la valeur",
        invalid: 'Ce champ est invalide.',
      },
      fieldNewValue: {
        base: "Entrez la nouvelle valeur voulue pour ce champ",
        invalid: 'Cette valeur est invalide.',
      },
      stoppedPrompting: "Tu as bien abandonné la commande ! Le calendrier de promotion n'a pas été créé/modifié.",
    },
  },
};

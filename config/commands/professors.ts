import {
  channelMention,
  hideLinkEmbed,
  roleMention,
  TimestampStyles,
  userMention,
} from '@discordjs/builders';
import { stripIndent } from 'common-tags';
import type { MessageSelectOptionData } from 'discord.js';
import { SchoolYear } from '@/types';
import type { SubjectBase } from '@/types/database';
import { EclassPlace, EclassStatus } from '@/types/database';
import { getGraduationYear, timeFormat } from '@/utils';

export const eclass = {
  options: {
    aliases: ['cours', 'class', 'ecours', 'eclass', 'e-cours', 'e-class'],
    description: stripIndent`
      Commande permettant de gérer les cours organisés sur ce Discord.
      Pour créer un cours, tu peux utiliser \`!cours create\` et te laisser guider par le menu interactif qui apparaîtra.
      Quand le cours sera créé, des messages seront envoyés dans les bons salons pour prévenir les membres, et un rôle spécial sera créé pour que les personnes voulant assister au cours puissent être notifiées.
      Le cours se lancera tout seul à l'heure indiquée (ou jusqu'à 2 minutes après). Sinon, tu peux le lancer manuellement avec \`!cours start <ID cours>\`.
      Le cours s'arrêtera au bout de la durée spécifiée. S'il se fini avant, tu peux l'arrêter manuellement avec \`!cours finish <ID cours>\`.
      Pour plus d'informations sur comment utiliser cette commande, faites \`!cours help\`.
    `,
    enabled: true,
    usage: 'cours <create | start | finish | edit | cancel | list | info | help>',
    examples: ['!cours setup', '!cours list', '!cours start pierre_230023082021_jneh'],
  },
  messages: {
    // Global
    invalidClassId: "Cet identifiant n'est pas valide. L'identifiant de la classe a été envoyé quand elle a été créée, et il est toujours disponible dans l'embed d'annonce du cours. Sinon, tu peux le retrouver en faisant `!cours list`.",
    onlyProfessor: 'Seul les professeurs peuvent effectuer cette action !',
    unresolvedProfessor: ':x: Impossible de retrouver le professeur pour ce cours !',
    unconfiguredChannel: "Oups, impossible de créer ce cours car aucun salon n'a été configuré pour les annonces. Configures-en un en tapant la commande `setup set class-<promo> #salon`.",
    unconfiguredRole: "Oups, impossible de créer ce cours car aucun rôle de promo n'a été configuré. Configures-en un en tapant la commande `setup set role-<promo> @Role`.",
    editUnauthorized: "Tu ne peux pas modifier un cours qui n'est pas à toi !",
    statusIncompatible: 'Tu ne peux pas faire cette action alors que le cours {status}.',

    // Readable enums
    statuses: {
      [EclassStatus.Planned]: "n'est pas encore commencé",
      [EclassStatus.InProgress]: 'est en cours',
      [EclassStatus.Finished]: 'est terminé',
      [EclassStatus.Canceled]: 'est annulé',
    },
    rawStatuses: {
      [EclassStatus.Planned]: 'pas encore commencé',
      [EclassStatus.InProgress]: 'en cours',
      [EclassStatus.Finished]: 'terminé',
      [EclassStatus.Canceled]: 'annulé',
    },
    recordedValues: ['Non :x:', 'Oui :white_check_mark:'],
    where: ({ place, placeInformation, subject }: {
      place: EclassPlace; placeInformation: string; subject: SubjectBase;
    }): string => {
      switch (place) {
        case EclassPlace.Discord:
          return `sur Discord (${subject.voiceChannel ? channelMention(subject.voiceChannel) : 'aucun salon vocal défini'})`;
        case EclassPlace.OnSite:
          return `sur le campus (salle ${placeInformation})`;
        case EclassPlace.Teams:
          return `sur Microsoft Teams (lien de la réunion : ${hideLinkEmbed(placeInformation)})`;
        case EclassPlace.Other:
          return `sur "${placeInformation}"`;
      }
    },

    // Help subcommand
    helpEmbedTitle: 'Aide de la commande de cours',
    helpEmbedDescription: [
      { name: 'Créer un cours', value: '`!cours create`' },
      { name: 'Commencer un cours', value: '`!cours start <ID-cours>`' },
      { name: 'Terminer un cours manuellement', value: '`!cours finish <ID-cours>`' },
      { name: 'Modifier un cours', value: '`!cours edit <ID-cours> <propriété> <valeur>`\n`propriété`: "sujet", "date", "heure", "durée", "professeur", "rôle", "lieu" ou "enregistré"' },
      { name: 'Annuler un cours', value: '`!cours cancel <ID-cours>`' },
      { name: 'Liste des cours', value: '`!cours list [--statut=<statut>] [--matiere=<matière>] [--professeur=<professeur>] [--role=<role>]`' },
      { name: 'Définir/voir si le cours est enregistré', value: '`!cours record <ID-cours> [lien]`' },
      { name: 'Informations sur un cours', value: '`!cours info <ID-cours>`' },
      { name: "Page d'aide", value: '`!cours help`' },
    ],

    // List subcommand
    listTitle: 'Liste des cours',
    noClassesFound: "Aucune classe n'a été trouvée...",
    someClassesFound: (amount: number): string => `${amount} classe${amount > 1 ? 's ont' : ' a'} été trouvée${amount > 1 ? 's' : ''} !`,
    filterTitle: 'Filtre(s) de recherche appliqué(s) :\n{filters}\n\n',
    noFilter: 'Aucun filtre de recherche appliqué.\n\n',
    statusFilter: '• Statut : {value}',
    professorFilter: '• Professeur : {value}',
    roleFilter: '• Rôle : {value}',
    subjectFilter: '• Matière : {value}',
    listFieldTitle: '{topic} ({subject.name})',
    listFieldDescription: stripIndent`
      Prévu ${timeFormat('{date}', TimestampStyles.RelativeTime)}, dure {duration}, se termine à ${timeFormat('{end}', TimestampStyles.ShortTime)}
      **Lieu :** {where}
      **Statut :** {status}
      **Identifiant :** \`{classId}\`
    `,

    // Create subcommand
    successfullyCreated: 'Le cours a bien été créé ! Son ID est `{eclass.classId}`.',
    alreadyExists: 'Ce cours (même matière, sujet, heure, jour) a déjà été prévu !',
    newClassNotification: ':bell: {targetRole}, un nouveau cours a été plannifié ! :arrow_heading_down: {newClassNotificationPlaceAlert}',
    newClassNotificationPlaceAlert: '\n\n:warning: __**ATTENTION :**__ le cours sera **{where}** !',

    recordedLink: '[Lien]({recordLink})',
    newClassEmbed: {
      title: '{subject.name} - {topic}',
      description: `Cours en {classChannel} le **${timeFormat('{date}')}** !\n\n:bulb: Réagis avec :white_check_mark: pour être rappelé en avance !`,
      author: "Ef'Réussite - Nouveau cours !",
      date: '🗓️ Date et heure',
      dateValue: `${timeFormat('{date}')} - ${timeFormat('{end}', TimestampStyles.ShortTime)}\n${timeFormat('{date}', TimestampStyles.RelativeTime)}`,
      duration: '⏳ Durée prévue',
      professor: '🧑‍🏫 Professeur',
      recorded: '🎥 Enregistré',
      place: '📍 Lieu',
      placeValues: {
        [EclassPlace.Discord]: `Sur Discord, dans ${channelMention('{subject.voiceChannel}')}`,
        [EclassPlace.OnSite]: "Au campus de l'EFREI, salle {placeInformation}",
        [EclassPlace.Teams]: 'Sur [Microsoft Teams (lien de la réunion)]({placeInformation})',
        [EclassPlace.Other]: '{placeInformation}',
      },
      footer: 'ID : {classId}',
    },

    createClassSetup: {
      embed: {
        title: "Création d'un cours",
        description: "Bienvenue dans l'assistant de création de cours ! Suis les étapes ci-dessous en sélectionnant l'option dans le menu déroulant qui s'affiche, ou en envoyant un message comme il te sera demandé. Tu peux, à tout moment, abandonner la création du cours en cliquant sur \"Abandonner\".",
        stepPreviewTitle: 'Aperçu des étapes',
        currentStepTitle: 'Étape actuelle : {step}',
        currentStepDescription: [
          'Choisis dans le menu déroulant ci-dessous quelle promotion ton cours vise.',
          'Choisis dans le menu déroulant ci-dessous sur quelle matière ton cours porte.',
          'Envoie un message contenant le sujet de ton cours.',
          'Envoie un message contenant le professeur en charge de ton cours.',
          'Envoie un message contenant la durée de ton cours.',
          'Envoie un message contenant la date à laquelle ton cours est prévu.',
          'Envoie un message contenant le rôle visé par ton cours.',
          'Choisis dans le menu déroulant ci-dessous où présenter ton cours.',
          'Choisis dans le menu déroulant ci-dessous si oui ou non ton cours sera enregistré. Cette option peut être changée plus tard.',
          'Terminé !',
        ],
      },
      promptMessageMenu: 'Choisis une option dans le menu ci-dessus :arrow_heading_up: ',
      stepPreview: stripIndent`
        **1.** __Promotion :__ {schoolYear}
        **2.** __Matière :__ {subject}
        **3.** __Sujet :__ {topic}
        **4.** __Professeur :__ {professor}
        **5.** __Durée :__ {duration}
        **6.** __Date :__ {date}
        **7.** __Rôle visé :__ {targetRole}
        **8.** __Lieu :__ {where}
        **9.** __Enregistré :__ {isRecorded}
      `,
      schoolYearMenu: {
        placeholder: 'Aucune année sélectionnée',
        options: [
          { label: `L1 - Promo ${getGraduationYear(SchoolYear.L1)}`, emoji: '1⃣' },
          { label: `L2 - Promo ${getGraduationYear(SchoolYear.L2)}`, emoji: '2⃣' },
          { label: `L3 - Promo ${getGraduationYear(SchoolYear.L3)}`, emoji: '3⃣' },
        ] as Array<Omit<MessageSelectOptionData, 'value'>>,
      },
      subjectMenu: {
        placeholder: 'Aucune matière sélectionnée',
      },
      placeMenu: {
        placeholder: 'Aucune valeur sélectionnée',
        options: [{
          label: 'Discord',
          description: 'Le cours se passera sur discord',
          value: 'discord',
        }, {
          label: 'Campus',
          description: 'Le cours se passera sur le campus, dans la salle définie',
          value: 'on-site',
        }, {
          label: 'Teams',
          description: 'Le cours se passera sur Microsoft Teams, dans le groupe défini',
          value: 'teams',
        }, {
          label: 'Autre',
          description: 'Choisis un endroit personnalisé',
          value: 'other',
        }] as MessageSelectOptionData[],
      },
      isRecordedMenu: {
        placeholder: 'Aucune valeur sélectionnée',
        options: [{
          label: 'Oui',
          description: 'Le cours sera enregistré par le professeur ou un élève',
          emoji: '✅',
          value: 'yes',
        }, {
          label: 'Non',
          description: 'Le cours ne sera pas enregistré',
          emoji: '❌',
          value: 'no',
        }] as MessageSelectOptionData[],
      },
      rescheduleButtons: {
        reschedule: 'Nouvelle date',
        ignore: 'Ignorer',
      },
      abortMenu: {
        label: 'Abandonner',
      },
      errors: {
        main: 'Oups, une erreur est survenue lors de cette action :confused:\n> {details}',
        noSubjects: "Aucune matière n'existe pour cette année là.",
      },
    },

    // Edit subcommand
    invalidEditProperty: 'Cette propriété est invalide. Choisis parmi "sujet", "date", "heure", "durée", "professeur", "rôle", "lieu" et "enregistré".',

    editedTopic: 'Tu as bien modifié le thème du cours en "{topic}".',
    pingEditedTopic: '{pingRole}, le thème du cours a été changé en "{topic}".',

    editedDate: `Tu as bien déplacé le cours pour le ${timeFormat('{date}', TimestampStyles.LongDateTime)}.`,
    pingEditedDate: `{pingRole}, le cours a été déplacé le ${timeFormat('{date}', TimestampStyles.LongDateTime)} (${timeFormat('{date}', TimestampStyles.RelativeTime)}).`,

    editedHour: `Tu as bien déplacé le cours à ${timeFormat('{date}', TimestampStyles.ShortTime)}.`,
    pingEditedHour: `{pingRole}, le cours a été déplacé à ${timeFormat('{date}', TimestampStyles.ShortTime)} (${timeFormat('{date}', TimestampStyles.RelativeTime)}).`,

    editedDuration: 'Tu as bien modifié la durée du cours en {duration}.',
    pingEditedDuration: '{pingRole}, le cours durera à présent en {duration}.',

    editedProfessor: `Tu as bien modifié le professeur du cours qui est maintenant ${userMention('{professor}')}.`,
    pingEditedProfessor: `{pingRole}, le professeur a été changé pour ${userMention('{professor}')}.`,

    editedRole: 'Tu as bien modifié le rôle visé en "{role}".',
    pingEditedRole: '{pingRole}, le rôle visé a été changé au rôle "{role}".',

    editedPlace: 'Tu as bien modifié le lieu du cours, qui sera maintenant {where}.',
    pingEditedPlace: '{pingRole}, le lieu du cours a été changé, il est maintenant {where}.',

    editedRecorded: "Tu as bien modifié le statut d'enregistrement du cours en `{isRecorded}`.",
    pingEditedRecorded: '{pingRole}, le cours a été modifié : ',
    pingEditedRecordedValues: ['il ne sera plus enregistré.', 'il sera maintenant enregistré.'],

    // Start subcommand
    successfullyStarted: 'Le cours a bien été lancé !',
    startClassNotification: `:bell: ${roleMention('{classRole}')}, le cours commence !`,
    remindClassNotification: `:bell: ${roleMention('{classRole}')} rappel : le cours commence ${timeFormat('{date}', TimestampStyles.RelativeTime)}, {where}`,
    remindClassPrivateNotification: `:bell: Tu t'es inscrit au cours "{topic}". Il commence ${timeFormat('{date}', TimestampStyles.RelativeTime)} ! Tiens-toi prêt :\\)\nIl se passera {where}.`,
    valueInProgress: '[En cours]',
    alertProfessor: stripIndent`
      Bonjour, ton cours "{topic}" (en {subject.name}) va commencer dans environ 15 minutes.
      Voici quelques conseils et rappels pour le bon déroulement du cours :

      **AVANT**
      - Prépare les documents et logiciels dont tu vas te servir pour animer le cours ;
      - Rend toi {where} ;
      {beforeChecklist}

      **PENDANT**
      - Je lancerai le cours automatiquement autour de l'heure définie (${timeFormat('{date}', TimestampStyles.LongDateTime)}), et je mentionnerai toutes les personnes directement intéressées par le cours ;
      - Anime ton cours comme tu le souhaites, en essayant d'être le plus clair possible dans tes propos ;
      - N'hésite-pas à demander à des fauteurs de trouble de partir, ou prévient un membre du staff si besoin ;

      **APRÈS**
      - J'arrêterai le cours automatiquement au bout de la durée prévue. Ce n'est pas grave s'il dure plus ou moins longtemps. Tu peux l'arrêter manuellement avec \`!ecours finish {classId}\`
      {afterChecklist}

      :warning: Rappel : il a été prévu que le cours {isIsNot} enregistré ! Tu peux changer cela avec \`!ecours edit {classId} record {notIsRecorded}\`.

      Bon courage !
    `,
    alertProfessorComplements: {
      startRecord: "- Lance ton logiciel d'enregistrement pour filmer le cours ;",
      registerRecording: `- Télécharge ton enregistrement sur ce lien ${hideLinkEmbed(process.env.ECLASS_DRIVE_URL)}. Si tu n'as pas les permissions nécessaires, contact un responsable eProf (rôle "Respo eProf"). Ensuite, lance la commande \`!ecours record {classId} <ton lien>\` ;`,
      isRecorded: 'soit',
      isNotRecorded: 'ne soit pas',
    },

    startClassEmbed: {
      title: 'Le cours en {eclass.subject.name} va commencer !',
      author: "Ef'Réussite - Un cours commence !",
      baseDescription: `Le cours en **{eclass.subject.name}** sur "**{eclass.topic}**" présenté par ${userMention('{eclass.professor}')} commence !\n\n:round_pushpin: Il aura lieu {where}\n\n{isRecorded}`,
      descriptionAllChannels: `Le salon textuel associé est ${channelMention('{eclass.subject.textChannel}')}, et le salon vocal est ${channelMention('{eclass.subject.voiceChannel}')}.`,
      descriptionTextChannel: `Le salon textuel associé est ${channelMention('{eclass.subject.textChannel}')}.`,
      descriptionIsRecorded: ':red_circle: Le cours est enregistré !',
      descriptionIsNotRecorded: ":warning: Le cours n'est pas enregistré !",
      footer: 'ID : {classId}',
    },

    // Finish subcommand
    successfullyFinished: 'Le cours a bien été terminé !',
    valueFinished: '[Terminé]',

    // Cancel subcommand
    confirmCancel: 'Es-tu sûr de vouloir annuler ce cours ? Cette action est irrévocable.',
    successfullyCanceled: 'Le cours a bien été annulé !',
    valueCanceled: ':warning: **__COURS ANNULÉ !__**',

    // Record subcommand
    recordLink: `Le lien d'enregistrement de ce cours est ${hideLinkEmbed('{link}')}.`,
    noRecordLink: "Il n'y a pas de lien d'enregistrement disponible pour ce cours !",
    linkAnnouncement: `L'enregistrement du cours "{topic}" ({date}) a été publié sur ce lien : ${hideLinkEmbed('{link}')} !`,
    successfullyAddedLink: 'Le lien a bien été ajouté au cours !',

    // Show subcommand
    showEmbed: {
      title: '{topic}',
      subjectName: 'Matière',
      subjectValue: '`{subject.classCode}`: {subject.name} ({subject.teachingUnit})',
      statusName: 'Statut du cours',
      statusValue: '{status}.',
      dateName: 'Date',
      dateValue: `${timeFormat('{date}', TimestampStyles.LongDate)}, ${timeFormat('{date}', TimestampStyles.RelativeTime)}\nDe ${timeFormat('{date}', TimestampStyles.ShortTime)} à ${timeFormat('{end}', TimestampStyles.ShortTime)}, dure {duration}.`,
      professorName: 'Professeur',
      professorValue: userMention('{professor}'),
      placeName: 'Lieu',
      placeValue: '{where}',
      recordedName: 'Enregistré',
      recordedValue: '{recorded}',
      relatedName: 'Autres données associées',
      relatedValue: `Rôle visé : ${roleMention('{targetRole}')}\n[Message d'annonce]({messageLink})`,
    },

    // Subscribing
    subscribed: "Tu t'es bien inscrit au cours de \"{topic}\" ({subject.name}) ! Je te le rappellerai un peu avant :)",
    unsubscribed: "Tu t'es bien désinscrit du cours de \"{topic}\" ({subject.name}) !",

    // Prompts
    prompts: {
      topic: {
        base: 'Entre le sujet du cours que tu souhaites donner (nom du chapitre, thème du cours...) :',
        invalid: 'Ce sujet est invalide.',
      },
      date: {
        base: 'Entre la date du cours que tu souhaites donner (au format "jj/MM HH:mm") :',
        invalid: "Cette date est invalide. Vérifie bien qu'elle ne soit pas passée et qu'elle soit prévue pour dans moins de 2 mois.",
        professorOverlap: ':warning: **AÏE !** Ce professeur a déjà un cours de prévu à cette date.',
        schoolYearOverlap: ':warning: **AÏE !** Cette promotion a déjà un cours de prévu à cette date.',
        chooseAgain: 'Souhaites-tu choisir une nouvelle date ?',
      },
      hour: {
        base: "Entre l'heure de début du cours que tu souhaites donner (au format \"HH:mm\") :",
        invalid: "Cette heure est invalide. Vérifie bien que la date ne soit pas passée et qu'elle soit prévue pour dans moins de 2 mois.",
      },
      duration: {
        base: 'Entre une durée pour ton cours (en anglais ou en français).\nTu peux par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Tu peux également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
        invalid: 'Cette durée est invalide.',
      },
      professor: {
        base: 'Entre le professeur qui va donner le cours (mentionne-le ou entre son pseudo ou son ID) :',
        invalid: 'Ce membre est invalide.',
      },
      targetRole: {
        base: 'Entre le rôle de révision visé ("Promo 2025", "Rattrapages Informatique"...) (mentionne-le ou entre son nom ou son ID) :',
        invalid: 'Ce rôle est invalide.',
      },
      place: {
        base: 'Entre le lieu du cours ("discord", "teams", "campus", "autre") :',
        hint: 'Choisis parmi "discord", "teams", "campus" ou "autre".',
        invalid: 'Ce lieu est invalide.',
      },
      teamsLink: {
        base: "Entre le lien de la réunion ou de l'équipe Microsoft Teams :",
        hint: '',
        invalid: 'Ce lien est invalide.',
      },
      room: {
        base: 'Entre la salle de cours (ex: "A304", "Amphi C001") :',
        hint: '',
        invalid: 'Cette salle est invalide.',
      },
      customPlace: {
        base: 'Entre le lieu du cours :',
        hint: '',
        invalid: 'Ce lieu est invalide.',
      },
      recorded: {
        invalid: 'Cette valeur est invalide.',
      },

      stoppedPrompting: "Tu as bien abandonné la commande ! Aucun cours n'a été créé.",
      promptTimeout: "La durée maximale a été dépassée, la commande a été abandonnée et aucun cours n'a été créé.",
    },
  },
} as const;

export const subject = {
  options: {
    aliases: ['subject', 'matière', 'matiere'],
    description: stripIndent`
      Commande permettant de créer une matière.
      Pour créer une nouvelle matière, tu peux utiliser \`!subject create\` et te laisser guider par le menu interactif qui apparaîtra.
      Pour plus d'informations sur comment utiliser cette commande, faites \`!subject help\`.
    `,
    enabled: true,
    usage: 'subject <create | remove | list | help>',
    examples: ['!subject help', '!subject create', '!subject list'],
  },
  messages: {
    // Global
    invalidCode: "Le code cours entré n'est pas valide !",
    unknownSubject: 'Impossible de trouver une matière correspondant à ce code cours',

    // Help subcommand
    helpEmbedTitle: 'Aide de la commande de matières',
    helpEmbedDescription: [
      { name: 'Créer une matière', value: '`!subject create`' },
      { name: 'Supprimer une matière', value: '`!subject remove <code cours>`' },
      { name: 'Liste des matières', value: '`!subject list`' },
      { name: "Page d'aide", value: '`!subject help`' },
    ],

    // List subcommand
    listTitle: 'Liste des matières',
    noSubjectFound: "Aucune matière n'a été trouvée...",
    someSubjectsFound: (amount: number): string => `${amount} matière${amount > 1 ? 's ont' : ' a'} été trouvée${amount > 1 ? 's' : ''} !`,
    listFieldTitle: '{emoji} {name} ({schoolYear})',
    listFieldDescription: stripIndent`
      {classCode} - {teachingUnit}
      [Moodle]({moodleLink})
      Salons : {channels}
    `,

    // Create subcommand
    successfullyCreated: 'La matière a bien été créée !',
    alreadyExists: 'Une matière avec le même code cours existe déjà !',

    createSubjectSetup: {
      embed: {
        title: "Création d'une matière",
        description: "Bienvenue dans l'assistant de création de matières. Suis les étapes ci-dessous en sélectionnant l'option dans le menu déroulant qui s'affiche, ou en envoyant un message comme il te sera demandé. Tu peux, à tout moment, abandonner la création de la matière en cliquant sur \"Abandonner\".",
        stepPreviewTitle: 'Aperçu des étapes',
        currentStepTitle: 'Étape actuelle : {step}',
        currentStepDescription: [
          'Choisis dans le menu déroulant ci-dessous quelle promotion ta matière vise.',
          "Choisis dans le menu déroulant ci-dessous dans quelle UE ta matière s'inscrit.",
          'Envoie un message contenant le nom de ta matière.',
          'Envoie un message contenant le nom en anglais (pour les INTs) de ta matière.',
          'Envoie un message contenant le code cours de ta matière (par exemple "TI403" ou "SM204").',
          'Envoie un message contenant le lien Moodle de ta matière.',
          'Envoie un message contenant le salon textuel associé à ta matière.',
          'Envoie un message contenant un émoji représentant ta matière.',
          'Terminé !',
        ],
      },
      promptMessageDropdown: 'Choisis une option dans le menu déroulant ci-dessus :arrow_heading_up: ',
      stepPreview: stripIndent`
        **1.** __Promotion :__ {schoolYear}
        **2.** __UE :__ {teachingUnit}
        **3.** __Nom :__ {name}
        **4.** __Nom anglais :__ {nameEnglish}
        **5.** __Code cours :__ {classCode}
        **6.** __Moodle :__ {moodleLink}
        **7.** __Salon :__ {textChannel}
        **8.** __Emoji :__ {emoji}
      `,
      schoolYearMenu: {
        placeholder: 'Aucune année sélectionnée',
        options: [
          { label: `L1 - Promo ${getGraduationYear(SchoolYear.L1)}`, emoji: '1⃣' },
          { label: `L2 - Promo ${getGraduationYear(SchoolYear.L2)}`, emoji: '2⃣' },
          { label: `L3 - Promo ${getGraduationYear(SchoolYear.L3)}`, emoji: '3⃣' },
        ] as Array<Omit<MessageSelectOptionData, 'value'>>,
      },
      teachingUnitMenu: {
        placeholder: 'Aucune UE sélectionnée',
        options: [
          { label: 'Formation Générale', emoji: '🧑‍🎓' },
          { label: 'Mathématiques', emoji: '🔢' },
          { label: 'Informatique', emoji: '💻' },
          { label: 'Physique & Électronique', emoji: '🔋' },
        ] as Array<Omit<MessageSelectOptionData, 'value'>>,
      },
      abortMenu: {
        label: 'Abandonner',
      },
    },

    // Remove subcommand
    successfullyRemoved: 'La matière a bien été supprimée !',
    removalFailed: "La matière n'a **pas** pu être supprimée, car elle est utilisée par {amount} cours. Si la supprimer est une nécessité, contacte un administrateur pour faire cette action manuellement.",

    // Prompts
    prompts: {
      name: {
        base: 'Entre le nom de la matière que tu souhaites ajouter :',
        invalid: 'Ce nom de matière est invalide.',
      },
      englishName: {
        base: 'Entre le nom de la matière que tu souhaites ajouter, en anglais (pour les classes INTs) :',
        invalid: 'Ce nom de matière est invalide.',
      },
      classCode: {
        base: 'Entre le code cours de la matière que tu souhaites ajouter (par exemple "TI403" ou "SM204") :',
        invalid: 'Cette code cours est invalide.',
      },
      moodleLink: {
        base: 'Entre le lien Moodle de la matière que tu souhaites ajouter. Sélectionne le lien Moodle de la matière pour les classes classiques (pas INT, ni renforcé, ni bordeaux...) :',
        invalid: 'Ce lien est invalide.',
      },
      textChannel: {
        base: 'Entre le salon textuel associé à ta matière (mentionne-le, ou entre son nom ou son ID) :',
        invalid: 'Ce salon textuel est invalide.',
      },
      emoji: {
        base: "Entre l'émoji qui correspond au mieux à la matière que tu ajoutes :",
        invalid: 'Cet émoji est invalide.',
      },

      stoppedPrompting: "Tu as bien abandonné la commande ! Aucune matière n'a été créé.",
      promptTimeout: "La durée maximale a été dépassée, la commande a été abandonnée et aucune matière n'a été créée.",
    },
  },
} as const;

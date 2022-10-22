import {
  channelMention,
  hideLinkEmbed,
  roleMention,
  TimestampStyles,
  userMention,
} from '@discordjs/builders';
import { stripIndent } from 'common-tags';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';
import { SchoolYear } from '@/types';
import type { SubjectBase } from '@/types/database';
import { EclassPlace, EclassStatus } from '@/types/database';
import { getGraduationYear, timeFormat } from '@/utils';

export const eclass = {
  descriptions: {
    name: 'eclass',
    command: 'Gérer les cours organisés sur ce Discord.',
    subcommands: {
      create: 'Créer un cours.',
      list: 'Voir les cours.',
      start: 'Débuter votre cours manuellement.',
      finish: 'Arrêter votre cours manuellement.',
      edit: 'Modifier un cours.',
      cancel: 'Annuler un cours prévu.',
      record: "Gérer les enregistrements d'un cours.",
      info: "Voir les informations d'un cours.",
    },
    options: {
      schoolYear: 'Promotion visée par le cours.',
      subject: 'Matière sur laquelle le cours porte.',
      topic: 'Sujet du cours.',
      professor: 'Professeur en charge du cours.',
      duration: 'Durée du cours.',
      date: 'Date à laquelle le cours est prévu.',
      targetRole: 'Rôle visé par le cours.',
      place: 'Lieu où le cours est prévu.',
      isRecorded: 'Si le cours est enregistré.',
      status: 'Statut du cours.',
      id: 'Identifiant du cours à utiliser.',
      shouldPing: "S'il faut mentionner les personnes inscrites au cours pour leur prévenir du changement.",
      choice: 'Choix à donner.',
      silent: "S'il faut envoyer le lien dans le salon du cours.",
      link: 'Lien du cours.',
    },
  },
  messages: {
    // Global
    invalidClassId: "Cet identifiant n'est pas valide. L'identifiant de la classe a été envoyé quand elle a été créée, et il est toujours disponible dans l'embed d'annonce du cours. Sinon, tu peux le retrouver en faisant `/eclass list`.",
    onlyProfessor: 'Seul les professeurs peuvent effectuer cette action !',
    unconfiguredChannel: "Oups, impossible de créer ce cours car aucun salon n'a été configuré pour les annonces. Configures-en un en tapant la commande `setup set class-<promo> #salon`.",
    unconfiguredRole: "Oups, impossible de créer ce cours car aucun rôle de promo n'a été configuré. Configures-en un en tapant la commande `setup set role-<promo> @Role`.",
    editUnauthorized: "Tu ne peux pas modifier un cours qui n'est pas à toi !",
    statusIncompatible: 'Tu ne peux pas faire cette action alors que le cours {status}.',
    professorOverlap: ':warning: **AÏE !** Ce professeur a déjà un cours de prévu à cette date.',
    schoolYearOverlap: ':warning: **AÏE !** Cette promotion a déjà un cours de prévu à cette date.',
    invalidSubject: "La matière entrée est invalide. Entre son code cours (ex: `TI304`), en faisant attention à ce qu'il te soit proposé. Sinon, cela signifie que la matière n'est pas disponible. Si tu penses que c'est un problème, contact un responsable eProf.",
    invalidDuration: 'Cette durée est invalide. Il faut entrer une durée en anglais ou en français.\nTu peux par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Tu peux également combiner ces durées ensemble : `2h30min` ou `1h45`.',
    invalidDate: "Cette date est invalide. Vérifie bien qu'elle ne soit pas passée, qu'elle soit prévue pour dans moins de 2 mois et qu'elle soit au format `jj/MM HH:mm`.",
    invalidTeamsUrl: "Le lien de la réunion Microsoft Teams donné n'est pas valide.",
    invalidRecordLink: "Le lien de l'enregistrement donné n'est pas valide.",
    placeInformationModal: {
      title: 'Détails sur le lieu.',
      label: {
        [EclassPlace.OnSite]: 'Salle de cours',
        [EclassPlace.Teams]: "Lien de la réunion ou de l'équipe Teams",
        [EclassPlace.Other]: 'Lieu du cours',
      },
      placeholder: {
        [EclassPlace.OnSite]: 'A304, M111, Amphi C...',
        [EclassPlace.Teams]: 'Lien...',
        [EclassPlace.Other]: 'Lieu...',
      },
    },

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
      place: EclassPlace; placeInformation: string | null; subject: SubjectBase;
    }): string => {
      switch (place) {
        case EclassPlace.Discord:
          return `sur Discord (${subject.voiceChannelId ? channelMention(subject.voiceChannelId) : 'aucun salon vocal défini'})`;
        case EclassPlace.OnSite:
          return `sur le campus (salle ${placeInformation ?? 'inconnue'})`;
        case EclassPlace.Teams:
          return `sur Microsoft Teams (lien de la réunion : ${hideLinkEmbed(placeInformation ?? 'inconnu')})`;
        case EclassPlace.Other:
          return `sur "${placeInformation ?? 'inconnu'}"`;
      }
    },

    // List subcommand
    listTitle: 'Liste des cours',
    noClassesFound: "Aucune classe n'a été trouvée...",
    someClassesFound: (amount: number): string => `${amount} classe${amount > 1 ? 's ont' : ' a'} été trouvée${amount > 1 ? 's' : ''} !`,
    filterTitle: 'Filtre(s) de recherche appliqué(s) :\n{filters}\n\n',
    noFilter: 'Aucun filtre de recherche appliqué.\n\n',
    statusFilter: '• Statut : {value}',
    professorFilter: '• Professeur : {value}',
    subjectFilter: '• Matière : {value}',
    schoolYearFilter: '• Promo : {value}',
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
    newClassNotification: `:bell: ${roleMention('{targetRole.id}')}, un nouveau cours a été plannifié ! :arrow_heading_down: {newClassNotificationPlaceAlert}`,
    newClassNotificationPlaceAlert: '\n\n:warning: __**ATTENTION :**__ le cours sera **{where}** !',

    recordedLink: '[Lien]({link})',
    newClassEmbed: {
      title: '{subject.name} - {topic}',
      description: `Cours en {classChannel} le **${timeFormat('{date}')}** !\n\n:bulb: Réagis avec :white_check_mark: pour être rappelé en avance !`,
      author: "Ef'Réussite - Nouveau cours !",
      date: '🗓️ Date et heure',
      dateValue: `${timeFormat('{date}')} - ${timeFormat('{end}', TimestampStyles.ShortTime)}\n${timeFormat('{date}', TimestampStyles.RelativeTime)}`,
      dateValueInProgress: `${timeFormat('{date}')} - ${timeFormat('{end}', TimestampStyles.ShortTime)}\n${timeFormat('{date}', TimestampStyles.RelativeTime)}\n[En cours]`,
      dateValueFinished: `${timeFormat('{date}')} - ${timeFormat('{end}', TimestampStyles.ShortTime)}\n${timeFormat('{date}', TimestampStyles.RelativeTime)}\n[Terminé]`,
      duration: '⏳ Durée prévue',
      professor: '🧑‍🏫 Professeur',
      recorded: '🎥 Enregistré',
      place: '📍 Lieu',
      placeValues: {
        [EclassPlace.Discord]: `Sur Discord, dans ${channelMention('{subject.voiceChannelId}')}`,
        [EclassPlace.OnSite]: "Au campus de l'EFREI, salle {placeInformation}",
        [EclassPlace.Teams]: 'Sur [Microsoft Teams (lien de la réunion)]({placeInformation})',
        [EclassPlace.Other]: '{placeInformation}',
      },
      footer: 'ID : {classId}',
    },

    schoolYearChoices: (): Array<APIApplicationCommandOptionChoice<string>> => [
      { name: `L1 - Promo ${getGraduationYear(SchoolYear.L1)}`, value: SchoolYear.L1 },
      { name: `L2 - Promo ${getGraduationYear(SchoolYear.L2)}`, value: SchoolYear.L2 },
      { name: `L3 - Promo ${getGraduationYear(SchoolYear.L3)}`, value: SchoolYear.L3 },
    ],
    placeChoices: [
      { name: 'Sur Discord', value: EclassPlace.Discord },
      { name: 'Sur le Campus', value: EclassPlace.OnSite },
      { name: 'Sur Microsoft Teams', value: EclassPlace.Teams },
      { name: 'Autre', value: EclassPlace.Other },
    ] as Array<APIApplicationCommandOptionChoice<string>>,

    // Edit subcommand
    headerEdited: 'Tu as bien modifié :\n',
    headerPingEdited: '{pingRole}, le cours a été modifié :\n',

    editedTopic: '- le thème du cours en "{topic}".',
    pingEditedTopic: '- le thème est maintenant "*{topic}*".',

    editedDate: `- la date du cours pour le ${timeFormat('{date}', TimestampStyles.LongDateTime)}.`,
    pingEditedDate: `- il a été déplacé au ${timeFormat('{date}', TimestampStyles.LongDateTime)} (${timeFormat('{date}', TimestampStyles.RelativeTime)}).`,

    editedDuration: '- la durée du cours en {duration}.',
    pingEditedDuration: '- il durera à présent *{duration}*.',

    editedProfessor: `- le professeur du cours qui est maintenant ${userMention('{professorId}')}.`,
    pingEditedProfessor: `- il sera maintenant donné par ${userMention('{professorId}')}.`,

    editedPlace: '- le lieu du cours, qui sera maintenant {where}.',
    pingEditedPlace: '- il se tiendra à présent {where}.',

    editedIsRecorded: "- le statut d'enregistrement du cours en `{isRecorded}`.",
    pingEditedIsRecorded: ['- il ne sera plus enregistré.', '- il sera maintenant enregistré.'],

    // Start subcommand
    successfullyStarted: 'Le cours a bien été lancé !',
    startClassNotification: `:bell: ${roleMention('{classRoleId}')}, le cours commence !`,
    remindClassNotification: `:bell: ${roleMention('{classRoleId}')} rappel : le cours commence ${timeFormat('{date}', TimestampStyles.RelativeTime)}, {where}`,
    remindClassPrivateNotification: `:bell: Tu t'es inscrit au cours "{topic}". Il commence ${timeFormat('{date}', TimestampStyles.RelativeTime)} ! Tiens-toi prêt :\\)\nIl se passera {where}.`,
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
      - J'arrêterai le cours automatiquement au bout de la durée prévue. Ce n'est pas grave s'il dure plus ou moins longtemps. Tu peux l'arrêter manuellement avec \`/eclass finish {classId}\`
      {afterChecklist}

      :warning: Rappel : il a été prévu que le cours {isIsNot} enregistré ! Tu peux changer cela avec \`/eclass edit {classId} record {notIsRecorded}\`.

      Bon courage !
    `,
    alertProfessorComplements: {
      startRecord: "- Lance ton logiciel d'enregistrement pour filmer le cours ;",
      registerRecording: `- Télécharge ton enregistrement sur ce lien ${hideLinkEmbed(process.env.ECLASS_DRIVE_URL)}. Si tu n'as pas les permissions nécessaires, contact un responsable eProf (rôle "Respo eProf"). Ensuite, lance la commande \`/eclass record {classId} add <ton lien>\` ;`,
      isRecorded: 'soit',
      isNotRecorded: 'ne soit pas',
    },

    startClassEmbed: {
      title: 'Le cours en {eclass.subject.name} va commencer !',
      author: "Ef'Réussite - Un cours commence !",
      baseDescription: `Le cours en **{eclass.subject.name}** sur "**{eclass.topic}**" présenté par ${userMention('{eclass.professor}')} commence !\n\n:round_pushpin: Il aura lieu {where}\n\n{isRecorded}`,
      descriptionAllChannels: `Le salon textuel associé est ${channelMention('{eclass.subject.textChannelId}')}, et le salon vocal est ${channelMention('{eclass.subject.voiceChannelId}')}.`,
      descriptionTextChannel: `Le salon textuel associé est ${channelMention('{eclass.subject.textChannelId}')}.`,
      descriptionIsRecorded: ':red_circle: Le cours est enregistré !',
      descriptionIsNotRecorded: ":warning: Le cours n'est pas enregistré !",
      footer: 'ID : {classId}',
    },

    // Finish subcommand
    successfullyFinished: 'Le cours a bien été terminé !',

    // Cancel subcommand
    confirmCancel: 'Es-tu sûr de vouloir annuler ce cours ? Cette action est irrévocable.',
    successfullyCanceled: 'Le cours a bien été annulé !',
    canceledCancel: "Le cours n'a pas été annulé.",
    valueCanceled: ':warning: **__COURS ANNULÉ !__**',

    // Record subcommand
    recordLinksHeader: "Liens d'enregistrement du cours :\n{links}",
    recordLinkLine: `- ${hideLinkEmbed('{link}')}`,
    noRecordLinks: "Il n'y a pas de lien d'enregistrement disponible pour ce cours !",
    linkAnnouncement: `L'enregistrement du cours "{topic}" ({date}) a été publié sur ce lien : ${hideLinkEmbed('{link}')} !`,
    successfullyAddedLink: 'Le lien a bien été ajouté au cours !',
    successfullyRemovedLink: 'Le lien a bien été retiré !',
    noRecordLinkProvided: "Ajoute un lien d'enregistrement !",

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
      professorValue: userMention('{professorId}'),
      placeName: 'Lieu',
      placeValue: '{where}',
      recordedName: 'Enregistré',
      recordedValue: '{recorded}',
      relatedName: 'Autres données associées',
      relatedValue: `Rôle visé : ${roleMention('{targetRoleId}')}\n[Message d'annonce]({messageLink})`,
    },

    // Subscribing
    subscribed: "Tu t'es bien inscrit au cours de \"{topic}\" ({subject.name}) ! Je te le rappellerai un peu avant :)",
    unsubscribed: "Tu t'es bien désinscrit du cours de \"{topic}\" ({subject.name}) !",
  },
} as const;

/* eslint-disable import/prefer-default-export */
import { stripIndent } from 'common-tags';
import type { MessageSelectOptionData } from 'discord.js';
import { EclassStatus } from '@/types/database';

export const eclass = {
  options: {
    aliases: ['cours', 'class', 'ecours', 'eclass', 'e-cours', 'e-class'],
    description: stripIndent`
      Commande permettant de créer un cours. Vous pouvez utiliser \`!cours create\` et vous laisser guider par le menu interactif qui apparaitra.
      Quand le cours sera créé, des messages seront envoyés dans les bons salons pour prévenir les membres, et un rôle spécial sera créé pour que les personnes voulant assister au cours puissent être notifiées.
      Le cours se lancera tout seul à l'heure indiquée (ou jusqu'à 2 minutes après). Sinon, vous pouvez le lancer manuellement avec \`!cours start <ID cours>\`.
      Le cours s'arrêtera au bout de la durée spécifiée. S'il se finit avant, vous pouvez l'arrêter manuellement avec \`!cours finish <ID cours>\`.
      Pour plus d'informations sur comment utiliser cette commande, faites \`!cours help\`.
    `,
    enabled: true,
    usage: 'cours <create|start|finish|edit|cancel|list|help>',
    examples: ['!cours setup', '!cours list', '!cours start pierre_232623082021_jneh'],
  },
  messages: {
    // Global
    invalidClassId: "Désolé, mais cet identifiant n'est pas valide. L'identifiant de la classe a été envoyé quand elle a été crée, et il est toujours disponible dans l'embed d'annonce du cours.",
    onlyProfessor: 'Seul les professeurs peuvent effectuer cette action !',
    unresolvedProfessor: ':x: Impossible de retrouver le professeur pour ce cours !',
    unconfiguredChannel: "Oups, impossible de créer ce cours car aucun salon n'a été configuré pour les annonces. Configurez-en un en tapant la commande `setup class` dans le bon salon.",
    editUnauthorized: "Tu ne peux pas modifier un cours qui n'est pas a toi !",
    statusIncompatible: 'Tu ne peux pas faire cette action alors que le cours {status}',

    // Statuses
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

    // Help subcommand
    helpEmbedTitle: 'Aide de la commande de cours',
    helpEmbedDescription: [
      { name: 'Créer un cours', value: '`!cours create`' },
      { name: 'Commencer un cours', value: '`!cours start <ID-cours>`' },
      { name: 'Terminer un cours manuellement', value: '`!cours finish <ID-cours>`' },
      { name: 'Modifier un cours', value: '`!cours edit <ID-cours> <propriété> <valeur>`\n`propriété`: "sujet", "date", "heure", "durée", "professeur", "rôle", "enregistré"' },
      { name: 'Annuler un cours', value: '`!cours cancel <ID-cours>`' },
      { name: 'Liste des cours', value: '`!cours list [--statut=<statut>] [--matiere=<matière>] [--professeur=<professeur>] [--role=<role>]`' },
      { name: 'Définir/voir si le cours est enregistré', value: '`!cours record <ID-cours> [lien]`' },
      { name: "Page d'aide", value: '`!cours help`' },
    ],

    // List subcommand
    listTitle: 'Liste des cours',
    noClassesFound: "Aucune classe n'a été trouvée...",
    someClassesFound: (amount: number): string => `${amount} classe${amount > 1 ? 's ont' : ' a'} été trouvée${amount > 1 ? 's' : ''} !`,
    filterTitle: 'Filtre(s) de recherche appliqué(s) :\n{filters}\n\n',
    noFilter: 'Aucun filtre de recherche appliqué',
    statusFilter: '• Statut : {value}',
    professorFilter: '• Professeur : {value}',
    roleFilter: '• Rôle : {value}',
    subjectFilter: '• Matière : {value}',
    listFieldTitle: '{topic} ({subject.name})',
    listFieldDescription: stripIndent`
      :speech_left: <#{subject.textChannel}>
      :bulb: {status}
      :calendar: Prévue <t:{date}:R>, dure {duration}, se termine à <t:{end}:t>
      :hash: \`{classId}\`
    `,

    // Create subcommand
    successfullyCreated: 'Le cours a bien été créé ! Son ID est `{eclass.classId}`',
    alreadyExists: 'Ce cours (même matière, sujet, heure, jour) a déjà été prévu !',
    newClassNotification: ':bell: {targetRole}, un nouveau cours a été plannifié ! :arrow_heading_down:',

    newClassEmbed: {
      title: '{subject.name} - {topic}',
      description: "Un nouveau cours en {classChannel} a été planifié sur Ef'Réussite !\nRéagis avec :white_check_mark: pour être notifié du cours !",
      author: "Ef'Réussite - Nouveau cours !",
      date: 'Date et heure',
      duration: 'Durée prévue',
      professor: 'Professeur',
      recorded: 'Enregistré',
      recordedValues: ['Non :x:', 'Oui :white_check_mark:'],
      recordedLink: '\n[Lien]({link})',
      footer: 'ID : {eclass.classId}',
    },

    createClassSetup: {
      embed: {
        title: "Création d'un cours",
        description: "Bienvenue dans l'assistant de création de cours. Suivez les étapes ci-dessous en sélectionnant l'option dans le menu déroulant qui s'affiche, ou en envoyant un message comme il vous sera demandé. Vous pouvez, à tous moment, abandonner la création du cours en cliquant sur \"Abandonner\".",
        stepPreviewTitle: 'Aperçu des étapes',
        stepPreviewDescription: 'Aperçu des étapes',
        currentStepTitle: 'Étape actuelle : {step}',
        currentStepDescription: [
          'Choisissez dans le menu déroulant ci-dessous quelle promotion votre cours vise.',
          'Choisissez dans le menu déroulant ci-dessous sur quelle matière votre cours porte.',
          'Envoyez un message contenant le sujet de votre cours.',
          'Envoyez un message contenant la date à laquelle votre cours est prévu.',
          "Envoyez un message contenant l'heure à laquelle votre cours est prévu.",
          'Envoyez un message contenant le professeur en charge de votre cours.',
          'Envoyez un message contenant le rôle visé par votre cours.',
          'Choisissez dans le menu déroulant ci-dessou si oui ou non votre cours sera enregistré.',
          'Terminé !',
        ],
      },
      promptMessageDropdown: 'Choisissez une option dans le menu déroulant ci-dessus :arrow_heading_up: ',
      stepPreview: stripIndent`
        **1.** __Promotion :__ {schoolYear}
        **2.** __Matière :__ {subject}
        **3.** __Sujet :__ {topic}
        **4.** __Date :__ {date}
        **5.** __Durée :__ {duration}
        **6.** __Professeur :__ {professor}
        **7.** __Rôle visé :__ {role}
        **8.** __Enregistré :__ {isRecorded}
      `,
      schoolYearMenu: {
        placeholder: 'Aucune année sélectionnée',
        options: [
          { label: 'L1 - Promo 2026', emoji: '1⃣' },
          { label: 'L2 - Promo 2025', emoji: '2⃣' },
          { label: 'L3 - Promo 2024', emoji: '3⃣' },
        ] as Array<Omit<MessageSelectOptionData, 'value'>>,
      },
      subjectMenu: {
        placeholder: 'Aucune matière sélectionnée',
      },
      isRecordedMenu: {
        placeholder: 'Aucune valeur sélectionnée',
        options: [{
          label: 'Oui',
          description: 'Le cours sera enregistré par le professeur ou un élève',
          emoji: '✅',
        }, {
          label: 'Non',
          description: 'Le cours ne sera pas enregistré',
          emoji: '❌',
        }] as Array<Omit<MessageSelectOptionData, 'value'>>,
      },
      abortMenu: {
        label: 'Abandonner',
      },
    },

    // Edit subcommand
    invalidEditProperty: 'Cette propriété est invalide. Choisissez parmi "sujet", "date", "heure", "durée", "professeur", "rôle".',

    editedTopic: 'Vous avez bien modifié le thème du cours en "{eclass.topic}".',
    pingEditedTopic: '{role}, le cours a été modifié : le thème a été changé en "{eclass.topic}".',

    editedDate: 'Vous avez bien modifié la date du cours pour le {eclass.date}.',
    pingEditedDate: '{role}, le cours a été modifié : la date a été changée pour le {eclass.date}.',

    editedHour: "Vous avez bien modifié l'heure du cours pour le {eclass.date}.",
    pingEditedHour: "{role}, le cours a été modifié : l'heure a été changée pour le {eclass.date}.",

    editedDuration: 'Vous avez bien modifié la durée du cours en {eclass.duration}.',
    pingEditedDuration: '{role}, le cours a été modifié : la durée a été changée en {eclass.duration}.',

    editedProfessor: 'Vous avez bien modifié le professeur du cours qui est maintenant <@{eclass.professor}>.',
    pingEditedProfessor: '{role}, le cours a été modifié : le professeur est maintenant <@{eclass.professor}>.',

    editedRole: 'Vous avez bien modifié le rôle visé en "{eclass.role}".',
    pingEditedRole: '{role}, le cours a été modifié : le rôle visé est maintenant "{eclass.role}".',

    editedRecorded: "Vous avez bien modifié le statut d'enregistrement du cours en `{eclass.isRecorded}`.",
    pingEditedRecorded: '{role}, le cours a été modifié : ',
    pingEditedRecordedValues: ['il ne sera plus enregistré.', 'il sera maintenant enregistré.'],

    // Start subcommand
    successfullyStarted: 'Le cours a bien été lancé !',
    startClassNotification: ':bell: <@&{classRole}>, le cours commence !',
    remindClassNotification: ':bell: <@&{classRole}> rappel : le cours commence dans {duration}',
    remindClassPrivateNotification: ":bell: Tu t'es inscrit au cours \"{eclass.topic}\". Il va commencer dans environ 15 minutes ! Tien-toi prêt :\\)",
    valueInProgress: '[En cours]',

    startClassEmbed: {
      title: 'Le cours en {eclass.subject.name} va commencer !',
      author: "Ef'Réussite - Un cours commence !",
      description: 'Le cours en **{eclass.subject.name}** sur "**{eclass.topic}**" présenté par <@{eclass.professor}> commence ! Le salon textuel associé est <#{eclass.subject.textChannel}>, et le salon vocal est <#{eclass.subject.voiceChannel}>',
      footer: 'ID : {eclass.classId}',
    },

    // Finish subcommand
    successfullyFinished: 'Le cours a bien été terminé !',
    valueFinished: '[Terminé]',

    // Cancel subcommand
    confirmCancel: 'Es-tu sûr de vouloir annuler ce cours ? Cette action est irrévocable.',
    successfullyCanceled: 'Le cours a bien été annulé !',
    valueCanceled: ':warning: **__COURS ANNULÉ !__**',

    // Record subcommand
    recordLink: "Le lien d'enregistrement de ce cours est <{link}>.",
    noRecordLink: "Il n'y a pas de lien d'enregistrement disponible pour ce cours !",
    successfullyAddedLink: 'Le lien a bien été ajouté au cours !',

    // Subscribing
    subscribed: "Tu t'es bien inscrit au cours de \"{topic}\" ({subject.name}) ! Je te le rappellerai un peu avant :)",
    unsubscribed: "Tu t'es bien désinscrit du cours de \"{topic}\" ({subject.name}) !",

    // Prompts
    prompts: {
      subject: {
        base: 'Entrez le code de la matière associée au cours que vous souhaitez donner (par exemple "TI403" ou "SM204") :',
        invalid: 'Ce code de matière est invalide.',
      },
      topic: {
        base: 'Entrez le sujet du cours que vous souhaitez donner (nom du chapitre, thème du cours...) :',
        invalid: 'Ce sujet est invalide.',
      },
      date: {
        base: 'Entrez la date du cours que vous souhaitez donner (au format "jj/MM") :',
        invalid: "Cette date est invalide. Vérifie bien qu'elle ne soit pas passée et qu'elle soit prévue pour dans moins de 2 mois.",
      },
      hour: {
        base: "Entrez l'heure de début du cours que vous souhaitez donner (au format \"HH:mm\") :",
        invalid: "Cette heure est invalide. Vérifie bien que la date ne soit pas passée et qu'elle soit prévue pour dans moins de 2 mois.",
      },
      duration: {
        base: 'Entrez une durée pour votre cours (en anglais ou en français).\nVous pouvez par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Vous pouvez également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
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
      recorded: {
        base: 'Entrez si oui ou non le cours sera enregistré (oui/o/yes/y | non/no/n) :',
        invalid: 'Cette valeur est invalide.',
      },

      stoppedPrompting: "Tu as bien abandonné la commande ! Aucun cours n'a été créé.",
    },
  },
};

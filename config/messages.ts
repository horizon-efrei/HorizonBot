import { Identifiers } from '@sapphire/framework';
import { oneLine, stripIndent } from 'common-tags';
import settings from '@/config/settings';
import { DiscordLogType } from '@/types/database';

export default {
  global: {
    oops: ":warning: Oups... Quelque chose s'est mal passé en réalisant cette action. Il se peut qu'elle ne se soit pas complètement terminée, voire pas commencée. Désolé !",
  },
  errors: {
    precondition: {
      [Identifiers.PreconditionStaffOnly]: ":x: Aïe, tu n'as pas la permission de faire cela :confused:",
      unknownError: "Une pré-condition de commande inconnue t'empêche d'effectuer cette action.",
    },
  },
  miscellaneous: {
    eprofMentionPublic: '{eProf} nous avons besoin de toi !',
    eprofMentionPrivate: '{member} a besoin de toi là-bas : {message.channel}',
    paginatedMessagePrompt: 'À quelle page désires-tu aller ?',
  },
  logs: {
    readableEvents: new Map([
      [DiscordLogType.ChangeNickname, ':label: Changement de surnom'],
      [DiscordLogType.ChangeUsername, ':label: Changement de pseudo'],
      [DiscordLogType.GuildJoin, ':green_heart: Membre rejoint le serveur'],
      [DiscordLogType.GuildLeave, ':broken_heart: Membre quitte le serveur'],
      [DiscordLogType.InvitePost, ':link: Invitation Discord externe postée'],
      [DiscordLogType.MessageEdit, ':incoming_envelope: Message modifié'],
      [DiscordLogType.MessagePost, ':envelope_with_arrow: Message posté'],
      [DiscordLogType.MessageRemove, ':wastebasket: Message supprimé'],
      [DiscordLogType.ReactionAdd, ':smiley: Réaction ajoutée'],
      [DiscordLogType.ReactionRemove, ':anguished: Réaction retirée'],
      [DiscordLogType.RoleAdd, ':beginner: Rôle ajouté'],
      [DiscordLogType.RoleRemove, ':octagonal_sign: Rôle enlevé'],
      [DiscordLogType.VoiceJoin, ':loud_sound: Connection en vocal'],
      [DiscordLogType.VoiceLeave, ":mute: Déconnexion d'un vocal"],
      [DiscordLogType.VoiceMove, ':repeat: Changement de salon vocal'],
    ]),
    simplifiedReadableEvents: new Map([
      [DiscordLogType.ChangeNickname, 'changement de surnom'],
      [DiscordLogType.ChangeUsername, 'changement de pseudo'],
      [DiscordLogType.GuildJoin, 'membre rejoint le serveur'],
      [DiscordLogType.GuildLeave, 'membre quitte le serveur'],
      [DiscordLogType.InvitePost, 'invitation Discord postée'],
      [DiscordLogType.MessageEdit, 'message modifié'],
      [DiscordLogType.MessagePost, 'message posté'],
      [DiscordLogType.MessageRemove, 'message supprimé'],
      [DiscordLogType.ReactionAdd, 'réaction ajoutée'],
      [DiscordLogType.ReactionRemove, 'réaction retirée'],
      [DiscordLogType.RoleAdd, 'rôle ajouté'],
      [DiscordLogType.RoleRemove, 'rôle enlevé'],
      [DiscordLogType.VoiceJoin, 'connection en vocal'],
      [DiscordLogType.VoiceLeave, 'changement de salon vocal'],
    ]),
    embedTitle: 'Logs automatiques',
    fields: {
      [DiscordLogType.ChangeNickname]: {
        color: settings.colors.gray,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: 'Cible : <@{context.userId}>\nExécuteur : <@{context.executorId}>',
        contentName: ':label: Surnom',
        contentValue: '```diff\n- {content.before}\n+ {content.after}```',
      },
      [DiscordLogType.ChangeUsername]: {
        color: settings.colors.gray,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ':label: Nouveau pseudo',
        contentValue: '```diff\n- {content.before}\n+ {content.after}```',
      },
      [DiscordLogType.GuildJoin]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ":link: Lien d'invitation",
        contentValue: '`{code}`: lien créé par {link.inviter}, utilisé {link.uses} fois.',
      },
      [DiscordLogType.GuildLeave]: {
        color: settings.colors.red,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ":file_folder: Récap' des informations",
        contentValue: stripIndent`
          Pseudo : "{content.username}" / Surnom : "{content.displayName}" (ID: \`{content.userId}\`)
          À rejoint : <t:{content.joinedAt}:R>
          Rôles : {content.roles}
        `,
      },
      [DiscordLogType.InvitePost]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context.authorId}>',
        contentName: ':link: Invitation(s) postée(s)',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans <#{context.channelId}>)
          Invitations : {content}
        `,
      },
      [DiscordLogType.MessageEdit]: {
        color: settings.colors.yellow,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context.authorId}>',
        contentName: ':pencil: Message',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans <#{context.channelId}>)
          Contenu : {content}
        `,
      },
      [DiscordLogType.MessagePost]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context.authorId}>',
        contentName: ':pencil: Nouveau message',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans <#{context.channelId}>)
          Contenu : {content}
        `,
      },
      [DiscordLogType.MessageRemove]: {
        color: settings.colors.red,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: 'Auteur du message : <@{context.authorId}>\nExécuteur : <@{context.executorId}>',
        contentName: ':pencil: Message',
        contentValue: stripIndent`
          Dans <#{context.channelId}>
          Contenu : {content}
        `,
      },
      [DiscordLogType.ReactionAdd]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context.authorId}>',
        contentName: 'Réaction',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans <#{context.channelId}>)
          Auteur du message : <@{context.authorId}>
          Réaction : {content}
        `,
      },
      [DiscordLogType.ReactionRemove]: {
        color: settings.colors.red,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context.authorId}>',
        contentName: 'Réaction',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans <#{context.channelId}>)
          Auteur du message : <@{context.authorId}>
          Réaction : {content}
        `,
      },
      [DiscordLogType.RoleAdd]: {
        color: settings.colors.green,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: 'Cible : <@{context.userId}>\nExécuteur : <@{context.executorId}>',
        contentName: ':billed_cap: Rôle ajouté',
        contentValue: '{content}',
      },
      [DiscordLogType.RoleRemove]: {
        color: settings.colors.red,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: 'Cible : <@{context.userId}>\nExécuteur : <@{context.executorId}>',
        contentName: ':billed_cap: Rôle enlevé',
        contentValue: '{content}',
      },
      [DiscordLogType.VoiceJoin]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ':sound: Salon',
        contentValue: '<#{content}>',
      },
      [DiscordLogType.VoiceLeave]: {
        color: settings.colors.red,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ':sound: Salon',
        contentValue: '<#{content}>',
      },
      [DiscordLogType.VoiceMove]: {
        color: settings.colors.yellow,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ':sound: Salon',
        contentValue: 'Avant : <#{content.before}>\nAprès : <#{content.after}>',
      },
    },
  },
  reminders: {
    alarm: ":alarm_clock: Il est l'heure ! Tu m'avais demandé de te rappeler ceci :\n> {description}",
    noDescription: 'Aucune description',
  },
  upcomingClasses: {
    header: '__Calendrier des séances de révisions des 7 prochains jours__\n*Il est tenu à jour automatiquement, pensez à le regarder régulièrement !*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
    noClasses: 'Aucune séance de prévue !',
    today: " (Aujourd'hui)",
    classLine: '• ({eclass.subject.schoolYear}) {beginHour}-{endHour}: {eclass.topic} <#{eclass.subject.textChannel}> (par <@{eclass.professor}>) [<@&{eclass.targetRole}>]\n',
  },
  classesCalendar: {
    noClasses: 'Aucun cours prévu pour le moment.',
    noSubjects: 'Aucune matière disponible.',
    subjectTitle: '{emoji} {name}',
    textChannel: '<#{textChannel}>',
    textDocsChannel: ' • Documents : <#{textDocsChannel}>',
    voiceChannel: ' • Vocal : <#{voiceChannel}> *(cliquez pour rejoindre)*',
    body: stripIndent`
      {exams}

      **Cours terminés ou annulés :**
      {finishedClasses}

      **Cours prévus :**
      {plannedClasses}
      **\n**
    `,
    classLine: '• <t:{date}:R> - {beginHour}-{endHour} (<@{professor}>) : {topic}',
  },
  antiSwear: {
    swearModeratorAlert: stripIndent`
      {message.member} a envoyé un message jugé innaproprié par {moderator} dans {message.channel}. Il/elle a donc été sommé(e) en MP.

      Aperçu du message ({message.url}) :
      > {preview}
    `,
    swearUserAlertPrivate: oneLine`
      Bonjour {message.member}, je suis le bot du Discord de révision Ef'Réussite. Tu as tenu un propos innaproprié
      dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, nous t'invitons donc à supprimer
      ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié dans ce salon. On s'efforce à garder ce serveur
      sérieux et amical, nous t'invitons donc à supprimer ce message ou enlever cette insulte le plus rapidement possible.
      Merci !\n{message.url}
    `,
  },
  prompts: {
    channel: {
      base: 'Entre un salon (mentionne-le ou entre son nom ou son ID) :',
      invalid: 'Ce salon est invalide.',
    },
    message: {
      base: 'Entre un message (son ID ou son URL) :',
      invalid: 'Ce message est invalide.',
    },
    text: {
      base: 'Entre du texte :',
      invalid: 'Ce texte est invalide.',
    },
    day: {
      base: 'Entre une date (au format "jj/MM")  :',
      invalid: 'Cette date est invalide.',
    },
    hour: {
      base: 'Entre une heure (au format "HH:mm") :',
      invalid: 'Cette heure est invalide.',
    },
    date: {
      base: 'Entre une date (au format "jj/MM HH:mm")  :',
      invalid: 'Cette date est invalide.',
    },
    duration: {
      base: 'Entre une durée (en anglais ou en francais).\nTu peux par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Tu peux également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
      invalid: 'Cette durée est invalide.',
    },
    member: {
      base: 'Entre un membre (mentionne-le ou entre son pseudo ou son ID) :',
      invalid: 'Ce membre est invalide.',
    },
    role: {
      base: 'Entre un rôle (mentionne-le ou entre son nom ou son ID) :',
      invalid: 'Ce rôle est invalide.',
    },
    boolean: {
      base: 'Entre un booléen ("oui"/"non") :',
      invalid: 'Ce booléan est invalide.',
    },

    stoppedPrompting: 'Tu as bien abandonné la commande !',
  },
};

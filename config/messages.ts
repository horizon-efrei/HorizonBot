import { Identifiers } from '@sapphire/framework';
import { stripIndent } from 'common-tags';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  channelMention,
  roleMention,
  TimestampStyles,
  userMention,
} from 'discord.js';
import { settings } from '@/config/settings';
import { DiscordLogType, LogStatuses } from '@/types/database';
import { timeFormat } from '@/utils';

export const messages = {
  global: {
    invitationLine: '`{code}`: lien créé par {link.inviter}, utilisé {link.uses} fois.',
  },
  errors: {
    precondition: {
      [Identifiers.PreconditionCooldown]: 'Pas si vite ! Cette commande est sous cooldown, attendez un peu avant de la réutiliser.',
      unknownError: "Une pré-condition de commande inconnue t'empêche d'effectuer cette action.",
    },
    wrongUserInteractionReply: 'Tu ne peux pas cliquer sur ces boutons, ils sont réservés à {user}.',
  },
  logs: {
    readableEvents: {
      [DiscordLogType.MemberNicknameUpdate]: ':label: Changement de surnom',
      [DiscordLogType.UserUsernameUpdate]: ':label: Changement de pseudo',
      [DiscordLogType.ChannelCreate]: ":couch: Création d'un salon",
      [DiscordLogType.ChannelUpdate]: ":couch: Modification d'un salon",
      [DiscordLogType.ChannelDelete]: ":couch: Suppression d'un salon",
      [DiscordLogType.RoleCreate]: ":couch: Création d'un rôle",
      [DiscordLogType.RoleUpdate]: ":couch: Modification d'un rôle",
      [DiscordLogType.RoleDelete]: ":couch: Suppression d'un rôle",
      [DiscordLogType.GuildJoin]: ':green_heart: Membre rejoint le serveur',
      [DiscordLogType.GuildLeave]: ':broken_heart: Membre quitte le serveur',
      [DiscordLogType.InvitePost]: ':link: Invitation Discord externe postée',
      [DiscordLogType.MessageUpdate]: ':incoming_envelope: Message modifié',
      [DiscordLogType.MessageCreate]: ':envelope_with_arrow: Message posté',
      [DiscordLogType.MessageDelete]: ':wastebasket: Message supprimé',
      [DiscordLogType.MessageDeleteBulk]: ':wastebasket: Messages supprimés en masse',
      [DiscordLogType.ReactionAdd]: ':smiley: Réaction ajoutée',
      [DiscordLogType.ReactionRemove]: ':anguished: Réaction retirée',
      [DiscordLogType.MemberRoleAdd]: ':beginner: Rôle ajouté',
      [DiscordLogType.MemberRoleRemove]: ':octagonal_sign: Rôle enlevé',
      [DiscordLogType.VoiceJoin]: ':loud_sound: Connection en vocal',
      [DiscordLogType.VoiceLeave]: ":mute: Déconnexion d'un salon vocal",
      [DiscordLogType.VoiceMove]: ':repeat: Changement de salon vocal',
    },
    simplifiedReadableEvents: {
      [DiscordLogType.MemberNicknameUpdate]: 'changement de surnom',
      [DiscordLogType.UserUsernameUpdate]: 'changement de pseudo',
      [DiscordLogType.ChannelCreate]: "création d'un salon",
      [DiscordLogType.ChannelUpdate]: "modification d'un salon",
      [DiscordLogType.ChannelDelete]: "suppression d'un salon",
      [DiscordLogType.RoleCreate]: "création d'un rôle",
      [DiscordLogType.RoleUpdate]: "modification d'un rôle",
      [DiscordLogType.RoleDelete]: "suppression d'un rôle",
      [DiscordLogType.GuildJoin]: 'membre rejoint le serveur',
      [DiscordLogType.GuildLeave]: 'membre quitte le serveur',
      [DiscordLogType.InvitePost]: 'invitation Discord postée',
      [DiscordLogType.MessageUpdate]: 'message modifié',
      [DiscordLogType.MessageCreate]: 'message posté',
      [DiscordLogType.MessageDelete]: 'message supprimé',
      [DiscordLogType.MessageDeleteBulk]: 'messages supprimés en masse',
      [DiscordLogType.ReactionAdd]: 'réaction ajoutée',
      [DiscordLogType.ReactionRemove]: 'réaction retirée',
      [DiscordLogType.MemberRoleAdd]: 'rôle ajouté',
      [DiscordLogType.MemberRoleRemove]: 'rôle enlevé',
      [DiscordLogType.VoiceJoin]: 'connection en vocal',
      [DiscordLogType.VoiceLeave]: "déconnexion d'un salon vocal",
      [DiscordLogType.VoiceMove]: 'changement de salon vocal',
    },
    readableStatuses: {
      [LogStatuses.Disabled]: 'Désactivé',
      [LogStatuses.Silent]: 'Silencieux (stocké)',
      [LogStatuses.Console]: 'Console (stocké + affiché dans la console)',
      [LogStatuses.Discord]: 'Discord (stocké + affiché dans la console + envoyé sur Discord)',
    },
    embedTitle: 'Logs automatiques',
    fields: {
      [DiscordLogType.MemberNicknameUpdate]: {
        color: settings.colors.gray,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: `Cible : ${userMention('{context.userId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':label: Surnom',
        contentValue: '```diff\n- {content.before}\n+ {content.after}```',
      },
      [DiscordLogType.UserUsernameUpdate]: {
        color: settings.colors.gray,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context}'),
        contentName: ':label: Nouveau pseudo',
        contentValue: '```diff\n- {content.before}\n+ {content.after}```',
      },
      [DiscordLogType.ChannelCreate]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Salon',
        contextValue: `Salon : ${channelMention('{context.channelId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':information_source: Informations',
        contentValue: stripIndent`
          **Nom :** "{name}"
          **Type :** {type}
          **Salon Parent :** {parentIfExist} (permissions synchronisées : {synced})
          **Position :** {position}
          **Flags :** {flags}
        `,
      },
      [DiscordLogType.ChannelUpdate]: {
        color: settings.colors.yellow,
        contextName: ':bust_in_silhouette: Salon',
        contextValue: `Salon : ${channelMention('{context.channelId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':information_source: Informations',
        contentValue: '/',
        contentValueParts: {
          name: '**Nom :** "{before.name}" → "{after.name}"',
          type: '**Type :** {before.type} → {after.type}',
          parent: '**Salon Parent :** {before.parentIfExist} (sync. : {before.synced}) → {after.parentIfExist} (sync. : {after.synced})',
          position: '**Position :** {before.position} → {after.position}',
          flags: '**Flags :** {before.flags} → {after.flags}',
          permissions: '**Permissions :** Voir les changements ci-dessous',
        },
      },
      [DiscordLogType.ChannelDelete]: {
        color: settings.colors.orange,
        contextName: ':bust_in_silhouette: Salon',
        contextValue: `Exécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':information_source: Informations',
        contentValue: stripIndent`
          **Nom :** "{name}"
          **Type :** {type}
          **Salon Parent :** {parentIfExist} (permissions synchronisées : {synced})
          **Flags :** {flags}
        `,
      },
      [DiscordLogType.RoleCreate]: {
        color: settings.colors.green,
        contextName: ':billed_cap: Rôle',
        contextValue: `Rôle : ${roleMention('{context.roleId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':information_source: Informations',
        contentValue: stripIndent`
          **Nom :** "{name}"
          **Couleur :** {hexColor}
          **Séparé :** {hoist}
          **Mentionable :** {mentionable}
          **Position :** {position}
          **Géré par une intégration :** {managed}
        `,
      },
      [DiscordLogType.RoleUpdate]: {
        color: settings.colors.yellow,
        contextName: ':billed_cap: Rôle',
        contextValue: `Rôle : ${roleMention('{context.roleId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':information_source: Informations',
        contentValue: '/',
        contentValueParts: {
          name: '**Nom :** "{before.name}" → "{after.name}"',
          color: '**Couleur :** {before.hexColor} → {after.hexColor}',
          hoist: '**Séparé :** {before.hoist} → {after.hoist}',
          mentionable: '**Mentionable :** {before.mentionable} → {after.mentionable}',
          managed: '**Géré par une intégration :** {before.managed} → {after.managed}',
          position: '**Position :** {before.position} → {after.position}',
          permissions: '**Permissions :** Voir les changements ci-dessous',
        },
      },
      [DiscordLogType.RoleDelete]: {
        color: settings.colors.orange,
        contextName: ':billed_cap: Rôle',
        contextValue: `Exécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':information_source: Informations',
        contentValue: stripIndent`
          **Nom :** "{name}"
          **Couleur :** {hexColor}
          **Séparé :** {hoist}
          **Mentionable :** {mentionable}
          **Géré par une intégration :** {managed}
        `,
      },
      [DiscordLogType.GuildJoin]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context}'),
        contentName: ':information_source: Informations',
        contentValue: stripIndent`
          Invitation(s): {links}
          **{nth}ème** membre.
        `,
      },
      [DiscordLogType.GuildLeave]: {
        color: settings.colors.red,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context}'),
        contentName: ":file_folder: Récap' des informations",
        contentValue: stripIndent`
          Pseudo : "{content.username}" / Surnom : "{content.displayName}" (ID: \`{content.userId}\`)
          À rejoint : ${timeFormat('{content.joinedAt}', TimestampStyles.RelativeTime)}
          Rôles : {content.roles}
        `,
      },
      [DiscordLogType.InvitePost]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context.authorId}'),
        contentName: ':link: Invitation(s) postée(s)',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans ${channelMention('{context.channelId}')})
          Invitations : {content}
        `,
      },
      [DiscordLogType.MessageUpdate]: {
        color: settings.colors.yellow,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context.authorId}'),
        contentName: ':pencil: Message',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans ${channelMention('{context.channelId}')})
          Contenu : \`\`\`diff
          {content.messageContent.before}
          {content.messageContent.after}
          \`\`\`
          Pièces Jointes retirées : {content.attachments}
        `,
      },
      [DiscordLogType.MessageCreate]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context.authorId}'),
        contentName: ':pencil: Nouveau message',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans ${channelMention('{context.channelId}')})
          Contenu : {content.messageContent}
          Pièces Jointes : {content.attachments}
        `,
      },
      [DiscordLogType.MessageDelete]: {
        color: settings.colors.red,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: `Auteur du message : ${userMention('{context.authorId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':pencil: Message',
        contentValue: stripIndent`
          Dans ${channelMention('{context.channelId}')}
          Contenu : {content.messageContent}
          Pièces Jointes : {content.attachments}
        `,
      },
      [DiscordLogType.MessageDeleteBulk]: {
        color: settings.colors.red,
        contextName: ':busts_in_silhouette: Membre',
        contextValue: `Exécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':pencil: Messages',
        contentValue: stripIndent`
          Dans ${channelMention('{context.channelId}')}
          Nombre de messages : {content.length}
        `,
      },
      [DiscordLogType.ReactionAdd]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context.authorId}'),
        contentName: 'Réaction',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans ${channelMention('{context.channelId}')})
          Auteur du message : ${userMention('{context.authorId}')}
          Réaction : {content}
        `,
      },
      [DiscordLogType.ReactionRemove]: {
        color: settings.colors.red,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context.authorId}'),
        contentName: 'Réaction',
        contentValue: stripIndent`
          [Lien vers le message]({url}) (dans ${channelMention('{context.channelId}')})
          Auteur du message : ${userMention('{context.authorId}')}
          Réaction : {content}
        `,
      },
      [DiscordLogType.MemberRoleAdd]: {
        color: settings.colors.green,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: `Cible : ${userMention('{context.userId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':billed_cap: Rôle ajouté',
        contentValue: '{content}',
      },
      [DiscordLogType.MemberRoleRemove]: {
        color: settings.colors.red,
        contextName: ':busts_in_silhouette: Membres',
        contextValue: `Cible : ${userMention('{context.userId}')}\nExécuteur : ${userMention('{context.executorId}')}`,
        contentName: ':billed_cap: Rôle enlevé',
        contentValue: '{content}',
      },
      [DiscordLogType.VoiceJoin]: {
        color: settings.colors.green,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context}'),
        contentName: ':sound: Salon',
        contentValue: channelMention('{content}'),
      },
      [DiscordLogType.VoiceLeave]: {
        color: settings.colors.red,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context}'),
        contentName: ':sound: Salon',
        contentValue: channelMention('{content}'),
      },
      [DiscordLogType.VoiceMove]: {
        color: settings.colors.yellow,
        contextName: ':bust_in_silhouette: Membre',
        contextValue: userMention('{context}'),
        contentName: ':sound: Salon',
        contentValue: `Avant : ${channelMention('{content.before}')}\nAprès : ${channelMention('{content.after}')}`,
      },
    },
  },
  reminders: {
    alarm: ":alarm_clock: Il est l'heure ! Tu m'avais demandé de te rappeler ceci :\n>>> {description}",
    noDescription: 'Aucune description',
    noLongerValid: "Ce rappel n'est plus valide !",
    snoozed: `Tu as bien reporté le rappel de {duration} ! Je te rappellerai le ${timeFormat('{reminder.date}')} !`,
  },
  upcomingClasses: {
    header: '__Calendrier des séances de révisions des 7 prochains jours__\n*Il est tenu à jour automatiquement, pensez à le regarder régulièrement !*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
    noClasses: 'Aucune séance de prévue !',
    today: " (Aujourd'hui)",
    classLine: `• ({eclass.subject.schoolYear}) {beginHour}-{endHour}: {eclass.topic} ${channelMention('{eclass.subject.textChannelId}')} (par ${userMention('{eclass.professorId}')}) [${roleMention('{eclass.targetRoleId}')}]\n`,
  },
  preAnnouncements: {
    threadName: "Message d'annonce",
    threadMessage: stripIndent`
      :green_circle:  Tu viens de créer un brouillon de message d'annonce !
      > Ce n'est pas ce que tu voulais faire ? Pas de panique, tu peux supprimer ton message et le renvoyer dans le bon salon ou le bon thread, ou tu peux le laisser ici et ignorer ce message, comme si c'était un thread normal.
      ### Que faire à partir de maintenant ? :face_with_raised_eyebrow:
      Tu peux mentionner les personnes chargées de relire, corriger et valider ce message, qui peuvent proposer des modifications dans ce fil de discussion. ${userMention('{author.id}')}, tu es en charge d'appliquer ces modifications en modifiant ton message original.
      ### Prêt à envoyer ? :incoming_envelope:
      Si l'annonce te paraît correcte et que toutes les personnes intéressées ont donné leur accord, alors tu peux envoyer le message en tapant la commande \`/announcement send salon:<salon d'annonce>\`
      ### Une modification à faire ? :pencil:
      Si tu te rends compte que le message doit être modifié, pas de soucis.
      - Tu peux modifier le message d'annonce originel, en haut du fil, puis taper \`/announcement edit\`
      - Si tu n'es pas l'auteur du message, tu peux cliquer sur le bouton ci-dessous pour recevoir le message en texte pur, le copier/coller, puis l'envoyer dans ce salon avec les modifications effectuées. Ensuite, tape \`/announcement edit message:<lien du message>\`, avec le lien du message obtenu en faisant clique droit sur le message > copier le lien.

      Si tu dois re-modifier le message, tu peux répéter l'opération autant de fois que nécessaire en tapant \`/announcement edit\` pour utiliser le message originel, ou en précisant le lien vers un message de ce fil pour utiliser un autre message.
    `,
    noAnnouncement: "Impossible de trouver un message d'annonce associé à ce thread.",
    copyButton: {
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId('pre-announcement-copy')
            .setEmoji('📋')
            .setLabel('Copier')
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
      noAnnouncementChannel: "Impossible de trouver le salon d'annonce dans lequel a été envoyée l'annonce associée à ce thread.",
      noAnnouncementMessage: "Impossible de trouver le message d'annonce associé à ce thread.",
      success: "Voici ci-joint le message d'annonce tel-quel, prêt à être copié !",
    },
  },
} as const;

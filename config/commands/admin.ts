import { stripIndent } from 'common-tags';
import {
  hideLinkEmbed,
  hyperlink,
  RESTJSONErrorCodes,
  TimestampStyles,
  userMention,
} from 'discord.js';
import { LogStatuses } from '@/types/database';
import { timeFormat } from '@/utils';
import { settings } from '../settings';

export const analytics = {
  descriptions: {
    name: 'analytics',
    command: "Consulter diverses données aggrégées sur l'utilisation dont les utilisateurs font d'Ef'Réussite",
    options: {
      query: 'Type de données à consulter.',
      classId: 'Pour: joins-over-time | Identifiant de la classe à analyser',
      after: 'Pour: totals | Date après laquelle les classes et participations doivent être comptées',
    },
  },
  messages: {
    attendanceHeatmap: stripIndent`
      ## Heatmap de participation
      > Nombre de participants aux cours (personnes s'étant connectés au salon vocal d'un cours pendant qu'il était encore en cours) jour par jour.

      {content}
    `,
    averageAttendanceDuration: stripIndent`
      ## Durée moyenne de participation
      > Durée moyenne de participation aux cours selon si les participants s'étaient préalablement inscrits ou non.

      **Pour les participants inscrits :** {subscribed}
      **Pour les participants non-inscrits :** {unsubscribed}
    `,
    eclassPopularity: stripIndent`
      ## Popularité des cours
      > Nombre de participants aux cours (personnes s'étant connectés au salon vocal d'un cours pendant qu'il était encore en cours) par cours, selon si les participants s'étaient préalablement inscrits ou non.

      {content}
    `,
    eclassPopularityLine: `- ${hyperlink('{eclass.topic}', hideLinkEmbed('{link}'))} : {count} participations (inscrits : {subscribedCount}, non-inscrits : {nonSubscribedCount})`,
    eclassNotFound: "La classe demandée n'a pas été trouvée, vérifiez que vous avez bien donné son identifiant.",
    joinsOverTime: stripIndent`
      ## Connexions au serveur vocal
      > Nombre de connexions au salon vocal de la classe demandée, par groupe de 5 minutes.

      {content}
    `,
    joinsOverTimeLine: `- ${timeFormat('{date}', TimestampStyles.LongDate)} : {total} participations (inscrits : {isSubscribed}, non-inscrits : {notSubscribed})`,
    subscriptionImpact: stripIndent`
      ## Impact des inscriptions préalables
      > Mesure la différence dans l'utilisations des cours entre les participants préalablements inscrits et non-inscrits. La rétention est si oui ou non l'utilisateur s'est connecté une seconde fois à un cours différent.

      **Pour les participants inscrits ({subscribed.count}) :**
      Durée moyenne de participation : {subscribed.averageDuration}
      Rétention : {subscribed.retention}%

      **Pour les participants non-inscrits ({unsubscribed.count}) :**
      Durée moyenne de participation : {unsubscribed.averageDuration}
      Rétention : {unsubscribed.retention}%
    `,
    totals: stripIndent`
      ## Totaux
      > Nombre de classes et de participations depuis la date demandée, ou depuis le début du serveur si aucune date n'est donnée.

      **Nombre de cours :** {eclassCount}
      **Durée totale des cours :** {eclassDuration}
      **Nombre total de participations :** {participations}
    `,
    retentionRate: stripIndent`
      ## Taux de rétention
      > Mesure la proportion de participants qui se sont connectés à un autre cours, différent, après leur toute première participation.

      **Pour les participants inscrits :** {subscribed}
      **Pour les participants non-inscrits :** {unsubscribed}
    `,
    pipelines: [
      { title: 'Heatmap de participation', value: "Nombre de participants aux cours (personnes s'étant connectés au salon vocal d'un cours pendant qu'il était encore en cours) jour par jour." },
      { title: 'Durée moyenne de participation', value: "Durée moyenne de participation aux cours selon si les participants s'étaient préalablement inscrits ou non." },
      { title: 'Popularité des cours', value: "Nombre de participants aux cours (personnes s'étant connectés au salon vocal d'un cours pendant qu'il était encore en cours) par cours, selon si les participants s'étaient préalablement inscrits ou non." },
      { title: 'Connexions au serveur vocal', value: 'Nombre de connexions au salon vocal de la classe demandée, par groupe de 5 minutes.' },
      { title: 'Impact des inscriptions préalables', value: "Mesure la différence dans l'utilisations des cours entre les participants préalablements inscrits et non-inscrits. La rétention est si oui ou non l'utilisateur s'est connecté une seconde fois à un cours différent." },
      { title: 'Totaux', value: "Nombre de classes et de participations depuis la date demandée, ou depuis le début du serveur si aucune date n'est donnée." },
      { title: 'Taux de rétention', value: 'Mesure la proportion de participants qui se sont connectés à un autre cours, différent, après leur toute première participation.' },
    ],
  },
} as const;

export const announcements = {
  descriptions: {
    name: 'announcements',
    command: 'Gérer les annonces à envoyer',
    subcommands: {
      send: 'Envoyer une annonce',
      edit: 'Modifier une annonce déjà envoyée',
    },
    options: {
      channel: "Salon où envoyer l'annonce.",
      messageLink: 'Lien du message à utiliser',
    },
  },
  messages: {
    errorThreadOnly: 'Cette commande doit être utilisée dans un fil de discussion !',
    errorNoStarterMessage: 'Impossible de trouver le message de départ de ce fil de discussion...',
    errorMultipleWebhooks: stripIndent`
      Il y a plusieurs webhooks commençant par "\`${settings.configuration.announcementWebhookPrefix}\`" pour ce salon, je ne sais pas lequel utiliser… Supprimez les webhooks en trop et réessayez.
      Pour supprimer un webhook d'un salon, allez dans les paramètres du salon, puis "Intégrations" > "Voir les webhooks". Cliquez sur celui que vous voulez supprimer, puis "Supprimer le webhook".
    `,
    errorWebhookSend: "Impossible d'envoyer l'annonce, vérifiez que le bot a bien la permission d'envoyer des messages dans ce salon, et que l'annonce ne dépasse pas 2000 caractères.",
    success: ':white_check_mark: Annonce envoyée avec succès !',
    announcementSent: stripIndent`
      :white_check_mark: L'annonce a été publiée.
      Si tu te rends compte que le message doit être modifié, pas de soucis.
      - Tu peux modifier le message d'annonce originel, en haut du fil, puis taper \`/announcement edit\`
      - Si tu n'es pas l'auteur du message, tu peux cliquer sur le bouton ci-dessous pour recevoir le message en texte pur, le copier/coller, puis l'envoyer dans ce salon avec les modifications effectuées. Ensuite, tape \`/announcement edit message:<lien du message>\`, avec le lien du message obtenu en faisant clique droit sur le message > copier le lien.

      Si tu dois re-modifier le message, tu peux répéter l'opération autant de fois que nécessaire en tapant \`/announcement edit\` pour utiliser le message originel, ou en tapant en précisant le lien vers un message de ce fil pour utiliser un autre message.
    `,
    errorMessageNotFound: 'Impossible de trouver le message demandé, vérifiez que le lien soit correct.',
    errorDestinationChannelNotFound: "Impossible de trouver le salon où envoyer l'annonce, vérifiez qu'il existe toujours.",
  },
} as const;

export const dump = {
  descriptions: {
    name: 'dump',
    command: 'Consulter le liste des membres du serveur actuel qui répond (ou non) à certains critères.',
    options: {
      format: 'Formate les membres en fonction du template donné.',
      hasAllRoles: 'Affiche les membres qui ont tous les rôles indiqués.',
      hasRoles: 'Affiche les membres qui ont au moins un des rôles indiqués.',
      reacted: 'Membres ayant réagi à un message avec la réaction indiquée. Format: "reaction <espace> message"',
      order: 'Trie les membres par ordre alphabétique.',
      limit: 'Affiche uniquement le nombre de membres indiqué.',
      separator: "Change le séparateur entre chaque membre. Par défaut, il s'agit d'une nouvelle ligne.",
      dateFormat: 'Change la manière dont les dates sont représentées.',
      sort: 'Trie les lignes par ordre croissant/décroissant.',
      noRoles: 'Affiche les membres sans rôles.',
      enumerate: 'Affiche des numéros devant chaque membre.',
      private: "Envoie le résultat dans un message privé, qu'uniquement toi peut voir.",
    },
  },
  messages: {
    noMatchFound: "Aucun membre correspondant à ces critères n'a été trouvé.",
    dmSuccess: 'Le résultat a été envoyé en message privé.',
  },
} as const;

export const evaluate = {
  descriptions: {
    name: 'Éval du code via le bot',
  },
  messages: {
    evalTimeout: "Le code a pris plus de 1min pour s'exécuter...",
    output: '**Résultat**\n{output}\n**Type**\n{type}\n:stopwatch: {time}',
    messageNotFound: "Le message n'a pas été trouvé.",
  },
} as const;

export const limits = {
  descriptions: {
    name: 'limits',
    command: 'Consulter le nombre de salons et de rôles actuel, par rapport aux limites imposées par Discord.',
  },
  messages: {
    limits: 'Salons : {channels}/500 (reste {channelsLeft})\nRôles : {roles}/250 (reste {rolesLeft})',
  },
} as const;

export const logs = {
  descriptions: {
    name: 'logs',
    command: 'Gérer comment les logs sont traités.',
    subcommands: {
      edit: 'Gérer comment un log est traité.',
      list: 'Affiche la liste des logs actuellement configurés.',
    },
    options: {
      logName: 'Nom du log à modifier.',
      logStatus: 'Nouveau statut du log.',
    },
  },
  messages: {
    updatedLog: 'Le statut du log **{type}** a bien été changé en **{status}** !',
    updatedAllLog: 'Le statut de **tous les logs** de ce serveur a bien été changé en **{status}** !',
    listTitle: 'Liste des statuts des logs',
    lineValue: '**{type}** : {status}',
    statuses: {
      [LogStatuses.Disabled]: ':no_entry_sign: désactivé',
      [LogStatuses.Silent]: ':no_bell: silencieux',
      [LogStatuses.Console]: ':thought_balloon: console uniquement',
      [LogStatuses.Discord]: ':white_check_mark: Discord & console',
    },
  },
} as const;

export const lxp = {
  descriptions: {
    name: 'lxp',
    command: 'Obtenir la liste des heures de cours données par les eProfs durant le semestre actuel.',
  },
  messages: {
    summary: 'Liste des heures de cours données par les eProfs durant le semestre actuel (depuis le {firstDay}) :\n',
    summaryLine: `    • ${userMention('{prof}')} : {time} heures`,
    noEclasses: "Aucun cours n'a été donné durant le semestre actuel (depuis le {firstDay}).",
  },
} as const;

export const manageContacts = {
  descriptions: {
    name: 'manage-contacts',
    command: "Gérer la liste des contacts utiles des membres de l'administration de l'école.",
    subcommands: {
      create: 'Créer un nouveau contact.',
      edit: 'Modifier un contact existant.',
      remove: 'Supprimer un contact existant.',
    },
    options: {
      name: 'Nom du contact.',
      contact: 'Moyen de contact du contact (mail, téléphone...).',
      team: 'Service auquel le contact est associé.',
      description: 'Description du contact.',
      field: 'Champ à modifier.',
      value: 'Nouvelle valeur du champ.',
    },
  },
  messages: {
    // Global
    invalidContact: 'Impossible de trouver le contact demandé.',

    // Create a contact
    createdContact: 'Ce contact a bien été créé !',

    // Edit contact
    editedContact: 'Le contact a bien été modifié !',

    // Remove contact
    removedContact: 'Le contact a bien été supprimé !',
  },
} as const;

export const manageFaq = {
  descriptions: {
    name: 'manage-faq',
    command: 'Gérer les faq.',
    subcommands: {
      create: 'Créer une nouvelle entrée.',
      edit: 'Modifier une réponse.',
      remove: 'Supprimer une entrée.',
      rename: 'Renommer une question.',
    },
    options: {
      name: 'Question.',
      newName: 'Nouvelle question.',
    },
  },
  messages: {
    // Global
    invalidQuestion: "Cette question n'est pas valide.",
    modals: {
      contentLabel: 'Réponse',
      contentPlaceholder: 'Entrez la réponse à la question ici.',
      createTitle: 'Créer une entée',
      editTitle: 'Modifier la question {name}',
    },

    // Create entry
    createdEntry: 'Cette entrée a bien été créée !',

    // Edit entry
    editedEntry: 'Cette réponse a bien été modifiée !',

    // Remove entry
    removedEntry: 'Cette entrée a bien été supprimé !',

    // Rename entry
    renamedEntry: 'Cette question a bien été changée !',
    invalidNewName: "Cette nouvelle question n'est pas valide.",
  },
} as const;

export const purge = {
  descriptions: {
    name: 'purge',
    command: 'Supprimer des messages en masse, avec diverses options de filtre.',
    options: {
      amount: 'Nombre de messages à supprimer.',
      fromUser: 'Utilisateur dont les messages doivent être supprimés.',
      includes: 'Supprimer uniquement les messages contenant ceci.',
      withFiles: 'Supprimer uniquement les messages contenant des fichiers.',
      withLinks: 'Supprimer uniquement les messages contenant des liens.',
      withInvites: "Supprimer uniquement les messages contenant des liens d'invitations Discord.",
      fromMe: 'Supprimer uniquement les messages envoyés par moi.',
      fromBot: 'Supprimer uniquement les messages envoyés par un bot.',
      fromHuman: 'Supprimer uniquement les messages envoyés par un humain.',
    },
  },
  messages: {
    noMatchFound: "Aucun message correspondant à ces critères n'a été trouvé.",
    singularSuccess: 'Un message a bien été supprimé !',
    pluralSuccess: '{total} messages ont bien été supprimés !',
    errors: {
      [RESTJSONErrorCodes.OneOfTheMessagesProvidedWasTooOldForBulkDelete]: 'Impossible de supprimer des messages plus vieux de 14 jours.',
    },
  },
} as const;

export const reactionRole = {
  descriptions: {
    name: 'reaction-role',
    command: "Créer des menus de réactions, grâce auxquels les utilisateurs peuvent s'ajouter des rôles.",
    subcommands: {
      create: 'Créer un menu de réaction.',
      list: 'Affiche la liste des menus de réaction actifs.',
      edit: 'Modifier un menu de réaction.',
      remove: 'Supprimer un menu de réaction.',
      addPair: 'Ajouter une paire de réaction/rôle à un menu existant.',
      removePair: "Supprimer une paire de réaction/rôle d'un menu existant.",
      unique: "Choisir si l'on peut prendre qu'un rôle par utilisateur.",
      roleCondition: 'Choisir le rôle pré-requis pour utiliser le menu.',
      image: "Choisir l'image du menu",
    },
    options: {
      messageUrl: 'URL du menu de réaction.',
      channel: 'Salon où envoyer le menu.',
      unique: "Si l'on peut prendre qu'un rôle par utilisateur.",
      removeMessage: 'Supprimer le message du menu également.',
      roleCondition: 'Rôle pré-requis pour utiliser le menu.',
      emoji: 'Émoji de la réaction.',
      role: 'Rôle à donner.',
      choice: 'Choix à donner.',
      imageLink: "Lien de l'image du menu.",
    },
  },
  messages: {
    // Global
    notAMenu: "Ce message n'est pas un menu de réaction.",
    invalidReaction: "Cette réaction n'est pas valide.",
    noRoleProvided: 'Il faut choisir quel rôle utiliser !',
    noLinkProvided: 'Il faut définir un lien !',

    modals: {
      titleLabel: 'Titre du menu',
      titlePlaceholder: 'Titre du menu...',
      descriptionLabel: 'Description du menu',
      descriptionPlaceholder: 'Description du menu...',
      createTitle: 'Créer un menu de réaction',
    },

    // Create menu
    invalidEntries: "Aucune paire réaction/rôle valide n'a été retrouvée dans ton message... :confused:",
    createdMenu: 'Le menu de réaction **{title}** a bien été créé !',

    // List menus
    noMenus: "Je n'ai trouvé aucun menu de réaction dans la base de données !",
    listTitle: 'Liste des menus de réaction ({total})',
    listFieldDescription: stripIndent`
      [Lien vers le message]({url})
      Nombre de paires role-réactions : {total}
      Mode unique : {unique}
      Condition de rôle : {condition}
    `,

    // Remove menu
    removedMenu: 'Ce menu a bien été supprimé !',

    // Edit menu
    editedMenu: 'Ce menu a bien été modifié !',

    // Add a role to a menu
    reactionAlreadyUsed: 'Cette réaction est déjà utilisée dans ce menu !',
    roleAlreadyUsed: 'Ce rôle est déjà utilisé dans ce menu !',
    addedPairSuccessfully: `C'est fait ! La réaction {reaction} donnera le rôle "{role.name}" sur le menu ${hideLinkEmbed('{rrMessage.url}')}.`,

    // Remove a role from a menu
    roleNotUsed: "Ce rôle n'est pas dans ce menu !",
    removedPairSuccessfully: `C'est fait ! Cette paire à bien été supprimée du menu ${hideLinkEmbed('{rrMessage.url}')}.`,

    // Unique role mode
    uniqueMode: 'Sur ce menu, le mode "Rôle unique" est : {uniqueMode}.',
    changedUniqueMode: 'Tu as changé le mode "Rôle unique", qui est maintenant {uniqueMode}.',
    uniqueEnabled: ':white_check_mark: Activé',
    uniqueDisabled: ':x: Désactivé',

    // Role condition
    changedRoleCondition: 'Tu as changé la condition de rôle pour ce menu, au rôle {role}',
    removedRoleCondition: 'Tu as supprimé la condition de rôle pour ce menu.',
    roleCondition: 'La condition de rôle pour ce menu est : {role}.',
    noRoleCondition: "Il n'y a pas de condition de rôle pour ce menu.",

    // Image
    changedImage: "Tu as définit l'image pour ce menu à {link}",
    removedImage: "Tu as supprimé l'image pour ce menu.",
  },
} as const;

export const roleIntersection = {
  descriptions: {
    name: 'role-intersection',
    command: 'Créé un rôle qui est ajouté aux membres ayant tous les rôles données.',
    options: {
      persistent: 'Garder le rôle après son utilisation.',
      role: "Rôle avec lequel effectuer l'intersection",
    },
  },
  messages: {
    noTargetedUsers: "Personne n'a ces {num} rôles à la fois dans ce serveur, il n'a donc pas été créé.",
    successTemporary: 'Le rôle **{newRole.name}** à bien été créé, et il a été ajouté à {targetedMembers.size} membre(s). Il sera supprimé 2 jours après sa première utilisation.',
    successPersistent: 'Le rôle **{newRole.name}** à bien été créé, et il a été ajouté à {targetedMembers.size} membre(s).',
  },
} as const;

export const setup = {
  descriptions: {
    name: 'setup',
    command: 'Définir les salons et rôles particuliers pour la guilde.',
    subcommands: {
      setChannel: 'Définir un salon.',
      setRole: 'Définir un rôle.',
      list: 'Afficher la liste des salons et rôles définis pour la guilde.',
      remove: 'Supprimer un salon ou rôle défini.',
      see: 'Afficher un salon ou rôle défini.',
    },
    options: {
      name: 'Nom du champ.',
      channel: 'Salon à utiliser.',
      role: 'Rôle à utiliser.',
    },
  },
  messages: {
    successfullyDefined: 'Entrée définie avec succès !',
    successfullyUndefined: 'Entrée déréférencé avec succès !',
    chooseOne: 'Choisissez une seule option à inspecter.',
    associatedKeys: 'Les clés associées à cette valeur sont : `{keys}`.',
    noAssociatedKey: "Cette valeur-là n'a pas de clé associée.",
    associatedValue: 'La valeur associée est : {value}.',
    noAssociatedValue: "Cette clé n'a aucune valeur associée",
    listTitle: 'Liste des valeurs',
    lineWithValue: '**{name}** : {value}',
    lineWithoutValue: '**{name}** : Aucune valeur associée',
  },
} as const;

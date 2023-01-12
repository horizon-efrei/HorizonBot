import { hideLinkEmbed, userMention } from '@discordjs/builders';
import { stripIndent } from 'common-tags';
import { LogStatuses } from '@/types/database';

export const dump = {
  descriptions: {
    name: 'dump',
    command: 'Consulter le liste des membres du serveur actuel qui répond (ou non) à certains critères.',
    options: {
      format: 'Formate les membres en fonction du template donné.',
      hasAllRoles: 'Affiche les membres qui ont tous les rôles indiqués.',
      hasRoles: 'Affiche les membres qui ont au moins un des rôles indiqués.',
      reacted: 'Affiche les membres qui ont réagi à un message.',
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
    summary: 'Liste des heures de cours données par les eProfs durant le semestre actuel (depuis le {firstDay}) :',
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

export const manageTags = {
  descriptions: {
    name: 'manage-tags',
    command: 'Gérer les "tags" (messages dynamiques, entièrement configurable directement via discord).',
    subcommands: {
      create: 'Créer un nouveau tag.',
      edit: 'Modifier un tag.',
      remove: 'Supprimer un tag.',
      rename: 'Renommer un tag.',
      inEmbed: "Choisir si le tag s'affiche dans un embed ou non.",
    },
    options: {
      name: 'Nom du tag.',
      inEmbed: "Si le tag s'affiche dans un embed ou non.",
      newName: 'Nouveau nom du tag.',
    },
  },
  messages: {
    // Global
    invalidTag: "Ce nom de tag n'est pas valide.",
    modals: {
      contentLabel: 'Contenu du tag',
      contentPlaceholder: 'Entrez le contenu du tag ici.',
      createTitle: 'Créer un tag',
      editTitle: 'Modifier le tag {name}',
    },

    // Create tag
    createdTag: 'Ce tag a bien été créé !',

    // Edit tag
    editedTag: 'Ce tag a bien été modifié !',

    // Remove tag
    removedTag: 'Ce tag a bien été supprimé !',

    // Rename tag
    renamedTag: 'Ce tag a bien été renommé !',
    invalidNewName: "Ce nouveau nom de tag n'est pas valide.",

    // Set in an embed (or not)
    editedTagEmbed: 'Ce tag sera maintenant affiché {inOrWithout} embed !',
    inEmbed: 'dans un',
    withoutEmbed: 'sans',
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
    },
    options: {
      messageUrl: 'URL du menu de réaction.',
      channel: 'Salon où envoyer le menu.',
      unique: "Si l'on peut prendre qu'un rôle par utilisateur.",
      roleCondition: 'Rôle pré-requis pour utiliser le menu.',
      emoji: 'Émoji de la réaction.',
      role: 'Rôle à donner.',
      choice: 'Choix à donner.',
    },
  },
  messages: {
    // Global
    notAMenu: "Ce message n'est pas un menu de réaction.",
    invalidReaction: "Cette réaction n'est pas valide.",
    noRoleProvided: 'Il faut choisir quel rôle utiliser !',

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

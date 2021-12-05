import { stripIndent, stripIndents } from 'common-tags';
import { LogStatuses } from '@/types/database';

export const contact = {
  options: {
    aliases: ['contact', 'contacts'],
    description: 'contact',
    enabled: true,
    usage: 'contact',
    examples: ['contact'],
  },
  messages: {
    // Global
    invalidContact: 'Impossible de trouver le contact demandé.',

    // Create a contact
    createdContact: 'Ce contact a bien été créé !',
    createContactSetup: {
      embed: {
        title: "Création d'un contact",
        description: "Bienvenue dans l'assistant de création de contacts ! Suis les étapes ci-dessous en sélectionnant l'option dans le menu déroulant qui s'affiche, ou en envoyant un message comme il te sera demandé. Tu peux, à tout moment, abandonner la création du contact en cliquant sur \"Abandonner\".",
        stepPreviewTitle: 'Aperçu des étapes',
        currentStepTitle: 'Étape actuelle : {step}',
        currentStepDescription: [
          'Envoie un message contenant le nom de la personne.',
          'Envoie un message contenant le moyen de contact de la personne (probablement son e-mail).',
          'Choisis dans le menu déroulant OU envoie un message contenant le nom du service associé à la personne.',
          'Envoie un message contenant une description de la personne (son rôle par exemple).',
          'Terminé !',
        ],
      },
      promptMessageDropdown: 'Choisis une option dans le menu déroulant ci-dessus :arrow_heading_up: ',
      promptMessageDropdownOrSendMessage: 'Choisis une option dans le menu déroulant ci-dessus :arrow_heading_up: ou envoie un message',
      stepPreview: stripIndent`
        **1.** __Nom :__ {name}
        **2.** __Contact :__ {contact}
        **3.** __Service :__ {team}
        **4.** __Description :__ {description}
      `,
      teamMenu: {
        placeholder: 'Aucune équipe sélectionnée',
      },
      abortMenu: {
        label: 'Abandonner',
      },
      error: 'Oups, une erreur est survenue lors de cette action :confused:\n> {details}',
    },

    // List the contacts
    noContacts: "Je n'ai trouvé aucun contacts dans la base de données !",
    listLine: '**__{contact}__**\n*{description}*',
    pageTitle: 'Contact {teamName}',
    selectMenuItemDescription: 'Page {pageIndex}',
    selectMenuItemEmoji: '🏷',

    // Edit contact
    invalidField: 'Le champs à modifier doit-être "nom", "contact", "service" ou "description"',
    editedContact: 'Le contact a bien été modifié !',

    // Remove contact
    removedContact: 'Le contact a bien été supprimé !',

    // Help page
    helpEmbedTitle: 'Aide des Contacts',
    helpEmbedDescription: [
      { name: 'Créer un contact', value: '`contact create`' },
      { name: 'Liste des contacts', value: '`contact list`' },
      { name: 'Modifier un contact', value: "`contact edit <nom> <'nom' | 'contact' | 'service' | 'description'> <nouveau nom/contact/service/description>`" },
      { name: 'Supprimer un contact', value: '`contact remove <nom>`' },
      { name: "Page d'aide", value: '`contact help`' },
    ],

    // Prompts
    prompts: {
      name: {
        base: 'Entre le nom de la personne :',
        invalid: 'Ce nom est invalide.',
      },
      contact: {
        base: 'Entre le moyen de contact de la personne, probablement son e-mail :',
        invalid: 'Ce moyen de contact est invalide.',
      },
      team: {
        base: 'Entre le nom du service associé à la personne :',
        invalid: 'Ce service est invalide.',
      },
      description: {
        base: 'Entre une description de la personne, son rôle par exemple.',
        invalid: 'Cette description est invalide.',
      },

      stoppedPrompting: "Tu as bien abandonné la commande ! Aucun contact n'a été créé.",
      promptTimeout: "La durée maximale a été dépassée, la commande a été abandonnée et aucun contact n'a été créé.",
    },
  },
};

export const evaluate = {
  options: {
    aliases: ['eval', 'evaluate', 'ev'],
    description: "Permet d'éxécuter du code directement dans le bot, avec le contexte actuel.\nUtilise l'option `--depth=<number>` pour controler la profondeur des propriétés affichés.\nUtilise le drapeau `--async` pour imbriquer ton code dans une IIFE async. Cela veut dire qu'il faut retourner ton résultat pour qu'il soit affiché.\n\nUtilise le drapeau `--showHidden` pour afficher les propriétés cachées\nUtilise le drapeau `--json` pour afficher le résultat comme si c'était du JSON.",
    enabled: true,
    usage: 'eval',
    examples: ['limits'],
  },
  messages: {
    noCode: "Tu as oublié d'ajouter du code à exécuter !",
    evalTimeout: "Le code a pris plus de 1min pour s'éxecuter...",
    output: '**Résultat**\n{output}\n**Type**\n{type}\n:stopwatch: {time}',
  },
};

export const limits = {
  options: {
    aliases: ['limit', 'limits', 'limite', 'limites'],
    description: 'Permet de consulter le nombre de salons et de rôles actuel, par rapport aux limites imposées par Discord ; à savoir 500 salons maximum et 250 rôles maximum.',
    enabled: true,
    usage: 'limits',
    examples: ['limits'],
  },
  messages: {
    limits: 'Salons : {channels}/500 (reste {channelsLeft})\nRôles : {roles}/250 (reste {rolesLeft})',
  },
};

export const logs = {
  options: {
    aliases: ['logs', 'log', 'logging', 'logger'],
    description: 'Permet de gérer comment les logs sont traités.',
    enabled: true,
    usage: 'logs',
    examples: ['logs', 'logs change-nickname', 'logs change-nickname 2'],
  },
  messages: {
    updatedLog: 'Le statut du log **{type}** a bien été changé en **{status}** !',
    updatedAllLog: 'Le statut de **tous les logs** de ce serveur a bien été changé en **{status}** !',
    listTitle: 'Liste des statuts des logs',
    lineValue: '**{type}** : {status}',
    possibilitiesTitle: 'Liste des valeurs possibles',
    possibilitiesContent: 'Pour les logs : {logs}\nPour les statuts : {statuses}',
    currentLogStatus: 'Le statut actuel du log **{type}** est : **{status}**`',
    statuses: {
      [LogStatuses.Disabled]: ':no_entry_sign: désactivé',
      [LogStatuses.Silent]: ':no_bell: silencieux',
      [LogStatuses.Console]: ':thought_balloon: console uniquement',
      [LogStatuses.Discord]: ':white_check_mark: Discord & console',
    },
  },
};

export const pingRoleIntersection = {
  options: {
    aliases: ['ping-role-intersection', 'intersects', 'intersect', 'inter'],
    description: "Permet de créer un rôle temporaire qui est l'intersection de tous les rôles entrés. Il sera donc ajouté à tous les membres ayant *tous les rôles donnés à la fois*, et sera supprimé automatiquement 2 jours après son utilisation, sauf si tu utilises le drapeau `--keep`.",
    enabled: true,
    usage: 'intersect <@mention role | ID role | nom role (entre guillement si plusieurs mots)>',
    examples: ['inter @Role 1 @Role 2 188341077902753794 "Role 4" Role5'],
  },
  messages: {
    roleDoesntExist: "Es-tu sûr que ce rôle existe ? Je n'ai pas pu le trouver...",
    notEnoughRoles: "Tu n'as pas entré assez de rôles ! Il en faut au moins 2.",
    noTargetedUsers: "Personne n'a ces {num} rôles à la fois dans ce serveur, il n'a donc pas été créé.",
    successTemporary: 'Le rôle **{newRole.name}** à bien été créé, et il a été ajouté à {targetedMembers.size} membre(s). Il sera supprimé 2 jours après sa première utilisation.',
    successPersistent: 'Le rôle **{newRole.name}** à bien été créé, et il a été ajouté à {targetedMembers.size} membre(s).',
  },
};

export const reactionRole = {
  options: {
    aliases: ['reactionrole', 'rr', 'autorole', 'ar'],
    description: "Permet de créer des menus de réactions, grâce auxquels les utilisateurs peuvent utiliser les réactions pour s'ajouter des rôles. Tu peux ajouter le flag `--unique` lors de la création du menu, qui permet de définir si on ne peut récupérer qu'un seul rôle à la fois. Tu peux changer ce mode plus tard avec `!rr unique`. Tu peux également choisir une condition de rôle préalable pour pouvoir réagir, avec `!rr condition`.",
    enabled: true,
    usage: 'reactionrole <create | list | remove | edit | add-pair | remove-pair | unique | condition | help>',
    examples: ['reactionrole create', 'rr create #salon-annonces', 'autorole list', 'ar remove 188341077902753794', 'rr help'],
  },
  messages: {
    // Global
    notAMenu: "Ce message n'est pas un menu de réaction.",
    rrMessagePrompt: "Entre l'identifiant (ID) ou le lien du message qui contient le menu que souhaité.",
    invalidReaction: "Cette réaction n'est pas valide.",
    invalidRole: "Ce rôle n'est pas valide.",

    // Create the menu
    channelPrompt: 'Dans quel salon veux-tu créer ce menu ? Tu peux entrer son nom, son ID, ou le mentionner.',
    titlePrompt: 'Entre le titre du menu sur la première ligne, puis la description sur les suivantes.',
    rolesPrompt: "Entre les émojis et les rôles associés. Chaque paire doit être sur une ligne à part, le tout dans un seul message. Tu dois entrer l'émoji, un espace puis le rôle (son nom, son ID, ou en le mentionnant). Seuls les 20 premières entrées seront utilisées.",

    duplicatedEmojis: "Oups, tu as mis plusieurs fois le même émoji pour différents rôles... Ce n'est pas possible ! Recréé un menu en mettant un emoji unique pour chaque rôle. (Émojis utilisés en double : {duplicatedEmojis})",
    duplicatedRoles: "Oups, tu as mis plusieurs fois le même rôle... Ce n'est pas possible ! Recréé un menu en mettant chaque rôle une unique fois. (Rôles utilisés en double : {duplicatedRoles})",
    invalidEntries: "Aucune paire réaction/rôle valide n'a été retrouvée dans ton message... :confused:",

    confirmationTitle: "Parfait, la mise en place est terminée ! Peux-tu confirmer que c'est correct ?",
    confirmationContent: stripIndents`
      Je vais créer un menu de réaction(s), dans le salon {channel}.
      {rolesList}

      Le titre est "{title}", et la description est
      >>> {description}
    `,
    rolesListItem: '• La réaction {reaction} donnera la rôle {role}.',
    noDescription: '*Aucune description définie.*',
    stoppedPrompting: 'Tu as bien abandonné la création du menu !',

    // List the menus
    noMenus: "Je n'ai trouvé aucun menu de réaction dans la base de données !",
    listTitle: 'Liste des menus de réaction ({total})',
    listFieldDescription: stripIndent`
      [Lien vers le message]({url})
      Nombre de paires role-réactions : {total}
      Mode unique : {unique}
      Condition de rôle : {condition}
    `,

    // Remove a menu
    removedMenu: 'Ce menu a bien été supprimé !',

    // Edit a menu
    editedMenu: 'Ce menu a bien été modifié !',

    // Add a role to a menu
    reactionAlreadyUsed: 'Cette réaction est déjà utilisée dans ce menu !',
    roleAlreadyUsed: 'Ce rôle est déjà utilisé dans ce menu !',
    addedPairSuccessfuly: "C'est fait ! La réaction {reaction} donnera le rôle \"{role.name}\" sur le menu <{rrMessage.url}>.",

    // Remove a role from a menu
    reactionNotUsed: "Cette réaction n'est pas dans ce menu !",
    roleNotUsed: "Ce rôle n'est pas dans ce menu !",
    removedPairSuccessfuly: "C'est fait ! Cette paire à bien été supprimée du menu <{rrMessage.url}>.",

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

    // Help page
    helpEmbedTitle: 'Aide des menus de réaction',
    helpEmbedDescription: [
      { name: 'Créer un menu', value: '`!rr start [salon]` puis répondre aux questions' },
      { name: 'Liste des menus', value: '`!rr list`' },
      { name: 'Supprimer un menu', value: '`!rr remove <ID message>`' },
      { name: 'Modifier un menu', value: '`!rr edit <ID message>` puis répondre aux questions' },
      { name: 'Ajouter une paire à un menu', value: '`!rr addpair <ID message> <emoji> <rôle>`' },
      { name: "Enlever une paire d'un menu", value: '`!rr removepair <ID message> <rôle>`' },
      { name: 'Gérer le mode "Rôle unique"', value: '`!rr unique <ID message> [booléen]`' },
      { name: 'Gérer la condition de rôle', value: '`!rr condition <ID message> [rôle | "clear"]`' },
      { name: "Page d'aide", value: '`!rr help`' },
    ],
  },
};

export const setup = {
  options: {
    aliases: ['setup', 'config', 'configure', 'define'],
    description: 'Permet de définir les salons et rôles particuliers dont le bot à besoin.',
    enabled: true,
    usage: 'setup <create | see | list | remove | help>',
    examples: ['setup add cours-semaine #cours-de-la-semaine', 'setup new role-staff 188341077902753794', 'setup remove role-staff', 'setup see @Staff'],
  },
  messages: {
    successfullyDefined: 'Entrée définie avec succès !',
    successfullyUndefined: 'Entrée déréférencé avec succès !',
    invalidRole: 'Ce rôle est invalide.',
    unknown: 'Entrée inconnue. Voici la liste des entrées possibles : {list}',
    associatedKeys: 'Les clés associées à cette valeur sont : `{keys}`.',
    noAssociatedKey: "Ce valeur-là n'a pas de clé associé.",
    associatedValue: 'Le valeur associée est : {value}.',
    noAssociatedValue: "Cette clé n'a aucune valeur associé",
    possibilitiesTitle: 'Liste des entrées possibles',
    listTitle: 'Liste des valeurs',
    lineWithValue: '**{name}** : {value}',
    lineWithoutValue: '**{name}** : Aucune valeur associée',
    helpEmbedTitle: 'Aide de la commande de setup',
    helpEmbedDescription: [
      { name: 'Définir une valeur', value: '`!setup set <keyword> [(salon | role)=salon actuel]`' },
      { name: 'Déréférencer une valeur', value: '`!setup remove <keyword>`' },
      { name: 'Informations sur un salon ou rôle', value: '`!setup info [(keyword | salon | role)=salon actuel]`' },
      { name: 'Liste des valeurs', value: '`!setup list`' },
      { name: "Page d'aide", value: '`!setup help`' },
    ],
  },
};

export const tags = {
  options: {
    aliases: ['tags', 'tag'],
    description: 'Permet de créer des tags (= messages dynamiques, entièrement configurable directement via discord). Lors de leur création, tu peux choisir si un tag devra être affiché dans un embed. Tu peux changer ce paramètre après, avec `!tag embed <nom> <booléen>',
    enabled: true,
    usage: 'tags <create | list | remove | edit | rename | alias | help>',
    examples: ['tags create --embed test Ceci est le contenu !', 'tags list', 'tags remove test', 'tags help'],
  },
  messages: {
    // Global
    invalidTag: "Ce nom de tag n'est pas valide.",
    invalidAliases: "Un de ces aliases n'est pas valide ou est déjà utilisé.",
    stoppedPrompting: 'Tu as bien abandonné la création de ce tag !',

    // Create a tag
    createdTag: 'Ce tag a bien été créé !',

    // List the tags
    noTags: "Je n'ai trouvé aucun tag dans la base de données !",
    listTitle: 'Liste des tags ({total})',
    listLine: '• `{name}` ({aliases}) : {uses} utilisations',

    // Remove a tag
    removedTag: 'Ce tag a bien été supprimé !',

    // Edit a tag
    editedTag: 'Ce tag a bien été modifié !',

    // Set in an embed (or not)
    showTagEmbed: 'Ce tag est affiché {inOrWithout} embed.',
    editedTagEmbed: 'Ce tag sera maintenant affiché {inOrWithout} embed !',
    inEmbed: 'dans un',
    withoutEmbed: 'sans',

    // Help page
    helpEmbedTitle: 'Aide des Tags',
    helpEmbedDescription: [
      { name: 'Créer un tag', value: '`tags create [--embed] <nom> <contenu>`' },
      { name: 'Liste des tags', value: '`tags list`' },
      { name: 'Supprimer un tag', value: '`tags remove <nom>`' },
      { name: 'Modifier un tag', value: '`tags edit <nom> <contenu>`' },
      { name: 'Renommer un tag', value: '`tags rename <nom> <nouveau nom>`' },
      { name: "Définir les aliases d'un tag", value: '`tags aliases <nom> <aliases1, aliases2, ... | clear>`' },
      { name: "Mode d'affichage du tag", value: '`tags embed <nom> <booléen>`' },
      { name: "Page d'aide", value: '`tags help`' },
    ],

    prompts: {
      name: {
        base: 'Entre le nom du tag :',
        invalid: 'Ce nom de tag est déjà utilisé ou est invalide.',
      },
      newName: {
        base: 'Entre le nouveau nom du tag :',
        invalid: 'Ce nom de tag est déjà utilisé ou est invalide.',
      },
      aliases: {
        base: 'Entre les aliases du tag :',
        invalid: 'Ces aliases de tags sont déjà utilisés ou sont invalides.',
      },
      content: {
        base: 'Entre le contenu du tag :',
        invalid: 'Ce contenu est invalide.',
      },
    },
  },
};

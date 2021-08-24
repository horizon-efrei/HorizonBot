import { stripIndents } from 'common-tags';

export const pingRoleIntersection = {
  options: {
    aliases: ['intersects', 'intersect', 'inter'],
    description: "Permet de créer un rôle temporaire qui est l'intersection de tous les rôles entrés. Il sera donc ajouté à tous les membres ayant *tous les rôles donnés à la fois*, et sera supprimé automatiquement 2 jours après son utilisation, sauf si vous utilisez le drapeau `--keep`.",
    enabled: true,
    usage: 'intersect <@mention role | ID role | nom role (entre guillement si plusieurs mots)>',
    examples: ['inter @Role 1 @Role 2 188341077902753794 "Role 4" Role5'],
  },
  messages: {
    roleDoesntExist: "Es-tu sûr que le rôle \"{role}\" existe ? Je n'ai pas pu le trouver...",
    notEnoughRoles: "Tu n'as pas entré assez de rôles ! Il en faut au moins 2.",
    noTargetedUsers: "Personne n'a ces {num} rôles à la fois dans ce serveur, il n'a donc pas été créé.",
    successTemporary: 'Le rôle **{newRole.name}** à bien été créé, et il a été ajouté à {targetedMembers.size} membre(s). Il sera supprimé juste après sa première utilisation.',
    successPersistent: 'Le rôle **{newRole.name}** à bien été créé, et il a été ajouté à {targetedMembers.size} membre(s).',
  },
};

export const setup = {
  options: {
    aliases: ['setup', 'config', 'configure', 'define'],
    description: 'Permet de définir les salons particuliers que MonkaBot peut utiliser pour envoyer des messages.',
    enabled: true,
    usage: 'setup [salon]',
    examples: ['setup mod'],
  },
  messages: {
    successfullyDefined: 'Salon définit avec succès !',
    successfullyUndefined: 'Salon déréférencé avec succès !',
    unknown: 'Salon inconnu.',
    associatedKeys: 'Les clés associées à ce salon sont : `{keys}`.',
    noAssociatedKey: "Ce salon-là n'a pas de clé associé.",
    associatedValue: 'Le salon associé est : <#{value}>.',
    noAssociatedValue: "Cette clé n'a aucun salon associé",
    listTitle: 'Liste des salons',
    lineWithValue: '**{name}** : <#{value}>',
    lineWithoutValue: '**{name}** : Aucune valeur associée',
    helpEmbedTitle: 'Aide de la commande de setup',
    helpEmbedDescription: [
      { name: 'Définir un salon', value: '`!setup set <keyword> [salon=salon actuel]`' },
      { name: 'Déréférencer un salon', value: '`!setup remove <keyword>`' },
      { name: 'Informations sur un salon', value: '`!setup info [(keyword | salon)=salon actuel]`' },
      { name: 'Liste des salons', value: '`!setup list`' },
      { name: "Page d'aide", value: '`!setup help`' },
    ],
  },
};

export const reactionRole = {
  options: {
    aliases: ['reactionrole', 'rr', 'autorole', 'ar'],
    description: "Permet de créer des menus de réaction, sur lesquels les utilisateurs peuvent utiliser des réactions pour s'ajouter des rôles.",
    enabled: true,
    usage: 'reactionrole <start | list | remove | help>',
    examples: ['reactionrole start', 'rr start #salon-annonces', 'autorole list', 'ar remove 188341077902753794', 'rr help'],
  },
  messages: {
    // Global
    notAMessage: "Cet identifiant de message n'est pas valide. Il faut entrer le lien vers le message, ou son ID.",
    notAMenu: "Ce message n'est pas un menu de réaction.",
    invalidReaction: "Cette réaction n'est pas valide",
    invalidRole: "Ce rôle n'est pas valide",

    // Create the menu
    channelPrompt: 'Dans quel salon veux-tu créer ce menu ? Tu peux entrer son nom, son ID, ou le mentionner.',
    titlePrompt: 'Entre le titre du menu sur la première ligne, puis la description sur les suivantes.',
    rolesPrompt: "Entre les émojis et les rôles associés. Chaque paire doit être sur une ligne à part, le tout dans un seul message. Tu dois entrer l'émoji, un espace puis le rôle (son nom, son ID, ou en le mentionnant). Seuls les 20 premières entrées seront utilisées.",

    duplicatedEmojis: "Oups, tu as mis plusieurs fois le même émoji pour différents rôles... Ce n'est pas possible ! Recréé un menu en mettant un emoji unique pour chaque rôle. (Émojis utilisés en double : {duplicatedEmojis})",
    duplicatedRoles: "Oups, tu as mis plusieurs fois le même rôle... Ce n'est pas possible ! Recréé un menu en mettant un chaque rôle une unique fois. (Rôles utilisés en double : {duplicatedRoles})",
    invalidEntries: "Aucune paire réaction/rôle valide n'a été retrouvée dans ton message... :confused:",

    confirmationTitle: "Parfait, la mise en place est terminée ! Peux-tu confirmer que c'est correct ?",
    confirmationContent: stripIndents`
      Je vais créer un menu de réaction(s), dans le salon {channel}.
      {rolesList}

      Le titre est "{title}", et la description est
      >>> {description}
    `,
    rolesListItem: '• La réaction {reaction} donnera la rôle {role}',
    noDescription: '*Aucune description définie.*',
    stoppedPrompting: 'Tu as bien abandonné la création du menu !',

    // List the menus
    noMenus: "Je n'ai trouvé aucun menu de réaction dans la base de données !",
    listEmbedTitle: 'Liste des menus de réaction de la guilde "{message.guild.name}" ({total})',
    listEmbedDescription: '• [{title}]({url}) ({total} roles)\n',

    // Remove a menu
    removedMenu: 'Ce menu a bien été supprimé !',
    removePrompt: "Entre l'identifiant (ID) du message qui contient le menu que tu souhaites supprimer.",

    // Edit a menu
    editedMenu: 'Ce menu a bien été modifié !',

    // Add a role to a menu
    reactionAlreadyUsed: 'Cette réaction est déjà utilisée dans ce menu !',
    roleAlreadyUsed: 'Ce rôle est déjà utilisé dans ce menu !',
    addedPairSuccessfuly: "C'est fait ! La réaction {reaction} donnera le rôle \"{role.name}\" sur le menu {rrMessage.url}",

    // Remove a role from a menu
    reactionNotUsed: "Cette réaction n'est pas dans ce menu !",
    roleNotUsed: "Ce rôle n'est pas dans ce menu !",
    removedPairSuccessfuly: "C'est fait ! Cette paire à bien été supprimée du menu {rrMessage.url}",

    // Help page
    helpEmbedTitle: 'Aide des menus de réaction-rôle',
    helpEmbedDescription: [
      { name: 'Créer un menu', value: '`rr start [identifiant du salon]` puis répondre aux questions' },
      { name: 'Lister les menus', value: '`rr list`' },
      { name: 'Supprimer un menu', value: '`rr remove <identifiant du message>`' },
      { name: 'Modifier un menu', value: '`rr edit <identifiant du message>` puis répondre aux questions' },
      { name: 'Ajouter une paire à un menu', value: '`rr addpair <identifiant du message> <emoji> <role>`' },
      { name: "Enlever une paire d'un menu", value: '`rr removepair <identifiant du message> <role>`' },
      { name: "Page d'aide", value: '`rr help`' },
    ],
  },
};

export const tags = {
  options: {
    aliases: ['tags', 'tag'],
    description: 'Permet de créer des tags (= messages dynamiques, entièrement configurable directement via discord).',
    enabled: true,
    usage: 'tags <create | list | remove | edit | rename | alias | help>',
    examples: ['tags create test Ceci est le contenu !', 'tags list', 'tags remove test', 'tags help'],
  },
  messages: {
    // Global
    invalidTag: "Ce nom de tag n'est pas valide.",
    invalidAliases: "Un de ces aliases n'est pas valide ou est déjà utilisé.",
    stoppedPrompting: 'Tu as bien abandonné la création du menu !',

    // Create a tag
    createdTag: 'Ce tag a bien été créé !',

    // List the tags
    noTags: "Je n'ai trouvé aucun tags dans la base de données !",
    listEmbedTitle: 'Liste des tags de la guilde "{message.guild.name}" ({total})',
    listEmbedItem: '• `{name}` ({aliases})',

    // Remove a tag
    removedTag: 'Ce tag a bien été supprimé !',

    // Edit a tag
    editedTag: 'Ce tag a bien été modifié !',

    // Help page
    helpEmbedTitle: 'Aide des menus de Tags',
    helpEmbedDescription: [
      { name: 'Créer un tag', value: '`tags create <nom> <aliases> <contenu>`' },
      { name: 'Lister les tags', value: '`tags list`' },
      { name: 'Supprimer un tag', value: '`tags remove <nom>`' },
      { name: 'Modifier un tag', value: '`tags edit <nom> <contenu>`' },
      { name: 'Renommer un tag', value: '`tags rename <nom> <nouveau nom>`' },
      { name: 'Définir les aliases un tag', value: '`tags aliases <nom> <aliases1, aliases2, ... | clear>`' },
      { name: "Page d'aide", value: '`tags help`' },
    ],

    prompts: {
      name: {
        base: 'Entrez le nom du tag :',
        invalid: 'Ce nom de tag est déjà utilisé ou est invalide.',
      },
      newName: {
        base: 'Entrez le nouveau nom du tag :',
        invalid: 'Ce nom de tag est déjà utilisé ou est invalide.',
      },
      aliases: {
        base: 'Entrez les aliases du tag :',
        invalid: 'Ces aliases de tags sont déjà utilisés ou sont invalides.',
      },
      content: {
        base: 'Entrez le contenu du tag :',
        invalid: 'Ce contenu est invalide.',
      },
    },
  },
};

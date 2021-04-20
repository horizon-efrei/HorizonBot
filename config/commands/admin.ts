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
    unknown: 'Salon inconnu.',
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
    notAMenu: "Ce message n'est pas un menu de réaction.",
    removedMenu: 'Ce menu a bien été supprimé !',
    removePrompt: "Entre l'identifiant (ID) du message qui contient le menu que tu souhaites supprimer.",

    // Help page
    helpEmbedTitle: 'Aide des menus de réaction-rôle',
    helpEmbedDescription: [
      { name: 'Créer un menu', value: '`rr start [identifiant du salon]`' },
      { name: 'Lister les menus', value: '`rr list`' },
      { name: 'Supprimer un menu', value: '`rr remove <identifiant du message>`' },
      { name: "Page d'aide", value: '`rr help`' },
    ],
  },
};

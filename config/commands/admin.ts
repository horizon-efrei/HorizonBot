import { stripIndents } from 'common-tags';

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
    description: 'Permet de définir les salons particuliers que MonkaBot peut utiliser pour envoyer des messages.',
    enabled: true,
    usage: 'setup [salon]',
    examples: ['setup mod'],
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

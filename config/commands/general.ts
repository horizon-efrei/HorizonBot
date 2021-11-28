import { stripIndent } from 'common-tags';

export const code = {
  options: {
    aliases: ['code', 'run'],
    description: stripIndent`
      Permet d'exécuter du code directement depuis Discord.
      • Pour certains langages (Java, C, C++...), tu peux ajouter le drapeau \`--wrap\` pour automatiquement ajouter la fonction/classe \`main\` autour de ton code.
      • Tu peux écrire ton code directement après le langage, ou dans un bloc de code Markdown.
      • Pour voir la liste des langages supportés, tape \`code info\`.
      • Si ton programme *demande* des données à l'utilisateur, tu peux en fournir via \`--input=123\` ou \`--input="mes données"\` avec des guillements si ton texte contient plusieurs mots.
      • Je ne peux faire cette commande qu'un nombre limité de fois : elle est cappée à 200 utilisations par jour, en tout. Merci de ne pas en abuser pour que tout le monde puisse en profiter ! :) (ne vous étonnez pas si elle ne répond plus quand vous l'exécutez : vous l'avez surement trop spammée.)
    `,
    enabled: true,
    usage: 'run info | <langage> [--wrap] <code>',
    examples: ['code info', 'run java --wrap System.out.println("Test");', 'run js --input=test console.log(process.argv[0]);'],
  },
  messages: {
    noMoreCredits: 'Cette commande peut malheureusement être utilisée maximum 200 fois par jour, et ce quota a été atteint... Réessaye à partir de 13h !',
    unknownLanguage: 'Le langage que tu as spécifié (`{parameter}`) est invalide. Il se peut que je ne le supporte pas ou que tu ais oublié de le spécifier.',
    noCode: "Tu as oublié d'ajouter du code à exécuter !",
    result: "Résultat de l'éxecution de ce code en {lang.value.display}. (Temps CPU : {cpuTime} / Memoire : {memory})",
    creditStatus: "Crédits restant pour aujourd'hui : {remaining}",
    informationBlock: stripIndent`
      Abbréviations : {formattedSlugs}
      Version : {lang.version}
    `,
  },
};

export const help = {
  options: {
    aliases: ['help', 'aide'],
    description: "Permet de voir la liste des commandes de HorizonBot, ou d'avoir des informations sur une commande en particulier.",
    enabled: true,
    usage: 'help [commande]',
    examples: ['help', 'aide statistique'],
  },
  messages: {
    commandInfo: {
      title: ':star: Commande "{command.name}"',
      description: '❯ Description',
      usage: '❯ Utilisation',
      usableBy: '❯ Utilisable par',
      aliases: '❯ Aliases',
      examples: '❯ Exemples',
    },
    commandsList: {
      title: 'Commandes de HorizonBot ({amount})',
      description: "Faites `{helpCommand}` pour avoir plus d'informations sur une commande en particulier.\nSeulement les commandes que tu peux exécuter s'affichent.",
      category: '❯ {categoryName}',
    },
  },
};

export const latex = {
  options: {
    aliases: ['latex', 'tex', 'math'],
    description: 'Permet de formatter du texte LaTeX proprement.',
    enabled: true,
    usage: 'latex <latex>',
    examples: ['latex \\int_{a}^{b} f(x) dx'],
  },
  messages: {
    noEquationGiven: "Tu as oublié d'ajouter une équation à formatter !",
  },
};

export const mergePDF = {
  options: {
    aliases: ['mergepdf', 'pdf'],
    description: "Permet de combiner plusieurs fichiers PDF à partir de messages Discord, via leur lien ou leur ID. Vous pouvez utiliser l'option `--name=\"nom\"` afin de définir le nom du fichier résultant, qui sera sinon \"merged.pdf\".",
  },
  messages: {
    noPDFGiven: 'Il faut ajouter des PDFs à ton message, ou donner le lien de messages contenant des PDFs !',
    notEnoughFiles: 'Il faut me donner au moins 2 fichiers pour que je puisse les fusionner !',
  },
};

export const ping = {
  options: {
    aliases: ['ping', 'pong', 'ms'],
    description: "Permet de connaître la latence de HorizonBot et de l'API Discord.",
    enabled: true,
    usage: 'ping',
    examples: ['ping'],
  },
  messages: {
    firstMessage: 'Ping !',
    secondMessage: "Pong ! Latence de HorizonBot : {botPing}ms. Latence de l'API : {apiPing}ms.",
  },
};

export const reminders = {
  options: {
    aliases: ['reminders', 'reminder', 'remind', 'remindme', 'rappels', 'rappel'],
    description: 'Permet de créer/modifier et lister des rappels.',
    enabled: true,
    usage: 'reminders <create | list | remove | help>',
    examples: ['reminder create 2h Aller me coucher', 'reminders list', 'tags remove 12we6f', 'reminders help'],
  },
  messages: {
    // Global
    invalidReminder: "Cet ID de rappel n'est pas valide.",
    invalidTime: "Cette durée ou cette date n'est pas valide.",

    // Create a reminder
    createdReminder: "D'accord, je te rappelerai ça ! Ce rappel à l'ID `{reminderId}`.",
    openDm: "\n:warning: Tes messages privés ne sont pas ouverts ou tu m'as bloqué, je ne pourrai donc pas t'envoyer le message de rappel ! Active-les ou débloque-moi pour les recevoir.",

    // List the reminders
    noReminders: "Je n'ai trouvé aucun rappel t'étant associé dans la base de données !",
    listTitle: 'Liste de tes rappels ({total})',
    listLine: '• `{reminderId}` (<t:{timestamp}:R>) : {description}',

    // Remove a reminder
    removedReminder: 'Ce rappel a bien été supprimé !',

    // Help page
    helpEmbedTitle: 'Aide des rappels',
    helpEmbedDescription: [
      { name: 'Créer un rappel', value: '`reminders create <durée | date> [description]`' },
      { name: 'Liste de tes rappels', value: '`reminders list`' },
      { name: 'Supprimer un rappel', value: '`reminders remove <ID>`' },
      { name: "Page d'aide", value: '`reminders help`' },
    ],

    // Prompts
    prompts: {
      id: {
        base: "Entre l'ID du rappel :",
        invalid: 'Cet ID de rappel est invalide.',
      },
    },
  },
};

export const serverInfo = {
  options: {
    aliases: ['server-info', 'serveur-info'],
    description: 'Affiche diverses informations sur la guilde où la commande est exécutée.',
    enabled: true,
    usage: 'serverinfo',
    examples: ['serverinfo'],
  },
  messages: {
    embed: {
      title: 'Informations sur {name}',
      membersTitle: 'Membres',
      membersValue: 'Total : **{memberCount}**\nPropriétaire : <@{ownerId}>',
      channelsTitle: 'Salons',
      channelsValue: 'Total : **{channels.cache.size}**\n:hash: Salons textuels : **{text}**\n:loud_sound: Salons vocaux : **{voice}**\n:pushpin: Catégories : **{categories}**',
      boostsTitle: 'Boosts',
      boostsValue: 'Niveau **{premiumTier}**\n**{premiumSubscriptionCount}**/15 boosts',
      rolesTitle: 'Rôles',
      rolesValue: 'Total : **{roles.cache.size}**',
      createdAtTitle: 'Création',
      createdAtValue: 'Crée le <t:{createdTimestamp}>\n<t:{createdTimestamp}:R>',
      footer: 'ID : {id}',
    },
  },
};

export const statistics = {
  options: {
    aliases: ['statistiques', 'statistique', 'statistics', 'statistic', 'stats', 'stat', 'botinfo'],
    description: 'Affiche des statistiques et diverses informations sur le bot, comme son temps de fonctionnement, sa version etc.',
    enabled: true,
    usage: 'statistiques',
    examples: ['statistiques'],
  },
  messages: {
    embed: {
      title: 'Statistiques de HorizonBot',
      description: 'Le préfixe est `{prefix}`. Faites `{prefix}aide` pour avoir la liste des commandes.',
      version: '❯ Version',
      versionContent: stripIndent`
        Version : {version}
        Commit : {commitLink}
      `,
      uptime: '❯ Temps de fonctionnement',
      memory: '❯ Mémoire',
      maintainers: '❯ Développeurs',
      thanks: '❯ Remerciements',
    },
  },
};

export const vocalCount = {
  options: {
    aliases: ['vocal-count', 'voc-count', 'vocount'],
    description: "Affiche le nombre de personnes connectées dans un salon vocal choisi, ou dans le tien. Si aucun salon vocal n'est spécifié ou que tu passes l'option `--all` (`-a`), la liste des salons vocaux avec leur nombre de connectés s'affichera.",
    enabled: true,
    usage: 'vocalcount [salon] [--all]',
    examples: ['vocalcount', 'vocount Linux', 'voc-count --all'],
  },
  messages: {
    invalidUse: "Tu n'as pas spécifié de salon vocal, et tu n'es dans aucun salon !",
    topLine: '`{index}.` :loud_sound: {name} : {count} membres',
    noOnlineMembers: "Personne n'est connecté dans un salon vocal dans ce serveur.",
    count: 'Il y a {count} personnes connectées dans ce salon vocal !',
  },
};

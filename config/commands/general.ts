import { stripIndent } from 'common-tags';

export const code = {
  options: {
    aliases: ['code', 'run'],
    description: stripIndent`
      Permet d'exécuter du code directement depuis Discord.
      • Pour certains langages (Java, C, C++...), tu peux ajouter le drapeau \`--wrap\` pour automatiquement ajouter la fonction/classe \`main\` autour de ton code.
      • Tu peux écrire ton code directement après le langage, ou dans un bloc de code Markdown.
      • Pour voir la liste des langages supportés, tape \`{prefix}code info\`.
      • Je ne peux pas faire cette commande un nombre illimité de fois : elle est cappée à 200 utilisations par jour, en tout. Merci de ne pas en abuser pour que tout le monde puisse en profiter ! :) (ne vous étonnez pas si elle ne répond plus quand vous l'executez : vous l'avez surement trop spammée.)
    `,
    enabled: true,
    usage: 'run <langage> [--wrap] <code>',
    examples: ['run'],
  },
  messages: {
    noMoreCredits: 'Cette commande peut malheureusement être utilisée maximum 200 fois par jour en tout, et ce quota a été atteint... Réessaye à partir de 13h !',
    unknownLanguage: 'Le langage que tu as spécifié (`{parameter}`) est invalide. Il se peut que je ne le supporte pas ou que tu ais oublié de le spécifier.',
    noCode: "Tu as oublié d'ajouter du code à exécuter !",
    result: "Résultat de l'éxecution du code de {message.member} en {lang.value.display}. (Temps CPU : {response.data.cpuTime} / Memoire : {memory})",
    informationBlock: stripIndent`
      Abbréviations : {formattedSlugs}
      Version : {lang.version}
    `,
  },
};

export const help = {
  options: {
    aliases: ['help', 'aide'],
    description: "Permet de voir la liste des commandes de MonkaBot, ou d'avoir des informations sur une commande en particulier.",
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
      title: 'Commandes de MonkaBot ({amount})',
      description: "Faites `{helpCommand}` pour avoir plus d'informations sur une commande.",
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

export const ping = {
  options: {
    aliases: ['ping', 'pong', 'ms'],
    description: "Permet de connaître la latence de MonkaBot et de l'API Discord.",
    enabled: true,
    usage: 'ping',
    examples: ['ping'],
  },
  messages: {
    firstMessage: 'Ping !',
    secondMessage: "Pong ! Latence du bot : {botPing}ms. Latence de l'API : {apiPing}ms.",
  },
};

export const statistics = {
  options: {
    aliases: ['statistiques', 'statistique', 'statistics', 'statistic', 'stats', 'stat', 'botinfo'],
    description: 'Affiche des statistiques et diverses informations sur MonkaBot, comme son temps de fonctionnement, sa version etc.',
    enabled: true,
    usage: 'statistiques',
    examples: ['statistiques'],
  },
  messages: {
    embed: {
      title: 'Statistiques de MonkaBot',
      description: 'Le préfixe est `{prefix}`. Faites `{prefix}aide` pour avoir la liste des commandes.',
      version: '❯ Version',
      versionContent: stripIndent`
        Version : {version}
        Commit : {commitLink}
      `,
      uptime: '❯ Temps de fonctionnement',
      memory: '❯ Mémoire',
      commands: '❯ Commandes',
    },
  },
};

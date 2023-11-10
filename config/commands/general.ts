import { stripIndent } from 'common-tags';
import {
  ActivityType,
  channelMention,
  TimestampStyles,
  userMention,
} from 'discord.js';
import { timeFormat } from '@/utils';

export const code = {
  descriptions: {
    name: 'Lancer le code',
  },
  messages: {
    noMoreCredits: 'Cette commande peut malheureusement être utilisée maximum 200 fois par jour, et ce quota a été atteint... Réessaye à partir de 13h !',
    messageNotFound: "Le message n'a pas été trouvé.",
    result: "Résultat de l'exécution de ce code en **{language.display} ({language.version})**. (Temps CPU : {cpuTime} / Memoire : {memory})\n ```ph\n{output}```",
    wrapNames: {
      c: 'une fonction `main` autour de ton code, et importer `stdio.h` et `stdlib.h`',
      cpp: 'une fonction `main` autour de ton code, et importer `iostream`',
      java: 'une classe `Main` et méthode static `main` autour de ton code',
      nodejs: 'une IIFE async autour de ton code',
    },
    codeSelectMenu: {
      prompt: 'Plusieurs codes ont été trouvés. Choisis lequel utiliser :',
      placeholder: 'Choisis un code',
      itemWithLanguage: 'Code {i}',
      itemWithoutLanguage: 'Code {i} (en {code.lang})',
    },
    languageSelectMenu: {
      prompt: 'Choisis le langage de ton code :',
      placeholder: 'Choisis un langage',
    },
    wrapConfirmation: {
      prompt: 'Souhaites-tu injecter {wrapName} ?\nExemple : ```{code}```',
      yes: 'Oui',
      no: 'Non',
    },
  },
} as const;

export const contacts = {
  descriptions: {
    name: 'contacts',
    command: "Consulter les contacts utiles des membres de l'administration de l'école.",
  },
  messages: {
    noContacts: "Aucun contact n'a été ajouté !",
    listLine: '**__{contact}__**\n*{description}*',
    pageTitle: 'Contact {teamName}',
    selectMenuItemDescription: 'Page {pageIndex}',
    selectMenuItemEmoji: '🏷',
  },
} as const;

export const latex = {
  descriptions: {
    name: 'latex',
    command: 'Formatter du texte LaTeX proprement.',
    options: {
      equation: 'Équation à formatter.',
    },
  },
  messages: {
    equationModal: {
      title: 'Equation LaTeX',
      textInput: {
        label: 'Équation',
        placeholder: 'Écris ton équation ici... e.g. \\frac{1}{2}',
      },
    },
    invalidEquation: "Cette équation n'est pas valide ! Le message d'erreur LaTeX est :\n`{msg}`",
    genericError: "L'image de la formule n'a pas pu être générée.",
  },
} as const;

export const mergePdf = {
  descriptions: {
    name: 'merge-pdf',
    command: "Combiner plusieurs fichiers PDF en pièces jointes de ce message ou d'un autre.",
    options: {
      messages: 'Liens des messages desquels récupérer les PDFs à combiner, séparés par des espaces.',
      attachment: 'Pièce jointe à combiner.',
      name: 'Nom du fichier de sortie.',
    },
  },
  messages: {
    noPDFGiven: 'Il faut ajouter des PDFs à ton message, ou donner le lien de messages contenant des PDFs !',
    notEnoughFiles: 'Il faut me donner au moins 2 fichiers pour que je puisse les fusionner !',
    error: 'Une erreur est survenue lors de la fusion des fichiers...',
  },
} as const;

export const ping = {
  descriptions: {
    name: 'ping',
    command: "Connaître la latence de HorizonBot et de l'API Discord.",
  },
  messages: {
    message: "Pong ! Latence de HorizonBot : {botPing}ms. Latence de l'API : {apiPing}ms.",
  },
} as const;

export const recordings = {
  descriptions: {
    name: 'recordings',
    command: 'Consulter la liste des enregistrements des eclasses disponibles.',
  },
  messages: {
    noRecords: "Je n'ai trouvé aucun enregistrement de classes dans la base de données !",
    listTitle: 'Liste des enregistrements ({total})',
    listLine: `• {topic} par ${userMention('{professorId}')} (${timeFormat('{date}', TimestampStyles.RelativeTime)}) : {links}`,
    listLineLink: '[Lien {num}]({link})',
    pageDescription: '{total} enregistrement(s)',
  },
} as const;

export const reminders = {
  descriptions: {
    name: 'reminders',
    command: 'Gérer des rappels personnels.',
    subcommands: {
      create: 'Créer un rappel.',
      list: 'Consulter ses rappels à venir.',
      edit: 'Modifier un rappel.',
      remove: 'Supprimer un rappel.',
    },
    options: {
      dateOrDuration: 'Date du rappel ou durée au bout de laquelle je dois te rappeler.',
      content: 'Message à te rappeler.',
      id: 'Identifiant du rappel à modifier.',
    },
  },
  messages: {
    // Global
    invalidReminder: "Cet ID de rappel n'est pas valide.",
    invalidTime: "Cette durée ou cette date n'est pas valide.",

    // Create a reminder
    createdReminder: `D'accord, je te rappellerai ça le ${timeFormat('{date}')} ! Ce rappel a l'ID \`{reminderId}\`.`,
    openDm: "\n:warning: Tes messages privés ne sont pas ouverts ou tu m'as bloqué, je ne pourrai donc pas t'envoyer le message de rappel ! Active-les ou débloque-moi pour les recevoir.",

    // List the reminders
    noReminders: "Je n'ai trouvé aucun rappel t'étant associé dans la base de données !",
    listTitle: 'Liste de tes rappels ({total})',
    listLine: `• \`{reminderId}\` (${timeFormat('{date}', TimestampStyles.RelativeTime)}) : {description}`,

    // Edit a reminder
    editedReminder: `Ce rappel a bien été modifié, je te le rappellerai le ${timeFormat('{date}')} !`,
    invalidUsage: 'Ajoute la date ou le message à modifier.',
    editReminderModal: {
      title: 'Modification de votre rappel',
      contentLabel: 'Contenu',
      dateLabel: 'Date',
    },

    // Remove a reminder
    removedReminder: 'Ce rappel a bien été supprimé !',
  },
} as const;

export const serverInfo = {
  descriptions: {
    name: 'server-info',
    command: 'Affiche diverses informations sur la guilde où la commande est exécutée.',
  },
  messages: {
    embed: {
      title: 'Informations sur {name}',
      membersTitle: 'Membres',
      membersValue: `Total : **{memberCount}**\nPropriétaire : ${userMention('{ownerId}')}`,
      channelsTitle: 'Salons',
      channelsValue: 'Total : **{channels.cache.size}**\n:hash: Salons textuels : **{text}**\n:loud_sound: Salons vocaux : **{voice}**\n:pushpin: Catégories : **{categories}**',
      boostsTitle: 'Boosts',
      boostsValue: 'Niveau **{premiumTier}**\n**{premiumSubscriptionCount}**/15 boosts',
      rolesTitle: 'Rôles',
      rolesValue: 'Total : **{roles.cache.size}**',
      createdAtTitle: 'Création',
      createdAtValue: `Crée le ${timeFormat('{createdTimestamp}')}\n${timeFormat('{createdTimestamp}', TimestampStyles.RelativeTime)}`,
      footer: 'ID : {id}',
    },
  },
} as const;

export const statistics = {
  descriptions: {
    name: 'statistics',
    command: 'Affiche des statistiques et diverses informations sur le bot.',
  },
  messages: {
    embed: {
      title: 'Statistiques de HorizonBot',
      description: 'Tapez `/` (sans envoyer le message) pour afficher la liste des commandes.',
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
} as const;

export const tag = {
  descriptions: {
    name: 'tag',
    command: 'Consulter les "tags" (messages dynamiques, entièrement configurable directement via discord).',
    options: {
      name: 'Nom du tag.',
    },
  },
  messages: {
    modals: {
      contentLabel: 'Contenu du tag',
      contentPlaceholder: 'Entrez le contenu du tag ici.',
      createTitle: 'Créer un tag',
      editTitle: 'Modifier le tag {name}',
    },

    noTags: "Aucun tag n'a été créé !",
    listTitle: 'Liste des tags ({total})',
    listLine: '• `{name}` : {uses} utilisations',
  },
} as const;

export const userInfo = {
  descriptions: {
    name: 'user-info',
    command: 'Affiche diverses informations sur un membre en particulier du Discord.',
    options: {
      member: 'Membre sur lequel regarder les informations.',
    },
  },
  messages: {
    embed: {
      title: 'Informations sur {member.user.username}',
      names: {
        title: '❯ Noms',
        content: `
          Pseudo : {member.user.username}
          Surnom : {member.displayName}
          Discriminant : \`{member.user.discriminator}\`
          Identifiant : \`{member.id}\``,
      },
      created: {
        title: '❯ A créé son compte',
        content: 'le {creation}',
      },
      joined: {
        title: '❯ A rejoint le serveur',
        content: 'le {joined}',
        unknown: 'Inconnu',
      },
      roles: {
        title: '❯ Rôles',
        content: '{amount} : {roles}',
        noRole: 'Aucun',
      },
      presence: {
        title: '❯ Présence',
        content: stripIndent`
          Statut : {status}
          {presenceDetails}`,
        types: {
          [ActivityType.Playing]: 'Joue à {activity.name}\n',
          [ActivityType.Streaming]: 'Est en live\n',
          [ActivityType.Listening]: 'Écoute (sur {activity.name}) :\n',
          [ActivityType.Watching]: 'Regarde : {activity.name}\n',
          [ActivityType.Custom]: '{activity.name}\n',
          [ActivityType.Competing]: 'En compétition ({activity.name})',
        },
        details: '↳ {activity.details}\n',
        state: '↳ {activity.state}\n',
        timestamps: '↳ A commencé {time}',
        status: {
          online: 'En ligne',
          idle: 'AFK',
          dnd: 'Ne pas déranger',
          offline: 'Hors ligne',
          invisible: 'Hors ligne',
        },
      },
    },
  },
} as const;

export const vocalCount = {
  descriptions: {
    name: 'vocal-count',
    command: 'Affiche le nombre de personnes connectées dans les salons vocaux du serveur.',
  },
  messages: {
    topLine: `\`{index}.\` ${channelMention('{channelId}')} : {count} membres`,
    noOnlineMembers: "Personne n'est connecté dans un salon vocal dans ce serveur.",
  },
} as const;

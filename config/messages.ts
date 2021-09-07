import { Identifiers } from '@sapphire/framework';
import { oneLine, stripIndent } from 'common-tags';

export default {
  global: {
    oops: ":warning: Oups... Quelque chose s'est mal passé en réalisant cette action. Il se peut qu'elle ne se soit pas complètement terminée, voire pas commencée. Désolé !",
  },
  errors: {
    precondition: {
      [Identifiers.PreconditionStaffOnly]: ":x: Aïe, tu n'as pas la permission de faire cela :confused:",
      unknownError: "Une pré-condition de commande inconnue vous empêche d'effectuer cette action.",
    },
  },
  miscellaneous: {
    eprofMentionPublic: '{eProf} nous avons besoin de toi !',
    eprofMentionPrivate: '{member} a besoin de toi là-bas : {message.channel}',
    paginatedMessagePrompt: 'À quelle page désires-tu aller ?',
  },
  upcomingClasses: {
    header: '__Calendrier des séances de révisions des 7 prochains jours__\n*Il est tenu à jour automatiquement, pensez à le regarder régulièrement !*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
    noClasses: 'Aucune séance de prévue !',
    classLine: '• {beginHour}h-{endHour}h: {eclass.topic} <#{eclass.subject.textChannel}> (par <@{eclass.professor}>) [<@&{eclass.targetRole}>]\n',
  },
  classesCalendar: {
    textChannel: 'Salon textuel : <#{textChannel}>',
    textDocsChannel: ' • Documents : <#{textDocsChannel}>',
    title: '{name}',
    pretitle: '{teachingUnit} ({classCode}) - {schoolYear}',
    classLine: '• <t:{date}:R> - {beginHour}-{endHour} (<@{professor}>) : {topic}',
    body: '{baseInformations}\n{exams}\n\n**Cours à venir :**\n{classes}',
  },
  antiSwear: {
    swearModAlert: stripIndent`
      {message.member} a dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte. Si ce message est inapproprié, réagissez avec :white_check_mark: à ce message pour le flagger.

      {message.url}
    `,
    manualSwearAlert: stripIndent`
      {message.member} à envoyé un message jugé innaproprié par {manualModerator} dans {message.channel}. Il/elle a donc été sommé(e) en MP.

      {message.url}
    `,
    swearModAlertUpdate: stripIndent`
      *~~{message.member} à dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte.~~*
      {moderator} a flaggé ce message et l'utilisateur a été sommé en MP.

      {message.url}
    `,
    swearUserAlert: oneLine`
      Bonjour {message.member}, je suis le bot du Discord de révision Ef'Réussite. Tu as tenu un propos innaproprié
      ("{swear}") dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, nous t'invitons donc à
      supprimer ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié ("{swear}") dans ce salon. On s'efforce à garder ce
      serveur sérieux et amical, nous t'invitons donc à supprimer ce message ou enlever cette insulte le plus rapidement
      possible. Merci !\n{message.url}
    `,
    swearManualUserAlert: oneLine`
      Bonjour {message.member}, je suis le bot du discord de révision Ef'Réussite. Tu as tenu un propos innaproprié
      dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, nous t'invitons donc à supprimer
      ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearManualUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié dans ce salon. On s'efforce à garder ce serveur
      sérieux et amical, nous t'invitons donc à supprimer ce message ou enlever cette insulte le plus rapidement possible.
      Merci !\n{message.url}
    `,
  },
  prompts: {
    channel: {
      base: 'Entre un salon (mentionne-le ou entre son nom ou son ID) :',
      invalid: 'Ce salon est invalide.',
    },
    message: {
      base: 'Entre un message (son ID ou son URL) :',
      invalid: 'Ce message est invalide.',
    },
    text: {
      base: 'Entre du texte :',
      invalid: 'Ce texte est invalide.',
    },
    day: {
      base: 'Entre une date (au format "jj/MM")  :',
      invalid: 'Cette date est invalide.',
    },
    hour: {
      base: 'Entre une heure (au format "HH:mm") :',
      invalid: 'Cette heure est invalide.',
    },
    date: {
      base: 'Entre une date (au format "jj/MM HH:mm")  :',
      invalid: 'Cette date est invalide.',
    },
    duration: {
      base: 'Entre une durée (en anglais ou en francais).\nTu pouvez par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Tu peux également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
      invalid: 'Cette durée est invalide.',
    },
    member: {
      base: 'Entre un membre (mentionne-le ou entre son pseudo ou son ID) :',
      invalid: 'Ce membre est invalide.',
    },
    role: {
      base: 'Entre un rôle (mentionne-le ou entre son nom ou son ID) :',
      invalid: 'Ce rôle est invalide.',
    },

    stoppedPrompting: 'Tu as bien abandonné la commande !',
  },
};

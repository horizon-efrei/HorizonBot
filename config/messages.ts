import { oneLine, stripIndent } from 'common-tags';

export default {
  global: {
    oops: ":warning: Oups... Quelque chose s'est mal passé en réalisant cette action. Il se peut qu'elle ne se soit pas complètement terminée, voire pas commencée. Désolé !",
  },
  miscellaneous: {
    eprofMentionPublic: '{eProf} nous avons besoin de toi !',
    eprofMentionPrivate: '{member} a besoin de toi là-bas : {message.channel}',
    paginatedMessagePrompt: 'À quelle page souhaites-tu aller ?',
  },
  upcomingClasses: {
    header: '__Calendrier des séances de révisions des 7 prochains jours__\n*Il est tenu à jour automatiquement, pensez à le regarder régulièrement !*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
    noClasses: 'Aucune séance de prévue !',
    classLine: '• {beginHour}h-{endHour}h: {eclass.topic} <#{eclass.classChannel}> (par <@{eclass.professor}>) [<@&{eclass.targetRole}>]\n',
  },
  antiSwear: {
    swearModAlert: stripIndent`
      {message.member} à dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte. Si ce message est inapproprié, réagissez avec :white_check_mark: à ce message pour le flagger.

      En savoir plus : *TODO*.
      {message.url}
    `,
    manualSwearAlert: stripIndent`
      {message.member} à envoyé un message jugé innaproprié par {manualModerator} dans {message.channel}. Il a donc été sommé en MP.

      En savoir plus : *TODO*.
      {message.url}
    `,
    swearModAlertUpdate: stripIndent`
      *~~{message.member} à dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte.~~* {moderator} a flaggé ce message et l'utilisateur a été sommé en MP.

      En savoir plus : *TODO*.
      {message.url}
    `,
    swearUserAlert: oneLine`
      Bonjour {message.member}, je suis le bot du discord de révision d'Efrei. Tu as tenu un propos innaproprié
      ("{swear}") dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, on t'invite donc à
      supprimer ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié ("{swear}") dans ce salon. On s'efforce à garder ce
      serveur sérieux et amical, on t'invite donc à supprimer ce message ou enlever cette insulte le plus rapidement
      possible. Merci !\n{message.url}
    `,
    swearManualUserAlert: oneLine`
      Bonjour {message.member}, je suis le bot du discord de révision d'Efrei. Tu as tenu un propos innaproprié
      dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, on t'invite donc à supprimer
      ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearManualUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié dans ce salon. On s'efforce à garder ce serveur
      sérieux et amical, on t'invite donc à supprimer ce message ou enlever cette insulte le plus rapidement possible.
      Merci !\n{message.url}
    `,
  },
  prompts: {
    channel: {
      base: 'Entrez un salon (mentionnez-le ou entrez son nom ou son ID) :',
      invalid: 'Ce salon est invalide.',
    },
    message: {
      base: 'Entrez un message (son ID ou son URL) :',
      invalid: 'Ce message est invalide.',
    },
    text: {
      base: 'Entrez du texte :',
      invalid: 'Ce texte est invalide.',
    },
    date: {
      base: 'Entrez une date (au format "jj/MM")  :',
      invalid: 'Cette date est invalide.',
    },
    hour: {
      base: 'Entrez une heure (au format "HH:mm") :',
      invalid: 'Cette heure est invalide.',
    },
    duration: {
      base: 'Entrez une durée (en anglais ou en francais).\nVous pouvez par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Vous pouvez également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
      invalid: 'Cette durée est invalide.',
    },
    member: {
      base: 'Entrez un membre (mentionnez-le ou entrez son pseudo ou son ID) :',
      invalid: 'Ce membre est invalide.',
    },
    role: {
      base: 'Entrez un rôle (mentionnez-le ou entrez son nom ou son ID) :',
      invalid: 'Ce rôle est invalide.',
    },

    stoppedPrompting: 'Tu as bien abandonné la commande !',
  },
};

import { oneLine, stripIndent } from 'common-tags';

export default {
  global: {
    oops: ":warning: Oups... Quelque chose s'est mal passé en réalisant cette action. Il se peut qu'elle ne se soit pas complètement terminée, voire pas commencée. Désolé !",
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
    promptChannel: 'Entrez un salon:',
    promptInvalidChannel: 'Ce salon est invalide. Entrez un salon:',

    promptMessage: 'Entrez un message:',
    promptInvalidMessage: 'Ce message est invalide. Entrez un message:',

    promptText: 'Entrez du texte:',
    promptInvalidText: 'Ce texte est invalide. Entrez un texte:',

    promptDate: 'Entrez une date:',
    promptInvalidDate: 'Cette date est invalide. Entrez une date:',

    promptHour: 'Entrez une heure:',
    promptInvalidHour: 'Cette heure est invalide. Entrez une heure:',

    promptDuration: 'Entrez une durée:',
    promptInvalidDuration: 'Cette durée est invalide. Entrez une durée:',

    promptMember: 'Entrez un membre:',
    promptInvalidMember: 'Ce membre est invalide. Entrez un membre:',

    promptRole: 'Entrez un role:',
    promptInvalidRole: 'Ce role est invalide. Entrez un role:',

    stoppedPrompting: 'Tu as bien abandonné la commande !',
  },
};

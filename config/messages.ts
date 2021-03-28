import { oneLine, stripIndent } from 'common-tags';

export default {
  antiSwear: {
    swearModAlert: stripIndent`
      {message.member} à dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte. Si ce message est inapproprié, réagissez avec :white_check_mark: à ce message pour le flagger.

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
      supprimer ce message ou cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
  },
};

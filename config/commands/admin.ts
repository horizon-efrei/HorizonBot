// eslint-disable-next-line import/prefer-default-export
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

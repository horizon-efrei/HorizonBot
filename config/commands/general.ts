// eslint-disable-next-line import/prefer-default-export
export const ping = {
  options: {
    aliases: ['ping', 'pong', 'ms'],
    description: "Permet de connaître la latence de MonkaBot et de l'API Discord.",
    enabled: true,
  },
  messages: {
    firstMessage: 'Ping !',
    secondMessage: "Pong ! Latence du bot : {botPing}ms. Latence de l'API : {apiPing}ms.",
  },
};

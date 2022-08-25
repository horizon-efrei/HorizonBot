import type { ButtonInteraction, Interaction, InteractionResponseFields } from 'discord.js';
import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageButtonStyles, MessageComponentTypes } from 'discord.js/typings/enums';
import { nullop } from './noop';

// TODO: configure labels
const yesButton = new MessageButton()
  .setCustomId('yes-button')
  .setStyle(MessageButtonStyles.SUCCESS)
  .setLabel('Oui');

const noButton = new MessageButton()
  .setCustomId('no-button')
  .setStyle(MessageButtonStyles.DANGER)
  .setLabel('Non');

const buttonsRow = new MessageActionRow().setComponents(noButton, yesButton);

/**
 * Sends a message with yes/no buttons the user can choose from
 * @param interaction The interaction to reply to
 * @param content The message to show alongside the buttons
 * @returns The received button interaction and if the user confirmed it
 */
export default async function confirm(
  interaction: Interaction & InteractionResponseFields,
  content: string,
): Promise<{ buttonInteraction: ButtonInteraction; isConfirmed: boolean }> {
  if (interaction.deferred)
    await interaction.followUp({ content, components: [buttonsRow] });
  else if (interaction.replied)
    await interaction.editReply({ content, components: [buttonsRow] });
  else
    await interaction.reply({ content, components: [buttonsRow] });

  const buttonInteraction = await interaction.channel.awaitMessageComponent({
    componentType: MessageComponentTypes.BUTTON,
    time: 30_000,
    filter: int => int.user.id === interaction.user.id && (int.customId === 'yes-button' || int.customId === 'no-button'),
  }).catch(nullop);

  return { buttonInteraction, isConfirmed: Boolean(buttonInteraction?.customId === 'yes-button') };
}

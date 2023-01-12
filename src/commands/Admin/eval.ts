/**
 * @credits This command is adapted from the eval command in Skyra, made by
 * Skyra's contributors here : https://github.com/skyra-project/skyra/blob/main/src/commands/System/Admin/eval.ts
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { inspect } from 'node:util';
import { ApplyOptions } from '@sapphire/decorators';
import { Stopwatch } from '@sapphire/stopwatch';
import Type from '@sapphire/type';
import { codeBlock, isThenable } from '@sapphire/utilities';
import { ApplicationCommandType } from 'discord-api-types/v10';
import { PermissionsBitField } from 'discord.js';
import pupa from 'pupa';
import { evaluate as config } from '@/config/commands/admin';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { extractCodeBlocks, sleep, trimText } from '@/utils';

interface EvalReturnType {
  type: Type;
  time: string;
  result: Error | string;
}

@ApplyOptions<HorizonCommand.Options>(config)
export default class EvalCommand extends HorizonCommand<typeof config> {
  private readonly _maxRunTime = 60_000;

  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerContextMenuCommand(
      command => command
        .setName(this.descriptions.name)
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),
    );
  }

  public override async contextMenuRun(interaction: HorizonCommand.ContextMenuInteraction): Promise<void> {
    if (!interaction.channel)
      return;

    const message = await interaction.channel.messages.fetch(interaction.targetId) as GuildMessage;
    if (!message) {
      await interaction.reply({ content: this.messages.messageNotFound, ephemeral: true });
      return;
    }

    const codes = extractCodeBlocks(message.content);
    const codeToRun = codes[0]?.text ?? message.content;

    let output: EvalReturnType;
    try {
      output = await this._timedEval(message, codeToRun);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Timeout') {
        await interaction.reply(config.messages.evalTimeout);
        return;
      }
      throw error;
    }

    const result = (output.result || String.fromCodePoint(8203)) as string;
    const messageWithoutResult = pupa(config.messages.output, {
      output: '{output}',
      type: codeBlock('ts', output.type),
      time: output.time,
    });
    const showedResult = trimText(result, 1900 - messageWithoutResult.length);
    const resultOutput = codeBlock('ts', showedResult);

    await interaction.reply(pupa(messageWithoutResult, { output: resultOutput }));
  }

  private async _timedEval(message: GuildMessage, code: string): Promise<EvalReturnType> {
    return await Promise.race([
      sleep(this._maxRunTime).then(() => { throw new Error('Timeout'); }),
      this._eval(message, code),
    ]);
  }

  private async _eval(message: GuildMessage, code: string): Promise<EvalReturnType> {
    const stopwatch = new Stopwatch();
    let syncTime = '';
    let asyncTime = '';
    let result: unknown;
    let thenable = false;
    let type: Type;

    try {
      code = `;(async () => {\n${code}\n})();`;

      // Make "message" accessible via the "msg" alias.
      const msg = message; // eslint-disable-line @typescript-eslint/no-unused-vars
      result = eval(code); // eslint-disable-line no-eval
      syncTime = stopwatch.toString();
      type = new Type(result);
      if (isThenable(result)) {
        thenable = true;
        stopwatch.restart();
        result = await result; // eslint-disable-line @typescript-eslint/await-thenable
        asyncTime = stopwatch.toString();
      }
    } catch (error: unknown) {
      if (syncTime.length === 0)
        syncTime = stopwatch.toString();
      if (thenable && asyncTime.length === 0)
        asyncTime = stopwatch.toString();
      type ??= new Type(error);
      result = error;
    }

    stopwatch.stop();
    if (typeof result !== 'string') {
      result = result instanceof Error
        ? result.stack!.replaceAll(new RegExp(process.cwd(), 'gi'), '.')
        : inspect(result, { depth: 3, showHidden: true });
    }

    return {
      type,
      time: asyncTime ? `${asyncTime} (${syncTime})` : syncTime,
      result: result as string,
    };
  }
}

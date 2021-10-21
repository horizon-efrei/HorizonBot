/**
 * @credits This command is adapted from the eval command in Skyra, made by
 * Skyra's contributors here : https://github.com/skyra-project/skyra/blob/main/src/commands/System/Admin/eval.ts
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { inspect } from 'node:util';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { Stopwatch } from '@sapphire/stopwatch';
import Type from '@sapphire/type';
import { codeBlock, isThenable } from '@sapphire/utilities';
import pupa from 'pupa';
import { sleep, trimText } from '@/app/lib/utils';
import { evaluate as config } from '@/config/commands/admin';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

interface EvalReturnType {
  type: Type;
  time: string;
  result: Error | string;
}

interface EvalOptions {
  isAsync: boolean;
  isJson: boolean;
  showHidden: boolean;
  depth: number;
}

@ApplyOptions<CommandOptions>({
  ...config.options,
  flags: ['async', 'showHidden', 'hidden', 'json'],
  options: ['depth'],
  preconditions: ['AdminOnly'],
})
export default class EvalCommand extends HorizonCommand {
  maxRunTime = 60_000;

  public async messageRun(message: GuildMessage, args: Args): Promise<void> {
    const code = await args.restResult('code');
    if (code.error) {
      await message.channel.send(config.messages.noCode);
      return;
    }

    const options = {
      isAsync: args.getFlags('async'),
      isJson: args.getFlags('json'),
      showHidden: args.getFlags('showHidden', 'hidden'),
      depth: Number(args.getOption('depth') ?? 0) || 0,
    };
    let output: EvalReturnType;
    try {
      output = await this._timedEval(message, options, code.value);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Timeout') {
        await message.channel.send(config.messages.evalTimeout);
        return;
      }
      throw error;
    }

    const result = (output.result || String.fromCharCode(8203)) as string;
    const messageWithoutResult = pupa(config.messages.output, {
      output: '{output}',
      type: codeBlock('ts', options.isJson ? 'JSON' : output.type),
      time: output.time,
    });
    const showedResult = trimText(result, 1900 - messageWithoutResult.length);
    const resultOutput = codeBlock(options.isJson ? 'json' : 'ts', showedResult);

    await message.channel.send(pupa(messageWithoutResult, { output: resultOutput }));
  }

  private async _timedEval(message: GuildMessage, options: EvalOptions, code: string): Promise<EvalReturnType> {
    return await Promise.race([
      sleep(this.maxRunTime).then(() => { throw new Error('Timeout'); }),
      this._eval(message, options, code),
    ]);
  }

  // Eval the input
  private async _eval(message: GuildMessage, options: EvalOptions, code: string): Promise<EvalReturnType> {
    const stopwatch = new Stopwatch();
    let syncTime = '';
    let asyncTime = '';
    let result: unknown;
    let thenable = false;
    let type: Type;

    try {
      if (options.isAsync)
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
        ? result.stack.replace(new RegExp(process.cwd(), 'gi'), '.')
        : options.isJson
        ? JSON.stringify(result, null, 4)
        : inspect(result, {
          depth: options.depth,
          showHidden: options.showHidden,
        });
    }

    return {
      type,
      time: asyncTime ? `${asyncTime} (${syncTime})` : syncTime,
      result: result as string,
    };
  }
}

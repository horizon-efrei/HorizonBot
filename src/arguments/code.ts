import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';

// eslint-disable-next-line unicorn/no-unsafe-regex
const MARKDOWN_FENCED_BLOCK_REGEX = /^```(?:[\S]+)?\n(?<code>[^`]*)```$/imu;

export default class CodeArgument extends Argument<string> {
  public run(arg: string, _context: ArgumentContext<string>): ArgumentResult<string> {
    const code = MARKDOWN_FENCED_BLOCK_REGEX.test(arg)
      ? MARKDOWN_FENCED_BLOCK_REGEX.exec(arg).groups.code
      : arg;
    return this.ok(code);
  }
}

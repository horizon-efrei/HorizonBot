import type { Result } from '@sapphire/framework';
import { ok } from '@sapphire/framework';

const MARKDOWN_FENCED_BLOCK_REGEX = /^```(?:[\S]+)?\n(?<code>[^`]*)```$/imu;

export default function resolveCode(parameter: string): Result<string, 'codeError'> {
  const code = MARKDOWN_FENCED_BLOCK_REGEX.test(parameter)
    ? MARKDOWN_FENCED_BLOCK_REGEX.exec(parameter).groups.code
    : parameter;
  return ok(code);
}

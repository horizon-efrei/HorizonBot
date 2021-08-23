import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import CustomResolvers from '@/resolvers';
import type { CodeLanguageResult } from '@/types';

export default class CodeLanguageArgument extends Argument<CodeLanguageResult> {
  public run(parameter: string, context: ArgumentContext<CodeLanguageResult>): ArgumentResult<CodeLanguageResult> {
    const resolved = CustomResolvers.resolveCodeLanguage(parameter);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a code language.',
      context,
    });
  }
}

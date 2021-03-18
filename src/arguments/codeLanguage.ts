import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import settings from '@/config/settings';
import type { CodeLanguageResult } from '@/types';

export default class CodeLanguageArgument extends Argument<CodeLanguageResult> {
  public run(arg: string, _context: ArgumentContext<CodeLanguageResult>): ArgumentResult<CodeLanguageResult> {
    const language = settings.languages.find(lang => lang.slugs.includes(arg));
    return language
      ? this.ok(language)
      : this.error({ parameter: arg });
  }
}

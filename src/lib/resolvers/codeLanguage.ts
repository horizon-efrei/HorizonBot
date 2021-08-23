import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import settings from '@/config/settings';
import type { CodeLanguageResult } from '@/types';

export default function resolveCodeLanguage(parameter: string): Result<CodeLanguageResult, 'codeLanguageError'> {
  const language = settings.languages.find(lang => lang.slugs.includes(parameter));
  if (isNullish(language))
    return err('codeLanguageError');
  return ok(language);
}

import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import { fr as chrono } from 'chrono-node';

const days = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
};

const nextDay = (day: keyof typeof days): number => ((days[day] - new Date().getDay()) + 7) % 7 || 7;

const isPast = (date: Date): boolean => date.getTime() < Date.now();

export default function resolveDate(parameter: string, options?: { canBePast: boolean }): Result<Date, 'dateError'> {
  const expandedParameter = parameter
    .replace(/ajrd/i, 'aujourd\'hui')
    .replace(/apr[eè]s[ -]demain/i, 'dans 2 jours')
    .replace(/dm/i, 'demain')
    .replace(/apdm/i, 'dans 2 jours')
    // With the French locale, chrono-node fails to parse weekdays correctly. If you say "monday" but you are tuesday,
    // it will reference the day before, not the next monday, and if you say "next monday" it will reference the monday
    // in two weeks. You have effectively no way to tell it "this monday" with the French locale.
    // Thus the following hack.
    .replace(
      new RegExp(`(${Object.keys(days).join('|')})(?! prochain)`, 'i'),
      (_, day: keyof typeof days) => `dans ${nextDay(day)} jours`,
    );

  const date = chrono.parseDate(expandedParameter);

  // TODO: Separate error for past dates
  if (!date || (!options?.canBePast && isPast(date)))
    return err('dateError');
  return ok(date);
}

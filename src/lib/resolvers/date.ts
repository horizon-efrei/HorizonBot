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

export function resolveDate(parameter: string, options?: { canBePast: boolean }): Result<Date, 'dateError' | 'datePeriodError'> {
  const expandedParameter = parameter
    .replace(/ajrd/i, "aujourd'hui")
    .replace(/apr[eè]s[ -]demain/i, 'dans 2 jours')
    .replace(/dm/i, 'demain')
    .replace(/apdm/i, 'dans 2 jours')
    // With the French locale, the chrono-node's CasualTimeParser are very badly setup and don't take into account all
    // possibilities or variations of the suffixes. Thus the following hack.
    .replace(/apr[eè]s[ -]midi|apr[eè]m/i, 'à 14h')
    .replace(/(?:[aà] )?midi/i, 'à 12h')
    .replace(/(?:[aà] )?minuit/i, 'à 00h')
    // With the French locale, chrono-node fails to parse weekdays correctly. If you say "monday" but you are tuesday,
    // it will reference the day before, not the next monday, and if you say "next monday" it will reference the monday
    // in two weeks. You have effectively no way to tell it "this monday" with the French locale.
    // Thus the following hack.
    .replace(
      new RegExp(`(${Object.keys(days).join('|')})(?! prochain)`, 'i'),
      (_, day: keyof typeof days) => `dans ${nextDay(day)} jours`,
    );

  const date = chrono.parseDate(expandedParameter);

  if (!date)
    return err('dateError');
  if (!options?.canBePast && isPast(date))
    return err('datePeriodError');
  return ok(date);
}

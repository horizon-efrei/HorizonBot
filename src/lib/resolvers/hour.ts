import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import type { HourMinutes } from '@/types';

const HOUR_REGEX = /^(?<hour>\d{1,2})[h:\s](?<minutes>\d{2})?$/imu;

export default function resolveHour(parameter: string): Result<HourMinutes, 'hourError'> {
  const hour = Number.parseInt(HOUR_REGEX.exec(parameter)?.groups?.hour, 10);
  if (!hour)
    return err('hourError');

  const minutes = Number.parseInt(HOUR_REGEX.exec(parameter)?.groups?.minutes, 10) || 0;
  return ok({
    hour,
    minutes,
    formatted: `${hour}h${minutes.toString().padStart(2, '0')}`,
  });
}

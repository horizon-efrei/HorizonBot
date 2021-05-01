import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import type { HourMinutes } from '@/lib/types';

const HOUR_REGEX = /(?<hour>\d{1,2})[h:]?(?<minutes>\d{2})?/imu;

export default class HourArgument extends Argument<HourMinutes> {
  public run(arg: string, _context: ArgumentContext<HourMinutes>): ArgumentResult<HourMinutes> {
    const hour = Number.parseInt(HOUR_REGEX.exec(arg)?.groups?.hour, 10);
    const minutes = Number.parseInt(HOUR_REGEX.exec(arg)?.groups?.minutes, 10) || 0;

    if (!hour)
      return this.error({ parameter: arg });
    return this.ok({ hour, minutes });
  }
}

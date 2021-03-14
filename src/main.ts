import '@sapphire/plugin-logger/register';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import 'dayjs/locale/fr';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import MonkaClient from '@/app/MonkaClient';

console.log('Starting MonkaBot...');

dayjs.locale('fr');
dayjs.extend(duration);
dayjs.extend(relativeTime);

const client = new MonkaClient();

const main = async (): Promise<void> => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    client.logger.info('Logged in!');
  } catch (error: unknown) {
    client.logger.fatal(error as Error);
    client.destroy();
    throw (error as Error);
  }
};

void main();

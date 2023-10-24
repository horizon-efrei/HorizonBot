import '@sapphire/plugin-logger/register';
import 'core-js/actual/iterator';
import 'core-js/proposals/array-unique';
import 'core-js/proposals/collection-methods';
import 'core-js/proposals/map-upsert';
import 'dayjs/locale/fr';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import 'source-map-support/register';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isToday from 'dayjs/plugin/isToday';
import relativeTime from 'dayjs/plugin/relativeTime';
import mongoose from 'mongoose';
import { HorizonClient } from '@/structures/HorizonClient';

console.log('Starting the bot...');

dayjs.locale('fr');
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(isToday);

const main = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error: unknown) {

  }
  const client = new HorizonClient();

  try {
    await client.login(process.env.DISCORD_TOKEN);
    client.logger.info('[Main] Logged in!');
  } catch (error: unknown) {
    client.logger.fatal(error as Error);
    await client.destroy();
    throw (error as Error);
  }
};

void main();

import '@sapphire/plugin-logger/register';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';

import MonkaClient from '@/app/MonkaClient';

console.log('Starting MonkaBot...');
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

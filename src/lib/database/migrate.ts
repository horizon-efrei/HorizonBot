import '@sapphire/plugin-logger/register';
import 'core-js/proposals/array-unique';
import 'core-js/proposals/collection-methods';
import 'core-js/proposals/map-upsert';
import 'dayjs/locale/fr';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import 'source-map-support/register';

import mongoose from 'mongoose';
import { EclassStep } from '@/types/database';

const map = new Map([
  [0, 'member-nickname-update'],
  [1, 'user-username-update'],
  [2, 'guild-join'],
  [3, 'guild-leave'],
  [4, 'invite-post'],
  [5, 'message-update'],
  [6, 'message-create'],
  [7, 'message-delete'],
  [8, 'reaction-add'],
  [9, 'reaction-remove'],
  [10, 'member-role-add'],
  [11, 'member-role-remove'],
  [12, 'voice-join'],
  [13, 'voice-leave'],
  [14, 'voice-move'],
  [15, 'channel-create'],
  [16, 'channel-update'],
  [17, 'channel-delete'],
]);

const guildId = process.argv[process.argv.indexOf('--guild') + 1];
console.log(`contact.guildId will be ${guildId}`);

async function migrate(): Promise<void> {
  const client = new mongoose.mongo.MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log('Starting migration...');

  // Eclass
  // reminded: true => step: EclassStep.Reminded
  // reminded: false => step: EclassStep.None
  console.log('Eclass: updating...');

  const upd1 = await db.collection('eclasses').updateMany(
    { reminded: true },
    {
      $set: { step: EclassStep.Reminded },
      $unset: { reminded: '' },
    },
  );
  const upd2 = await db.collection('eclasses').updateMany(
    { reminded: false },
    {
      $set: { step: EclassStep.None },
      $unset: { reminded: '' },
    },
  );

  console.log(`Eclass: migrated ${(upd1 as { modifiedCount: number }).modifiedCount + (upd2 as { modifiedCount: number }).modifiedCount}\n\n`);

  // DiscordLogs
  // migrate from int enums to string enums
  console.log('DiscordLogs: updating...');

  let discordLogsTotal = 0;
  for (const [num, name] of map) {
    const upd = await db.collection('discordlogs').updateMany(
      { type: num },
      { $set: { type: name } },
    );
    discordLogsTotal += (upd as { modifiedCount: number }).modifiedCount;
  }

  console.log(`DiscordLogs: migrated ${discordLogsTotal}\n\n`);

  // LogStatuses
  // migrate from int enums to string enums
  console.log('LogStatuses: updating...');

  let logStatusesTotal = 0;
  for (const [num, name] of map) {
    const upd = await db.collection('logstatuses').updateMany(
      { type: num },
      { $set: { type: name } },
    );
    logStatusesTotal += (upd as { modifiedCount: number }).modifiedCount;
  }

  console.log(`LogStatuses: migrated ${logStatusesTotal}\n\n`);

  console.log('Migration complete');
}

migrate()
  // eslint-disable-next-line node/no-process-exit
  .then(() => process.exit(0))
  .catch(console.error);

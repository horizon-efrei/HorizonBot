import '@sapphire/plugin-logger/register';
import 'core-js/proposals/array-unique';
import 'core-js/proposals/collection-methods';
import 'dayjs/locale/fr';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import 'source-map-support/register';

import mongoose from 'mongoose';
import { EclassStep } from '@/types/database';

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

  console.log('Migration complete');
}

migrate()
  // eslint-disable-next-line node/no-process-exit
  .then(() => process.exit(0))
  .catch(console.error);

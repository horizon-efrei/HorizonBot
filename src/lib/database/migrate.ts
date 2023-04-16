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

async function migrate(): Promise<void> {
  const client = new mongoose.mongo.MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log('Starting migration...');

  // Eclass
  // step: EclassStep.Reminded => step: EclassStep.Prepared
  console.log('Eclass: updating...');

  const upd = await db.collection('eclasses').updateMany(
    { step: 'reminded' },
    { $set: { step: EclassStep.Prepared } },
  );

  console.log(`Eclass: migrated ${(upd as { modifiedCount: number }).modifiedCount}\n\n`);

  console.log('Migration complete');
}

migrate()
  // eslint-disable-next-line node/no-process-exit
  .then(() => process.exit(0))
  .catch(console.error);

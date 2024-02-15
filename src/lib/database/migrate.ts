/* eslint-disable unicorn/prefer-top-level-await */
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

async function migrate(): Promise<void> {
  const client = new mongoose.mongo.MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log('Starting migration...');

  // Tags
  // - rename the "tags" collection to "faq"
  // - remove "isEmbed" property
  console.log('Tags: updating...');
  await db.collection('tags').rename('faqs');
  await db.collection('faqs').updateMany({}, [{ $unset: 'isEmbed' }]);
  console.log('Tags: renamed collection\n\n');

  // Eclass
  // - rename "subject" to "subjectId"
  // - make "subjectId" a string rather than an ObjectId
  console.log('Eclass: updating...');
  await db.collection('eclasses').updateMany({}, [
    { $set: { subjectId: { $toString: '$subject' } } },
    { $unset: 'subject' },
  ]);
  console.log('Eclass: updated collection\n\n');

  console.log('Migration complete');
}

migrate()
  // eslint-disable-next-line node/no-process-exit
  .then(() => process.exit(0))
  .catch(console.error);

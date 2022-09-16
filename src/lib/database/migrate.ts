import '@sapphire/plugin-logger/register';
import 'core-js/proposals/array-unique';
import 'core-js/proposals/collection-methods';
import 'dayjs/locale/fr';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import 'source-map-support/register';

import mongoose from 'mongoose';
import { ConfigEntriesChannels, ConfigEntriesRoles } from '@/types/database';

const guildId = process.argv[process.argv.indexOf('--guild') + 1];
console.log(`contact.guildId will be ${guildId}`);

async function migrate(): Promise<void> {
  const client = new mongoose.mongo.MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log('Starting migration...');

  // Configuration
  // guild => guildId
  // Remove no longer existing values
  const names = [...Object.values(ConfigEntriesChannels), ...Object.values(ConfigEntriesRoles)];
  console.log('Configuration: pruning...');
  console.log(await db.collection('configurations').deleteMany({ name: { $nin: names } }));
  console.log('Configuration: renaming...');
  console.log(await db.collection('configurations').updateMany({}, { $rename: { guild: 'guildId' } }));

  console.log('Configuration: migrated\n\n');


  // Eclass
  // guild => guildId
  // professor => professorId
  // classRole => classRoleId
  // targetRole => targetRoleId
  // announcementChannel => announcementChannelId
  // announcementMessage => announcementMessageId
  // subscribers => subscriberIds
  // recordLink => recordLinks
  // date: number => date: Date
  // end: number => end: Date
  // recordLinks: string => recordLinks: string[]
  console.log('Eclass: renaming...');
  console.log(await db.collection('eclasses').updateMany({}, {
    $rename: {
      guild: 'guildId',
      professor: 'professorId',
      classRole: 'classRoleId',
      targetRole: 'targetRoleId',
      announcementChannel: 'announcementChannelId',
      announcementMessage: 'announcementMessageId',
      subscribers: 'subscriberIds',
      recordLink: 'recordLinks',
    },
  }));

  console.log('Eclass: updating...');
  const eclasses = await db.collection('eclasses').find().toArray();
  const eclassesPromises: Array<Promise<unknown>> = [];

  for (const eclass of eclasses) {
    const $set: Record<string, unknown> = {};
    if (eclass.date && typeof eclass.date === 'number')
      $set.date = new Date(eclass.date);
    if (eclass.end && typeof eclass.end === 'number')
      $set.end = new Date(eclass.end);
    if (eclass.recordLinks && typeof eclass.recordLinks === 'string')
      $set.recordLinks = [eclass.recordLinks];
    if (!eclass.recordLinks)
      $set.recordLinks = [];

    if (Object.keys($set).length > 0)
      eclassesPromises.push(db.collection('eclasses').updateOne({ _id: eclass._id }, { $set }));
  }
  await Promise.all(eclassesPromises);

  console.log(`Eclass: migrated ${eclassesPromises.length}\n\n`);

  // Subject
  // textChannel => textChannelId
  // textDocsChannel => textDocsChannelId
  // voiceChannel => voiceChannelId
  // -exams
  console.log('Subject: renaming & updating...');
  console.log(await db.collection('subjects').updateMany({}, {
    $rename: {
      textChannel: 'textChannelId',
      textDocsChannel: 'textDocsChannelId',
      voiceChannel: 'voiceChannelId',
    },
    $unset: { exams: '' },
  }));

  console.log('Subject: migrated\n\n');

  // RoleIntersection
  // expiration: number => expiration: Date
  console.log('RoleIntersection: updating...');
  const roleIntersections = await db.collection('roleintersections').find().toArray();
  const roleIntersectionsPromises: Array<Promise<unknown>> = [];

  for (const roleIntersection of roleIntersections) {
    if (roleIntersection.expiration && typeof roleIntersection.expiration === 'number') {
      roleIntersectionsPromises.push(
        db.collection('roleintersections').updateOne({ _id: roleIntersection._id }, {
          $set: { expiration: new Date(roleIntersection.expiration) },
        }),
      );
    }
  }
  await Promise.all(roleIntersectionsPromises);

  console.log(`RoleIntersection: migrated ${roleIntersectionsPromises.length}\n\n`);

  // Reminder
  // date: number => date: Date
  console.log('Reminder: updating...');
  const reminders = await db.collection('reminders').find().toArray();
  const remindersPromises: Array<Promise<unknown>> = [];

  for (const reminder of reminders) {
    if (reminder.date && typeof reminder.date === 'number') {
      remindersPromises.push(
        db.collection('reminders').updateOne({ _id: reminder._id }, {
          $set: { date: new Date(reminder.date) },
        }),
      );
    }
  }
  await Promise.all(remindersPromises);

  console.log(`Reminder: migrated ${remindersPromises.length}\n\n`);

  // Contact
  // +guildId
  console.log('Contact: updating...');
  console.log(await db.collection('contacts').updateMany({}, { $set: { guildId } }));

  console.log('Contact: migrated\n\n');

  // Tags
  // -aliases
  console.log('Tags: updating...');
  console.log(await db.collection('tags').updateMany({}, { $unset: { aliases: '' } }));

  console.log('Tags: migrated\n\n');

  console.log('Migration complete');
}

migrate()
  // eslint-disable-next-line node/no-process-exit
  .then(() => process.exit(0))
  .catch(console.error);

import '@sapphire/plugin-logger/register';
import 'core-js/proposals/array-unique';
import 'core-js/proposals/collection-methods';
import 'dayjs/locale/fr';
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import 'source-map-support/register';

import mongoose from 'mongoose';
import Configuration from '@/models/configuration';
import Contact from '@/models/contact';
import Eclass from '@/models/eclass';
import Reminder from '@/models/reminders';
import RoleIntersection from '@/models/roleIntersections';
import Subject from '@/models/subject';
import Tags from '@/models/tags';
import { ConfigEntriesChannels, ConfigEntriesRoles } from '@/types/database';

const guildId = process.argv[process.argv.indexOf('--guild') + 1];
console.log(`contact.guildId will be ${guildId}`);

async function migrate(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI);

  console.log('Starting migration...');

  // Configuration
  // guild => guildId
  // Remove no longer existing values
  const names = [...Object.values(ConfigEntriesChannels), ...Object.values(ConfigEntriesRoles)];
  console.log('Configuration: pruning...');
  console.log(await Configuration.deleteMany({ name: { $nin: names } }));
  console.log('Configuration: renaming...');
  console.log(await Configuration.updateMany({}, { $rename: { guild: 'guildId' } }));

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
  console.log(await Eclass.updateMany({}, {
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
  const eclasses = await Eclass.find();
  for (const eclass of eclasses) {
    if (eclass.date && typeof eclass.date === 'number')
      eclass.date = new Date(eclass.date);
    if (eclass.end && typeof eclass.end === 'number')
      eclass.end = new Date(eclass.end);
    if (eclass.recordLinks && typeof eclass.recordLinks === 'string')
      eclass.recordLinks = [eclass.recordLinks];
    if (!eclass.recordLinks)
      eclass.recordLinks = [];
  }
  await Promise.all(eclasses.map(async eclass => eclass.save({ validateBeforeSave: false })));

  console.log('Eclass: migrated\n\n');

  // Subject
  // textChannel => textChannelId
  // textDocsChannel => textDocsChannelId
  // voiceChannel => voiceChannelId
  // -exams
  console.log('Subject: renaming & updating...');
  console.log(await Subject.updateMany({}, {
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
  const roleIntersections = await RoleIntersection.find();
  for (const roleIntersection of roleIntersections) {
    if (roleIntersection.expiration && typeof roleIntersection.expiration === 'number')
      roleIntersection.expiration = new Date(roleIntersection.expiration);
  }
  await Promise.all(roleIntersections.map(async roleIntersection => roleIntersection.save()));

  console.log('RoleIntersection: migrated\n\n');

  // Reminder
  // date: number => date: Date
  console.log('Reminder: updating...');
  const reminders = await Reminder.find();
  for (const reminder of reminders) {
    if (reminder.date && typeof reminder.date === 'number')
      reminder.date = new Date(reminder.date);
  }
  await Promise.all(reminders.map(async reminder => reminder.save()));

  console.log('Reminder: migrated\n\n');

  // Contact
  // +guildId
  console.log('Contact: updating...');
  console.log(await Contact.updateMany({}, { $set: { guildId } }));

  console.log('Contact: migrated\n\n');

  // Tags
  // -aliases
  console.log('Tags: updating...');
  await Tags.updateMany({}, { $unset: { aliases: '' } });

  console.log('Tags: migrated\n\n');

  console.log('Migration complete');
}

migrate()
  // eslint-disable-next-line node/no-process-exit
  .then(() => process.exit(0))
  .catch(console.error);

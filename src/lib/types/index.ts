import type { IMessagePrompterExplicitMessageReturn } from '@sapphire/discord.js-utilities';
import type { CommandOptions } from '@sapphire/framework';
import type {
  DMChannel,
  Guild,
  GuildMember,
  Message,
  PartialDMChannel,
  Role,
} from 'discord.js';
import type HorizonClient from '@/structures/HorizonClient';
import type { SubjectBase } from '@/types/database';

/* ************ */
/*  Util types  */
/* ************ */

export type Writable<T> = { -readonly [P in keyof T]: T[P] };

/* ******************************************* */
/*  Custom Types used all across the codebase  */
/* ******************************************* */

// Overwrite 'appliedMessage' and 'response' in 'IMessagePrompterExplicitMessageReturn' for them
// to be GuildMessages rather than Messages
export type PrompterMessageResult = Omit<IMessagePrompterExplicitMessageReturn, 'appliedMessage' | 'response'> & { response: GuildMessage; appliedMessage: GuildMessage };
export type PrompterText = Partial<Record<'base' | 'invalid', string>>;

export enum SchoolYear {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
}

export enum TeachingUnit {
  GeneralFormation = 'Formation Générale',
  ComputerScience = 'Informatique',
  Mathematics = 'Mathématiques',
  PhysicsElectronics = 'Physique & Électronique',
}

export type AnnouncementSchoolYear = SchoolYear | 'general';
export interface EclassCreationOptions {
  date: Date;
  subject: SubjectBase;
  topic: string;
  duration: number;
  professor: GuildMember;
  isRecorded: boolean;
}

export interface EclassEmbedOptions {
  classChannel: GuildTextBasedChannel;
  classId: string;
  date: number;
  duration: number;
  end: number;
  isRecorded: boolean;
  professor: GuildMember;
  subject: SubjectBase;
  topic: string;
}

export type HorizonCommandOptions = CommandOptions & {
  usage: string;
  examples: string[];
  runnableBy: string;
};

export type GuildTextBasedChannel = Exclude<Message['channel'], DMChannel | PartialDMChannel>;

export interface GuildMessage extends Message {
  channel: GuildTextBasedChannel;
  readonly client: HorizonClient;
  readonly guild: Guild;
  readonly member: GuildMember;
}

export interface CodeLanguageResult {
  display: string;
  language: string;
  slugs: string[];
  version: string;
  versionIndex: string;
}

export interface ReactionRolePair {
  reaction: string;
  role: Role;
}

export interface HourMinutes {
  hour: number;
  minutes: number;
  formatted: string;
}

export interface DurationPart {
  number: string;
  unit: string;
}

export interface ReactionRoleReturnPayload {
  isError: boolean;
  errorPayload?: {
    reactions?: string[];
    roles?: string[];
  };
  reactionRoles: ReactionRolePair[];
}

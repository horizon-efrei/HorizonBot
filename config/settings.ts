import { userMention } from '@discordjs/builders';
import type { ColorResolvable } from 'discord.js';
import type { CodeLanguageResult } from '@/types';

export default {
  colors: {
    primary: '#5bb78f' as ColorResolvable,
    default: '#439bf2' as ColorResolvable,
    white: '#ffffff' as ColorResolvable,
    green: '#32a852' as ColorResolvable,
    yellow: '#e0c748' as ColorResolvable,
    orange: '#f27938' as ColorResolvable,
    red: '#eb2d1c' as ColorResolvable,
    gray: '#4f4f4f' as ColorResolvable,
    transparent: '#2f3136' as ColorResolvable,
  },
  mainGuildIds: process.env.MAIN_GUILD_IDS?.split(',') ?? [],
  configuration: {
    stop: new Set(['stop', 'cancel', 'retour']),
    booleanTruths: ['oui', 'o', 'yes', 'y', 'vrai', 'v', 'true', 't'],
    booleanFalses: ['non', 'no', 'n', 'faux', 'f', 'false'],
    enableCompilerApi: true,
    roleIntersectionExpiration: 2 * 24 * 60 * 60 * 1000, // 2 days
    dateFormat: 'DD/MM [à] HH:mm',
    dayFormat: 'DD/MM/YYYY',
    eclassRoleFormat: 'Cours {subject.classCode}: {topic} ({formattedDate})',
    eclassReminderTime: 15 * 60 * 1000, // 15 minutes
  },
  apis: {
    latex: 'https://chart.apis.google.com/chart?cht=tx&chf=bg,s,FFFFFF00&chco=FFFFFF&chl=',
    compiler: 'https://api.jdoodle.com/v1/execute',
    compilerCredits: 'https://api.jdoodle.com/v1/credit-spent',
  },
  emojis: {
    yes: '✅',
    no: '❌',
  },
  languages: [
    {
      language: 'bash',
      display: 'Bash',
      version: '5.1.12',
      versionIndex: '4',
      slugs: ['bash', 'sh', 'shell'],
    },
    {
      language: 'c',
      display: 'C',
      version: 'GCC 11.1.0',
      versionIndex: '5',
      slugs: ['c'],
    },
    {
      language: 'cpp',
      display: 'C++',
      version: 'GCC 11.1.0',
      versionIndex: '5',
      slugs: ['cpp', 'c++'],
    },
    {
      language: 'java',
      display: 'Java',
      version: 'JDK 17.0.1',
      versionIndex: '4',
      slugs: ['java'],
    },
    {
      language: 'nodejs',
      display: 'JavaScript (Node.js)',
      version: '17.1.0',
      versionIndex: '4',
      slugs: ['js', 'javascript'],
    },
    {
      language: 'php',
      display: 'PHP ',
      version: '8.0.13',
      versionIndex: '4',
      slugs: ['php'],
    },
    {
      language: 'python3',
      display: 'Python',
      version: '3.9.9',
      versionIndex: '4',
      slugs: ['py', 'python'],
    },
  ] as CodeLanguageResult[],
  maintainers: [`Elliot Maisl (${userMention('188341077902753794')})`],
  thanks: [`Kétessar Tan (${userMention('222050512684580876')}) : contributions`],
} as const;

import type { ColorResolvable } from 'discord.js';
import type { CodeLanguageResult } from '@/types';

export default {
  prefix: '!',
  colors: {
    primary: '#5bb78f' as ColorResolvable,
    default: '#439bf2' as ColorResolvable,
    white: '#ffffff' as ColorResolvable,
    green: '#32a852' as ColorResolvable,
    yellow: '#e0c748' as ColorResolvable,
    orange: '#f27938' as ColorResolvable,
    red: '#eb2d1c' as ColorResolvable,
    gray: '#4f4f4f' as ColorResolvable,
  },
  configuration: {
    stop: new Set(['stop', 'cancel', 'retour']),
    booleanTruths: ['oui', 'o', 'yes', 'y', 'vrai', 'v', 'true', 't'],
    booleanFalses: ['non', 'no', 'n', 'faux', 'f', 'false'],
    enableCompilerApi: true,
    roleIntersectionExpiration: 2 * 24 * 60 * 60 * 1000, // 2 days
    flagMessageReaction: '🚩',
    flagNeededAnswer: '📝',
    dateFormat: 'DD/MM [à] HH:mm',
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
    remove: '🗑️',
  },
  languages: [
    {
      language: 'bash',
      slugs: ['bash', 'sh'],
      display: 'Bash',
      version: '5.0.011',
      versionIndex: '3',
    },
    {
      language: 'c',
      slugs: ['c', 'clang'],
      display: 'C',
      version: 'GCC 9.1.0',
      versionIndex: '4',
    },
    {
      language: 'c99',
      slugs: ['c99'],
      display: 'C99',
      version: 'GCC 9.1.0',
      versionIndex: '3',
    },
    {
      language: 'cpp',
      slugs: ['cpp', 'c++', 'hpp', 'h', 'h++'],
      display: 'C++',
      version: 'GCC 9.1.0',
      versionIndex: '4',
    },
    {
      language: 'cpp14',
      slugs: ['cpp14', 'c++14', 'hpp14', 'h14', 'h++14'],
      display: 'C++14',
      version: 'g++ 14 GCC 9.1.0',
      versionIndex: '3',
    },
    {
      language: 'cpp17',
      slugs: ['cpp17', 'c++17', 'hpp17', 'h17', 'h++17'],
      display: 'C++17',
      version: 'g++ 17 GCC 9.10',
      versionIndex: '0',
    },
    {
      language: 'java',
      slugs: ['java'],
      display: 'Java',
      version: 'JDK 11.0.4',
      versionIndex: '3',
    },
    {
      language: 'nodejs',
      slugs: ['nodejs', 'js', 'javascript', 'node'],
      display: 'JavaScript (Node.js)',
      version: '12.11.1',
      versionIndex: '3',
    },
    {
      language: 'php',
      slugs: ['php'],
      display: 'PHP ',
      version: '7.3.10',
      versionIndex: '3',
    },
    {
      language: 'python2',
      slugs: ['python2', 'py2'],
      display: 'Python 2',
      version: '2.7.16',
      versionIndex: '2',
    },
    {
      language: 'python3',
      slugs: ['python3', 'py3', 'python', 'py'],
      display: 'Python 3',
      version: '3.7.4',
      versionIndex: '3',
    },
  ] as CodeLanguageResult[],
  maintainers: ['Elliot Maisl (<@188341077902753794>)'],
  thanks: ['Kétessar Tan (<@222050512684580876>) : contributions'],
};

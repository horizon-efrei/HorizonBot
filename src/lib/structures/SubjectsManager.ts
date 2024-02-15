import { container } from '@sapphire/framework';
import { JWT } from 'google-auth-library';
import type { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as nodeEmoji from 'node-emoji';
import { SchoolYear, TeachingUnit } from '../types';
import type { SubjectEntry } from '../types/database';

export enum ValidationError {
  DuplicatedIdentifier = 'duplicated-identifier',
  InvalidEmoji = 'invalid-emoji',
  DuplicatedClassCode = 'duplicated-class-code',
  InvalidTeachingUnit = 'invalid-teaching-unit',
  InvalidSchoolYear = 'invalid-school-year',
  InvalidGuild = 'invalid-guild',
  InvalidTextChannel = 'invalid-text-channel',
  InvalidTextDocsChannel = 'invalid-text-docs-channel',
  InvalidTextVoiceChannel = 'invalid-text-voice-channel',
}

interface ValidationErrorData {
  row: number;
  error: ValidationError;
}

interface RawSubjectRow {
  id: string;
  active: 'FALSE' | 'TRUE';
  name: string;
  emoji: string;
  classCode: string;
  teachingUnit: TeachingUnit;
  schoolYear: SchoolYear;
  guildId: string;
  textChannelId: string;
  textDocsChannelId: string;
  voiceChannelId: string;
}

export class SubjectsManager {
  private readonly _doc: GoogleSpreadsheet;
  private _sheet: GoogleSpreadsheetWorksheet;
  private _rawRows: Array<GoogleSpreadsheetRow<RawSubjectRow>> = [];
  private _rows: SubjectEntry[] = [];

  constructor(sheetId: string) {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEET_SVC_EMAIL!,
      key: process.env.GOOGLE_SHEET_SVC_PRIVATE_KEY!,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this._doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
  }

  public async fetchRemoteRows(): Promise<Array<GoogleSpreadsheetRow<RawSubjectRow>>> {
    await this._sheet.loadHeaderRow(3);
    return await this._sheet.getRows<RawSubjectRow>();
  }

  public async getRemoteRows(): Promise<SubjectEntry[]> {
    await this._sheet.loadHeaderRow(3);
    const rows = await this._sheet.getRows<RawSubjectRow>();
    return rows.map(this._parseRow);
  }

  public async refresh(): Promise<void> {
    await this._doc.loadInfo();
    this._sheet = this._doc.sheetsByIndex[0];
    this._rawRows = await this.fetchRemoteRows();
    this._rows = this._rawRows.map(this._parseRow);

    container.logger.info('[Subjects] Subjects sheet has been refreshed.');
  }

  public async validate(): Promise<ValidationErrorData[]> {
    const allRows = await this.fetchRemoteRows();
    const rows = allRows.map(row => ({ ...this._parseRow(row), _number: row.rowNumber })).filter(row => row.active);

    const errors: ValidationErrorData[] = [];

    for (const row of rows) {
      // 1. Check that the identifier is unique
      if (rows.filter(r => r.id === row.id).length > 1)
        errors.push({ row: row._number, error: ValidationError.DuplicatedIdentifier });

      // 2. Check that the emoji are valid
      if (!nodeEmoji.has(row.emoji))
        errors.push({ row: row._number, error: ValidationError.InvalidEmoji });

      // 3. Check that the class code is unique
      if (rows.filter(r => r.classCode === row.classCode).length > 1)
        errors.push({ row: row._number, error: ValidationError.DuplicatedClassCode });

      // 4. Check that the teaching unit is valid (enum value)
      if (!Object.values(TeachingUnit).includes(row.teachingUnit))
        errors.push({ row: row._number, error: ValidationError.InvalidTeachingUnit });

      // 5. Check that the school year is valid (enum value)
      if (!Object.values(SchoolYear).includes(row.schoolYear))
        errors.push({ row: row._number, error: ValidationError.InvalidSchoolYear });

      // 6. Check that the guild ID is valid
      const guild = container.client.guilds.cache.get(row.guildId);
      if (guild) {
        // 7. Check that all channel IDs are valid
        if (!row.textChannelId || !guild.channels.cache.has(row.textChannelId))
          errors.push({ row: row._number, error: ValidationError.InvalidTextChannel });

        if (row.textDocsChannelId && !guild.channels.cache.has(row.textDocsChannelId))
          errors.push({ row: row._number, error: ValidationError.InvalidTextDocsChannel });

        if (!row.voiceChannelId || !guild.channels.cache.has(row.voiceChannelId))
          errors.push({ row: row._number, error: ValidationError.InvalidTextVoiceChannel });
      } else {
        errors.push({ row: row._number, error: ValidationError.InvalidGuild });
      }
    }

    return errors;
  }

  public getByClassCode(classCode: string): SubjectEntry | undefined {
    return this._rows.find(row => row.classCode === classCode);
  }

  public getById(id: string): SubjectEntry | undefined {
    return this._rows.find(row => row.id === id);
  }

  public get rows(): SubjectEntry[] {
    return this._rows;
  }

  private _parseRow(this: void, row: GoogleSpreadsheetRow<RawSubjectRow>): SubjectEntry {
    return {
      ...row.toObject() as RawSubjectRow,
      active: row.get('active') === 'TRUE',
    };
  }
}

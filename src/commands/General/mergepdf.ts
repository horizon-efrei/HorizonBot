import {
 constants, promises,
} from 'fs';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions, UserError } from '@sapphire/framework';
import type { MessageManager } from 'discord.js';
import PdfMerger from 'pdf-merger-js';
import pupa from 'pupa';
import { mergePDF as config } from '@/config/commands/general';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class PdfMergeCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    // Argument dans l'ordre croissant

    const msgIds: string[] = [];
    while (!args.finished) {
        const msgId = await args.pickResult('string');
        if (msgId.success) {
            msgIds.push(msgId.value);
        } else {
            const { parameter } = (config.messages.no_PDF_Found as UserError & { parameter: string });
            await message.channel.send(pupa('{pdf_error}', { pdf_error: parameter }));
            return;
        }
    }

    const merger = new PdfMerger();

    for (const o of msgIds) {
        const msg = message.channel.messages.cache.get(o);
        for (let a of msg.attachments.values())
        {
            merger.add(a.proxyURL);
        }
    }

    const pdfBuffer = await merger.saveAsBuffer();

    await message.channel.send({
        files: [{
            attachment: pdfBuffer,
            name: 'merged.pdf',
        }],
    });

  }
}

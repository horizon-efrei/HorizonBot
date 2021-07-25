import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions, Result, UserError } from '@sapphire/framework';
import PdfMerger from 'pdf-merger-js';
import { mergePDF as config } from '@/config/commands/general';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';
import { Message } from 'discord.js';

@ApplyOptions<CommandOptions>(config.options)
export default class PdfMergeCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    // Argument dans l'ordre croissant
    const result : Result<Message[], UserError> = await args.repeatResult('message');

    let msgs : Message[] = [];

    if (result.success) 
        msgs = result.value;
    else
        message.channel.send("Erreur fichiers !")

    const merger = new PdfMerger();

    for (const o of msgs) {
        for (const a of o.attachments.values()) {
            if (a.name.endsWith('.pdf'))
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

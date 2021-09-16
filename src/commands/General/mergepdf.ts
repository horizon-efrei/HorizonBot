import { promises as fs } from 'fs';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import envPaths from 'env-paths';
import PdfMerger from 'pdf-merger-js';
import { mergePDF as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class PdfMergeCommand extends HorizonCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    // Argument dans l'ordre croissant
    const result = await args.repeatResult('message');

    if (!result.success) {
        await message.channel.send(config.messages.noPdfFound);
        return;
    }
    const merger = new PdfMerger();

    const tmpFolder = envPaths('horizonbot').temp;

    for (const msg of result.value) {
        for (const file of msg.attachments.values()) {
            if (file.name.endsWith('.pdf'))
                // Writing the pdf in tmp folder
                await fs.writeFile(tmpFolder, file.url);
                // Add the file into the PdfMerger
                merger.add(`${tmpFolder}/${file.name}`);
                // Deleting the file
                await fs.unlink(`${tmpFolder}/${file.name}`);
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

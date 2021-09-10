import { ApplyOptions } from '@sapphire/decorators';
import type {
 Args, CommandOptions,
} from '@sapphire/framework';
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

    for (const msg of result.value) {
        for (const fichier of msg.attachments.values()) {
            if (fichier.name.endsWith('.pdf'))
                merger.add(fichier.proxyURL);
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

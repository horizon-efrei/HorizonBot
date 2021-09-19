import path from 'path';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import axios from 'axios';
import PDFMerger from 'pdf-merger-js';
import { mergePDF as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class PDFMergeCommand extends HorizonCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const result = await args.repeatResult('message');

    // If no message are given or they don't have any attachments AND no attachments were given in the command's
    // message then we stop here as no PDFs were given at all.
    if ((!result.success || result.value.every(msg => msg.attachments.size === 0)) && message.attachments.size === 0) {
      await message.channel.send(config.messages.noPDFGiven);
      return;
    }

    const merger = new PDFMerger();

    const allFiles = [
      ...message.attachments.values(),
      result.value
        ?.flatMap(msg => [...msg.attachments.values()])
        .filter(file => path.extname(file.name) === '.pdf'),
    ].filter(Boolean).flat();

    if (allFiles.length < 2) {
      await message.channel.send(config.messages.notEnoughFiles);
      return;
    }

    for (const file of allFiles) {
      const { data: buffer } = await axios.get(file.url, { responseType: 'arraybuffer' });
      merger.add(buffer);
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

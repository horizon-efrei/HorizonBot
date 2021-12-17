import path from 'node:path';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import axios from 'axios';
import type { Message } from 'discord.js';
import PDFMerger from 'pdf-merger-js';
import { mergePDF as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';

@ApplyOptions<CommandOptions>({
  ...config.options,
  options: ['name'],
})
export default class PDFMergeCommand extends HorizonCommand {
  public async messageRun(message: Message, args: Args): Promise<void> {
    await message.channel.sendTyping();

    const result = await args.repeatResult('message');

    let name = args.getOption('name');
    if (name?.endsWith('.pdf'))
      name = name.slice(0, -4);
    name = name?.replace(/^\.*/, '');
    name ||= 'merged';

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
      merger.add(buffer as Buffer);
    }

    const pdfBuffer = await merger.saveAsBuffer();

    await message.channel.send({
      files: [{
        attachment: pdfBuffer,
        name: `${name}.pdf`,
      }],
    });
  }
}

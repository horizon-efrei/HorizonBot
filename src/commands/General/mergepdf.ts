import fs from 'fs';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions, UserError } from '@sapphire/framework';
import type { MessageManager } from 'discord.js';
import * as PdfMerger from 'pdf-merger-js';
import pupa from 'pupa';
import { ping as config } from '@/config/commands/general';
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
            const { parameter } = (msgId.error as UserError & { parameter: string });
            await message.channel.send(pupa('Le pdf situé au message {id} est introuvable !', { id: parameter }));
            return;
        }
    }

    const merger = new PdfMerger();
    const msgManager: MessageManager = message.channel.messages;
    var dir = '@/app/tmp';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    for (const o of msgIds) {
        const msg = msgManager.cache.get(o);
        merger.add(msg.attachments.first().name);
    }

    await merger.save('@/app/tmp/merged.pdf')

    await message.channel.send({
        files: [{
            attachment: '@/app/tmp/merged.pdf',
            name: 'merged.pdf',
        }],
    });

    fs.rmdirSync(dir, { recursive: true });

  }
}

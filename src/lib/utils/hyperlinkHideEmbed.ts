import { hideLinkEmbed, hyperlink } from 'discord.js';

export function hyperlinkHideEmbed<Content extends string, Url extends string>(content: Content, url: Url): `[${Content}](<${Url}>)` {
  return hyperlink(content, hideLinkEmbed(url));
}

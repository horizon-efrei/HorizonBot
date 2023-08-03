import { marked } from 'marked';

interface CodeToken {
  type: 'code';
  raw: string;
  codeBlockStyle?: 'indented' | undefined;
  lang?: string | undefined;
  text: string;
}

/**
 * Extracts all code blocks from a markdown string
 * @param source The Markdown text to analyse
 * @returns The codes found in the Markdown text
 */
export function extractCodeBlocks(source: string): Array<{ text: string; lang?: string | undefined }> {
  return marked.lexer(source.replaceAll('```', '\n```'))
    .filter((token): token is CodeToken => token.type === 'code')
    .map(token => ({ text: token.text, lang: token.lang }));
}

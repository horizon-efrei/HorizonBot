import { inlineArrayTransformer, TemplateTag } from 'common-tags';

/**
 * Makes a list that finishes with "et", from a list of string.
 * @param text The strings to make a list from
 * @returns The string list
 */
const commaListAnd = new TemplateTag(inlineArrayTransformer({ separator: ',', conjunction: 'et' }));

export default commaListAnd;

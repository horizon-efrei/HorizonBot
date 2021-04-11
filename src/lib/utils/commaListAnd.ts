import { inlineArrayTransformer, TemplateTag } from 'common-tags';

const commaListAnd = new TemplateTag(inlineArrayTransformer({ separator: ',', conjunction: 'et' }));

export default commaListAnd;

declare namespace NodeJS {
  interface ProcessEnv {
    /* eslint-disable @typescript-eslint/naming-convention */
    NODE_ENV: string;

    DISCORD_TOKEN: string;
    SENTRY_TOKEN: string;
    COMPILERAPI_ID: string;
    COMPILERAPI_SECRET: string;

    MONGO_URI: string;
    ECLASS_DRIVE_URL: string;
    ECLASS_DRIVE_TUTORIAL_URL: string;
    /* eslint-enable @typescript-eslint/naming-convention */
  }
}

declare namespace Intl {
  interface ListFormatOptions {
    localeMatcher: 'best fit' | 'lookup';
    type: 'conjunction' | 'disjunction' | 'unit';
    style: 'long' | 'narrow' | 'short';
  }

  class ListFormat {
    constructor(lang: string, options: Partial<ListFormatOptions>);
    public format(items: Iterable<string>): string;
  }
}

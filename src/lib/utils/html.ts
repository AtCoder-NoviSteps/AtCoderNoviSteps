import { type IFilterXSSOptions, FilterXSS } from 'xss';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

const DEFAULT_WHITE_LIST = {
  a: ['href'] as string[],
  b: [] as string[],
  em: [] as string[],
  i: [] as string[],
  strong: [] as string[],
};

const defaultXSS = new FilterXSS({
  whiteList: { ...DEFAULT_WHITE_LIST },
  onTagAttr: function (tag, name, value) {
    if (tag === 'a' && name === 'href') {
      try {
        const url = new URL(value);
        const allowedProtocols = ['http:', 'https:', 'mailto:'];

        if (allowedProtocols.includes(url.protocol)) {
          return `${name}="${value}"`;
        }
      } catch {
        console.error(`Invalid URL format in href attribute`, {
          tag,
          sanitized: true,
        });
      }

      return '';
    }
  },
});

export function sanitizeHTML(html: string, options?: SanitizeOptions): string {
  if (typeof html !== 'string') {
    throw new TypeError('Input expects to be a string');
  }

  try {
    if (!options) {
      return defaultXSS.process(html);
    }

    const defaultOptions: IFilterXSSOptions = {
      whiteList: { ...DEFAULT_WHITE_LIST },
    };

    if (options.allowedTags) {
      defaultOptions.whiteList = options.allowedTags.reduce<Record<string, string[]>>(
        (array, tag) => {
          array[tag] = defaultOptions.whiteList?.[tag] ?? [];
          return array;
        },
        {},
      );
    }

    if (options.allowedAttributes) {
      Object.keys(options.allowedAttributes).forEach((tag) => {
        if (defaultOptions.whiteList) {
          defaultOptions.whiteList[tag] = options.allowedAttributes
            ? options.allowedAttributes[tag]
            : [];
        }
      });
    }

    const customXSS = new FilterXSS(defaultOptions);

    return customXSS.process(html);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to sanitize HTML:', {
      error: errorMessage,
      cause: 'sanitizeHTML',
    });

    throw new Error(`HTML sanitization failed: ${errorMessage}`);
  }
}

import { type IFilterXSSOptions, FilterXSS } from 'xss';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

const defaultXSS = new FilterXSS({
  whiteList: {
    a: ['href'],
    b: [],
    em: [],
    i: [],
    strong: [],
  },
});

export function sanitizeHTML(html: string, options?: SanitizeOptions): string {
  if (!options) {
    return defaultXSS.process(html);
  }

  const defaultOptions: IFilterXSSOptions = {
    whiteList: {
      a: ['href'],
      b: [],
      em: [],
      i: [],
      strong: [],
    },
  };

  if (options.allowedTags) {
    defaultOptions.whiteList = options.allowedTags.reduce(
      (array, tag) => {
        array[tag] = (defaultOptions.whiteList && defaultOptions.whiteList[tag]) || [];
        return array;
      },
      {} as { [key: string]: string[] },
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
}

import { type IFilterXSSOptions, FilterXSS } from 'xss';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

export function sanitizeHTML(html: string, options?: SanitizeOptions): string {
  const defaultOptions: IFilterXSSOptions = {
    whiteList: {
      a: ['href'],
      b: [],
      em: [],
      i: [],
      strong: [],
    },
  };

  if (options?.allowedTags) {
    defaultOptions.whiteList = options.allowedTags.reduce(
      (array, tag) => {
        array[tag] = (defaultOptions.whiteList && defaultOptions.whiteList[tag]) || [];
        return array;
      },
      {} as { [key: string]: string[] },
    );
  }

  if (options?.allowedAttributes) {
    Object.keys(options.allowedAttributes).forEach((tag) => {
      if (defaultOptions.whiteList && options.allowedAttributes) {
        defaultOptions.whiteList[tag] = options.allowedAttributes[tag];
      }
    });
  }

  const customXSS = new FilterXSS(defaultOptions);

  return customXSS.process(html);
}

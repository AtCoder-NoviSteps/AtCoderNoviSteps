import type { MetaTagsProps } from 'svelte-meta-tags';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from '$lib/constants/product-info';

// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { Roles } from '$lib/types/user';

// TODO: SNS用のサムネイルを追加
const getBaseMetaTags = (url: URL) => {
  const title: string = PRODUCT_NAME;
  const description: string = PRODUCT_DESCRIPTION;
  const imageUrl: string = '';
  const imageAlt: string = PRODUCT_NAME;

  const baseMetaTags = Object.freeze({
    title: title,
    description: description,
    canonical: new URL(url.pathname, url.origin).href,
    openGraph: {
      type: 'website',
      url: new URL(url.pathname, url.origin).href,
      locale: 'ja_JP',
      title: title,
      description: description,
      siteName: PRODUCT_NAME,
      images: [
        {
          url: imageUrl,
          alt: imageAlt,
          width: 800,
          height: 600,
          secureUrl: imageUrl,
          type: 'image/jpeg',
        },
      ],
    },
  }) satisfies MetaTagsProps;

  return baseMetaTags;
};

export const load = async ({ locals, url }) => {
  const session = await locals.auth.validate();
  const user = locals.user;
  const baseMetaTags = getBaseMetaTags(url);

  return {
    isAdmin: session?.user.role === Roles.ADMIN,
    user: user,
    baseMetaTags: baseMetaTags,
  };
};

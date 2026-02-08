# パフォーマンス・SEO最適化ガイド

## 概要

AtCoder-NoviStepsのパフォーマンス向上とSEO対策の包括的戦略

## パフォーマンス最適化

### Core Web Vitals目標

| 指標                           | 目標値  | 測定方法                       |
| ------------------------------ | ------- | ------------------------------ |
| LCP (Largest Contentful Paint) | < 2.5秒 | Lighthouse, PageSpeed Insights |
| FID (First Input Delay)        | < 100ms | Real User Monitoring           |
| CLS (Cumulative Layout Shift)  | < 0.1   | Lighthouse                     |
| TTFB (Time to First Byte)      | < 800ms | WebPageTest                    |

### SvelteKit最適化設定

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs18.x',
      regions: ['nrt1'], // 東京リージョン（日本ユーザー向け）
      split: true, // ルート別コード分割
    }),
    prerender: {
      entries: [
        '*',
        '/sitemap.xml',
        '/robots.txt',
        '/problems', // 静的プリレンダリング
        '/contests',
      ],
      handleHttpError: 'warn',
      handleMissingId: 'warn',
    },
    csp: {
      mode: 'auto',
      directives: {
        'script-src': ['self', 'unsafe-inline', 'https://www.googletagmanager.com'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'https:'],
        'font-src': ['self'],
      },
    },
  },
};

export default config;
```

### 画像最適化

```typescript
// lib/utils/imageOptimization.ts
export function getOptimizedImageUrl(
  src: string,
  width: number,
  height?: number,
  format: 'webp' | 'avif' | 'jpg' = 'webp',
): string {
  // Vercel Image Optimization活用
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: '75', // 品質75%
    fm: format,
  });

  if (height) {
    params.set('h', height.toString());
  }

  return `/_vercel/image?${params.toString()}`;
}

// コンポーネントでの使用例
export function createPictureElement(
  src: string,
  alt: string,
  sizes: number[],
): HTMLPictureElement {
  const picture = document.createElement('picture');

  // WebP対応ブラウザ向け
  const webpSource = document.createElement('source');
  webpSource.type = 'image/webp';
  webpSource.srcset = sizes
    .map((size) => `${getOptimizedImageUrl(src, size, undefined, 'webp')} ${size}w`)
    .join(', ');

  // フォールバック
  const img = document.createElement('img');
  img.src = getOptimizedImageUrl(src, sizes[0]);
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';

  picture.appendChild(webpSource);
  picture.appendChild(img);

  return picture;
}
```

### データベース最適化

```typescript
// lib/server/repositories/optimized/ProblemRepository.ts
import { PrismaClient } from '@prisma/client';

export class OptimizedProblemRepository {
  constructor(private prisma: PrismaClient) {}

  // インデックス活用クエリ
  async findProblemsByDifficulty(
    minDifficulty: number,
    maxDifficulty: number,
    limit: number = 50,
    offset: number = 0,
  ) {
    return await this.prisma.task.findMany({
      where: {
        atcoder_problems_difficulty: {
          not: 'PENDING',
        },
        // 難易度範囲での検索（インデックス必要）
        atcoder_problems_difficulty_value: {
          gte: minDifficulty,
          lte: maxDifficulty,
        },
      },
      select: {
        // 必要フィールドのみ選択
        task_id: true,
        title: true,
        contest_id: true,
        contest_type: true,
        atcoder_problems_difficulty: true,
      },
      orderBy: {
        atcoder_problems_difficulty_value: 'asc',
      },
      take: limit,
      skip: offset,
    });
  }

  // N+1問題解決（Prisma include）
  async findProblemsWithTagsAndAnswers(userId: string) {
    return await this.prisma.task.findMany({
      include: {
        tags: {
          include: {
            tag: {
              select: { name: true, is_official: true },
            },
          },
        },
        task_answers: {
          where: { user_id: userId },
          include: {
            status: {
              select: { status_name: true, is_AC: true },
            },
          },
        },
      },
    });
  }
}
```

### キャッシュ戦略

```typescript
// lib/server/cache/CacheManager.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // プロブレム一覧のキャッシュ例
  async getCachedProblems(cacheKey: string, fetcher: () => Promise<Problem[]>): Promise<Problem[]> {
    let problems = this.get<Problem[]>(cacheKey);

    if (!problems) {
      problems = await fetcher();
      this.set(cacheKey, problems, 1800); // 30分キャッシュ
    }

    return problems;
  }
}

// 使用例
const cacheManager = new CacheManager();

export async function getCachedProblemsByDifficulty(
  minDiff: number,
  maxDiff: number,
): Promise<Problem[]> {
  const cacheKey = `problems:difficulty:${minDiff}-${maxDiff}`;

  return await cacheManager.getCachedProblems(cacheKey, async () => {
    return await problemRepository.findProblemsByDifficulty(minDiff, maxDiff);
  });
}
```

## SEO対策

### メタタグ管理（svelte-meta-tags）

```typescript
// src/routes/+layout.svelte
<script lang="ts">
  import { MetaTags } from 'svelte-meta-tags';
  import { page } from '$app/stores';

  const defaultMetaTags = {
    title: 'AtCoder NoviSteps - AtCoder初心者向け学習プラットフォーム',
    description: 'AtCoderの問題を体系的に学習できるプラットフォーム。レーティング別の問題集、解法解説、進捗管理機能を提供します。',
    canonical: 'https://atcoder-novisteps.vercel.app',
    openGraph: {
      type: 'website',
      url: 'https://atcoder-novisteps.vercel.app',
      title: 'AtCoder NoviSteps',
      description: 'AtCoder初心者向け学習プラットフォーム',
      images: [
        {
          url: 'https://atcoder-novisteps.vercel.app/og-image.png',
          width: 1200,
          height: 630,
          alt: 'AtCoder NoviSteps'
        }
      ],
      siteName: 'AtCoder NoviSteps'
    },
    twitter: {
      handle: '@AtCoderNoviSteps',
      site: '@AtCoderNoviSteps',
      cardType: 'summary_large_image'
    },
    additionalLinkTags: [
      {
        rel: 'icon',
        href: '/favicon.ico'
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png'
      }
    ]
  };
</script>

<MetaTags {...defaultMetaTags} />
```

### 構造化データ

```typescript
// lib/seo/structuredData.ts
export function createProblemStructuredData(problem: Problem) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: problem.title,
    description: `AtCoder ${problem.contest_id} ${problem.task_table_index}問題`,
    url: `https://atcoder-novisteps.vercel.app/problems/${problem.task_id}`,
    learningResourceType: 'Problem',
    educationalLevel: getDifficultyLevel(problem.atcoder_problems_difficulty),
    about: {
      '@type': 'Thing',
      name: 'プログラミング競技',
      sameAs: 'https://ja.wikipedia.org/wiki/プログラミングコンテスト',
    },
    provider: {
      '@type': 'Organization',
      name: 'AtCoder NoviSteps',
      url: 'https://atcoder-novisteps.vercel.app',
    },
  };
}

export function createWorkbookStructuredData(workbook: WorkBook) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: workbook.title,
    description: workbook.description,
    url: `https://atcoder-novisteps.vercel.app/workbooks/${workbook.urlSlug}`,
    courseCode: workbook.urlSlug,
    educationalCredentialAwarded: 'Certificate of Completion',
    provider: {
      '@type': 'Organization',
      name: 'AtCoder NoviSteps',
    },
  };
}
```

### サイトマップ生成（super-sitemap）

```typescript
// src/routes/sitemap.xml/+server.ts
import { createSitemap } from 'super-sitemap';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  // 静的ページ
  const staticPages = [
    '',
    'problems',
    'workbooks',
    'about',
    'privacy',
    'terms'
  ];

  // 動的ページ（問題詳細）
  const problems = await prisma.task.findMany({
    select: {
      task_id: true,
      updated_at: true
    },
    where: {
      atcoder_problems_difficulty: { not:
```

import { default as db } from '$lib/server/database';
import type { Tag } from '$lib/types/tag';

// See:
// https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
export async function getTags(): Promise<Tag[]> {
  const tags = await db.tag.findMany({ orderBy: { id: 'desc' } });

  return tags;
}

export async function getTag(tag_id: string): Promise<Tag[]> {
  //本当はfindUniqueで取得したいがうまくいかない
  const tag = await db.tag.findMany({
    where: {
      id: tag_id,
    },
  });
  console.log(tag);

  return tag;
}

export async function getTagByName(name: string): Promise<Tag[]> {
  //本当はfindUniqueで取得したいがうまくいかない
  const tags = await db.tag.findMany({
    where: {
      name: name,
    },
  });
  console.log(tags);

  return tags;
}

export async function createTag(
  id: string,
  name: string,
  is_official: boolean,
  is_published: boolean,
) {
  const tag = await db.tag.create({
    data: {
      id: id,
      name: name,
      is_official: is_official,
      is_published: is_published,
    },
  });

  console.log(tag);
}
export async function updateTag(
  tag_id: string,
  name: string,
  is_official: boolean,
  is_published: boolean,
) {
  const tag = await db.tag.update({
    where: { id: tag_id },
    data: {
      id: tag_id,
      name: name,
      is_official: is_official,
      is_published: is_published,
    },
  });

  console.log(tag);
}

// TODO: deleteTag()

// Note:
// Uncomment only when executing the following commands directly from the script.
//
// pnpm dlx vite-node ./prisma/tags.ts
//
//
// async function main() {
//   const tags = getTags();
//   console.log(tags);

//   const tag_id = 'abc322_e';
//   const tag = getTag(tag_id);
//   console.log(tag);

//   // updateTag(tag_id, TagGrade.Q1);
//   // console.log(tag);
// }

// main()
//   .catch(async (e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await db.$disconnect();
//   });

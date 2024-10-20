// https://zod.dev/?id=basic-usage
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes
// https://regex101.com/
// https://qiita.com/mpyw/items/886218e7b418dfed254b
import { z } from 'zod';
import { WorkBookType } from '$lib/types/workbook';
import { isValidUrl } from '$lib/utils/url';

const INPUT_AT_LEAST_3_CHARACTERS = '3文字以上入力してください';
const DELETE_UNTIL_24_CHARACTERS_ARE_LEFT = '24文字になるまで削除してください';
const ONLY_SINGLE_BYTE_ALPHANUMERIC_CHARACTERS_AND_ = '半角英数字と_のみを利用してください';

export const authSchema = z.object({
  username: z
    .string()
    .min(3, { message: INPUT_AT_LEAST_3_CHARACTERS })
    .max(24, { message: DELETE_UNTIL_24_CHARACTERS_ARE_LEFT })
    .regex(/^[\w]*$/, { message: ONLY_SINGLE_BYTE_ALPHANUMERIC_CHARACTERS_AND_ }),
  password: z
    .string()
    .min(8, { message: '8文字以上入力してください' })
    .max(128, { message: '128文字になるまで削除してください' })
    .regex(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)[a-zA-Z\d]{8,128}$/, {
      message: '半角英文字(小・大)・数字をそれぞれ1文字以上含めてください',
    }),
});

export const accountSchema = z
  .string()
  .min(3, { message: INPUT_AT_LEAST_3_CHARACTERS })
  .max(24, { message: DELETE_UNTIL_24_CHARACTERS_ARE_LEFT })
  .regex(/^[\w]*$/, { message: ONLY_SINGLE_BYTE_ALPHANUMERIC_CHARACTERS_AND_ });

export const accountTransferSchema = z
  .object({
    sourceUserName: accountSchema,
    destinationUserName: accountSchema,
  })
  .refine((data) => data.sourceUserName !== data.destinationUserName, {
    message: '新アカウント名は、旧アカウント名とは異なるものを指定してください',
    path: ['destinationUserName'],
  });

const workBookTaskSchema = z.object({
  workBookId: z.number().nonnegative().optional(),
  taskId: z.string(),
  priority: z.number().positive(),
  comment: z
    .string()
    .min(0, { message: '' })
    .max(50, { message: '50文字になるまで削除してください' }), // FIXME: 上限は暫定値。
});

export const workBookSchema = z.object({
  authorId: z.string(),
  title: z
    .string()
    .min(3, { message: '3文字以上入力してください' })
    .max(200, { message: '200文字になるまで削除してください' }),
  description: z
    .string()
    .min(0, { message: '' })
    .max(300, { message: '300文字になるまで削除してください' }),
  editorialUrl: z
    .string()
    .min(0, { message: '' })
    .max(300, { message: '300文字になるまで削除してください' })
    .refine(isValidUrl, { message: 'URLを再入力してください' }), // カリキュラムのトピック解説用のURL。HACK: 「ユーザ作成」の場合も利用できるようにするかは要検討。
  isPublished: z.boolean(),
  isOfficial: z.boolean(),
  isReplenished: z.boolean(), // カリキュラムの【補充】を識別するために使用
  workBookType: z.nativeEnum(WorkBookType),
  workBookTasks: z
    .array(workBookTaskSchema)
    .min(1, { message: '1問以上登録してください' })
    .max(200, { message: '200問以下になるまで削除してください' }),
});

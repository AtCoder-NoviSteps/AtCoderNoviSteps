// https://zod.dev/?id=basic-usage
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes
// https://regex101.com/
// https://qiita.com/mpyw/items/886218e7b418dfed254b
import { z } from 'zod';

const INPUT_AT_LEAST_3_CHARACTERS = '3文字以上入力してください';
const DELETE_UNTIL_24_CHARACTERS_ARE_LEFT = '24文字になるまで削除してください';
const ONLY_SINGLE_BYTE_ALPHANUMERIC_CHARACTERS_AND_ = '半角英数字と_のみを利用してください';

export const authSchema = z.object({
  username: z
    .string()
    .min(3, { error: INPUT_AT_LEAST_3_CHARACTERS })
    .max(24, { error: DELETE_UNTIL_24_CHARACTERS_ARE_LEFT })
    .regex(/^[\w]*$/, { error: ONLY_SINGLE_BYTE_ALPHANUMERIC_CHARACTERS_AND_ }),
  password: z
    .string()
    .min(8, { error: '8文字以上入力してください' })
    .max(128, { error: '128文字になるまで削除してください' })
    .regex(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)[a-zA-Z\d]{8,128}$/, {
      error: '半角英文字(小・大)・数字をそれぞれ1文字以上含めてください',
    }),
});

export const accountSchema = z
  .string()
  .min(3, { error: INPUT_AT_LEAST_3_CHARACTERS })
  .max(24, { error: DELETE_UNTIL_24_CHARACTERS_ARE_LEFT })
  .regex(/^[\w]*$/, { error: ONLY_SINGLE_BYTE_ALPHANUMERIC_CHARACTERS_AND_ });

export const accountTransferSchema = z
  .object({
    sourceUserName: accountSchema,
    destinationUserName: accountSchema,
  })
  .refine((data) => data.sourceUserName !== data.destinationUserName, {
    error: '新アカウント名は、旧アカウント名とは異なるものを指定してください',
    path: ['destinationUserName'],
  });

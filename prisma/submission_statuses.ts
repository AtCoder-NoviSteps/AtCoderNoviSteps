// FIXME: 配色をsrc/lib/services/submission_status.tsに合わせる
// 「挑戦中」と「未挑戦」に関しては、本番DBで既にwa / nsで登録されているので変更しない方がいいかも。
export const submission_statuses = [
  {
    id: '1',
    status_name: 'ac',
    label_name: 'AC',
    image_path: 'ac.png',
    is_AC: true,
    button_color: 'green',
  },
  {
    id: '2',
    status_name: 'ac_with_editorial',
    label_name: '解説AC',
    image_path: 'ac_with_editorial.png',
    is_AC: true,
    button_color: 'blue',
  },
  {
    id: '3',
    status_name: 'wa',
    label_name: '挑戦中',
    image_path: 'wa.png',
    is_AC: false,
    button_color: 'yellow',
  },
  {
    id: '4',
    status_name: 'ns',
    label_name: '未挑戦',
    image_path: 'ns.png',
    is_AC: false,
    button_color: 'light',
  },
];

//import client from '$lib/server/database';

// CI: 提出状況に関するCRUDを実行する部分で原因不明のビルドエラーが発生する
// 現時点での対処方法: 暫定的にベタ打ちの値を使用
export const submission_statuses = [
  {
    id: '1',
    status_name: 'ac',
    label_name: 'AC',
    image_path: 'ac.png',
    is_AC: true,
    text_color: 'text-white', // TODO: Add column and value to schema.
    button_color: 'bg-atcoder-ac-default', // TODO: Update values in prod DB.
    button_color_on_hover: 'hover:bg-atcoder-ac-hover', // TODO: Add column and value to schema.
    background_color: 'bg-atcoder-ac-background', // TODO: Add column and value to schema.
  },
  {
    id: '2',
    status_name: 'ac_with_editorial',
    label_name: '解説AC',
    image_path: 'ac_with_editorial.png',
    is_AC: true,
    text_color: 'text-white', // TODO: Add column and value to schema.
    button_color: 'bg-atcoder-ac-with_editorial-default', // TODO: Update values in prod DB.
    button_color_on_hover: 'hover:bg-atcoder-ac-with_editorial-hover', // TODO: Add column and value to schema.
    background_color: 'bg-atcoder-ac-with_editorial-background', // TODO: Add column and value to schema.
  },
  {
    id: '3',
    status_name: 'wa',
    label_name: '挑戦中',
    image_path: 'wa.png',
    is_AC: false,
    text_color: 'text-white', // TODO: Add column and value to schema.
    button_color: 'bg-atcoder-wa-default', // TODO: Update values in prod DB.
    button_color_on_hover: 'hover:bg-atcoder-wa-hover', // TODO: Add column and value to schema.
    background_color: 'bg-atcoder-wa-background', // TODO: Add column and value to schema.
  },
  {
    id: '4',
    status_name: 'ns',
    label_name: '未挑戦',
    image_path: 'ns.png',
    is_AC: false,
    text_color: 'text-black', // TODO: Add column and value to schema.
    button_color: 'bg-atcoder-ns', // TODO: Update values in prod DB.
    button_color_on_hover: 'hover:bg-gray-100', // TODO: Add column and value to schema.
    background_color: 'bg-atcoder-ns', // TODO: Add column and value to schema.
  },
];

export async function getSubmissionStatusMapWithId() {
  //const defaultStatus = await client.submissionStatus.findMany({ orderBy: { id: 'asc' } });
  const defaultStatus = submission_statuses;
  const statusMap = new Map();

  defaultStatus.map((status) => {
    statusMap.set(status.id, {
      id: status.id,
      status_name: status.status_name,
      label_name: status.label_name,
      image_path: status.image_path,
      is_ac: status.is_AC,
      text_color: status.text_color,
      button_color: status.button_color,
      button_color_on_hover: status.button_color_on_hover,
      background_color: status.background_color,
    });
  });

  return statusMap;
}

export async function getSubmissionStatusMapWithName() {
  //const defaultStatus = await client.submissionStatus.findMany({ orderBy: { id: 'asc' } });
  const defaultStatus = submission_statuses;

  const statusMap = new Map();

  defaultStatus.map((status) => {
    statusMap.set(status.status_name, {
      id: status.id,
      status_name: status.status_name,
      label_name: status.label_name,
      image_path: status.image_path,
      is_ac: status.is_AC,
      text_color: status.text_color,
      button_color: status.button_color,
      button_color_on_hover: status.button_color_on_hover,
      background_color: status.background_color,
    });
  });

  return statusMap;
}

// HACK: 暫定的なメソッドで処理
// 理由: getSubmissionStatusMapWithName()を利用する場合は、async と awaitが必要だが、UIの背景色が変更されない。
// 懸念事項: 将来的には、DBから回答ステータスを取り出すことになる。
//          TaskResultを拡張するのが自然か? (ただし、テーブルが肥大化しすぎるようにも思える)
export const getBackgroundColorFrom = (statusName: string) => {
  const defaultStatus = submission_statuses;
  const submissionStatusByName = new Map();

  defaultStatus.map((status) => {
    submissionStatusByName.set(status.status_name, status);
  });

  const backgroundColor = submissionStatusByName.get(statusName).background_color;
  return backgroundColor;
};

export async function getButtons() {
  const statusMapCommon = await getSubmissionStatusMapWithId();
  //const statusMapCommonUser = getSubmissionStatus(user_id);
  //マージして上書きする？
  //共通のものを使ってstatusを保存した後、オリジナルのステータスを作って保存すると、status_idがかわるから、デフォルトをどう持つか、設計を検討する必要がある

  return Array.from(statusMapCommon.values());
}

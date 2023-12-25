//import client from '$lib/server/database';

export const submission_statuses = [
  {
    id: '1',
    status_name: 'ns',
    label_name: 'No Sub',
    image_path: 'ns.png',
    is_AC: false,
    button_color: 'light',
  },
  {
    id: '2',
    status_name: 'wa',
    label_name: 'WA',
    image_path: 'wa.png',
    is_AC: false,
    button_color: 'yellow',
  },
  {
    id: '3',
    status_name: 'ac',
    label_name: 'AC',
    image_path: 'ac.png',
    is_AC: true,
    button_color: 'green',
  },
];

export async function getSubmissionStatusMapWithId() {
  //const defaultStatus = await client.submissionStatus.findMany({ orderBy: { id: 'asc' } });
  const defaultStatus = submission_statuses;
  const statusMap = new Map();

  defaultStatus.map((status) => {
    //console.log(status)
    statusMap.set(status.id, {
      id: status.id,
      status_name: status.status_name,
      label_name: status.label_name,
      button_color: status.button_color,
      image_path: status.image_path,
      is_ac: status.is_AC,
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
      button_color: status.button_color,
      image_path: status.image_path,
      is_ac: status.is_AC,
    });
  });

  return statusMap;
}

export async function getButtons() {
  const statusMapCommon = await getSubmissionStatusMapWithId();
  //const statusMapCommonUser = getSubmissionStatus(user_id);
  //マージして上書きする？
  //共通のものを使ってstatusを保存した後、オリジナルのステータスを作って保存すると、status_idがかわるから、デフォルトをどう持つか、設計を検討する必要がある

  return Array.from(statusMapCommon.values());
}

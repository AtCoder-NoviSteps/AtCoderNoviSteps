import client from '$lib/server/database';

export async function getSubmissionStatus() {
  const defaultStatus = await client.submissionStatus.findMany({ orderBy: { id: 'asc' } });

  const statusMap = new Map();

  defaultStatus.map((status) => {
    statusMap.set(status.image_path.split('.')[0], {
      id: status.id,
      submission_status: status.image_path.split('.')[0],
      label_name: status.label_name,
      button_color: status.button_color,
      image_path: status.image_path,
    });
  });

  return statusMap;
}

export async function getButtons() {
  const statusMapCommon = await getSubmissionStatus();
  //const statusMapCommonUser = getSubmissionStatus(user_id);
  //マージして上書きする？
  //共通のものを使ってstatusを保存した後、オリジナルのステータスを作って保存すると、status_idがかわるから、デフォルトをどう持つか、設計を検討する必要がある

  return Array.from(statusMapCommon.values());
}

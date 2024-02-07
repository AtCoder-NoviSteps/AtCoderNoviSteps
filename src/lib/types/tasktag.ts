export interface TaskTag {
  tag_id: string;
  task_id: string;
  title: string;
  //priority: int;
}

export type TaskTags = TaskTag[];

export interface ImportTaskTag {
  task_id: string;
  tags: string[];
}

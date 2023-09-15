import { answers } from '$lib/server/sample_data';

// TODO: useIdを動的に変更できるようにする。
export function getAnswers() {
  const answersMap = new Map();

  answers.map((answer) => {
    answersMap.set(answer.task_id, answer);
  });
  return answersMap;
}

// TODO: getAnswer()
// TODO: createAnswer()
// TODO: updateAnswer()
// TODO: deleteAnswer()

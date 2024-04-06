const sampleWorkbook = new Map();

sampleWorkbook.set('1', {
  author: 'novisteps_admin',
  title: '標準入出力',
  isPublished: false,
  tasks: [
    { status_name: 'AC', contest_id: 'ABC222', title: 'A. Four Digits', task_id: 'abc222_a' },
    { status_name: '挑戦中', contest_id: 'ABC180', title: 'A. box', task_id: 'abc180_a' },
    {
      status_name: '未挑戦',
      contest_id: 'ABC169',
      title: 'A. Multiplication 1',
      task_id: 'abc169_a',
    },
  ],
});
sampleWorkbook.set('2', {
  author: 'novisteps_admin',
  title: '1個の整数値を受け取る',
  isPublished: true,
  tasks: [
    { status_name: '挑戦中', contest_id: 'ABC222', title: 'A. Four Digits', task_id: 'abc222_a' },
    { status_name: 'AC', contest_id: 'ABC178', title: 'A. Not', task_id: 'abc178_a' },
    { status_name: '解説AC', contest_id: 'ABC172', title: 'A. Calc', task_id: 'abc172_a' },
  ],
});

// TODO: 一般公開するまでは、管理者のみアクセスできるようにする
// TODO: DBから取得できるようにする
export async function load({ params }) {
  const id = params.slug;

  return { workbook: sampleWorkbook.get(id) };
}

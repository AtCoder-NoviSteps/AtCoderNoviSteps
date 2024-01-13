export function newline(text: string, num: number) {
  const ret: string[] = [];

  for (let i = 0; i < text.length; i += num) {
    ret.push(text.slice(i, i + num));
  }
  return ret;
}

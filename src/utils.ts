import fs from "fs";
import _ from "lodash";

export async function sleep(timeMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

export function mergeJson(data: any, file: string) {
  try {
    const content = fs.readFileSync(file, "utf8");
    _.merge(data, JSON.parse(content));
  } catch (err) {}
}

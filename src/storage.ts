import { get, set } from "idb-keyval";
import { freshState, type State } from "./data";
export const loadState = async (): Promise<State> => {
  const s = await get<State>("roamio-v1");
  return s?.version === 1 ? s : freshState();
};
export const saveState = (s: State) => set("roamio-v1", s);
export async function preparePhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size > 25 * 1024 * 1024) throw new Error("请使用 25MB 以内的照片");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}

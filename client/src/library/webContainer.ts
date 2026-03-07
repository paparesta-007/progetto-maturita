import { WebContainer, type FileSystemTree } from "@webcontainer/api";

let webContainerPromise: Promise<WebContainer> | null = null;

export const getWebContainer = async (): Promise<WebContainer> => {
  if (!webContainerPromise) {
    webContainerPromise = WebContainer.boot();
  }
  return webContainerPromise;
};

export const mountFileTree = async (tree: FileSystemTree): Promise<WebContainer> => {
  const wc = await getWebContainer();
  await wc.mount(tree);
  return wc;
};
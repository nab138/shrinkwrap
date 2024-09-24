import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

export type SaveLoad = [(data: string) => Promise<void>, () => Promise<string>];

export default function useSaveLoad(path: string): SaveLoad {
  let save = useCallback(
    (data: string) => invoke("save_json", { path, data }) as Promise<void>,
    []
  );
  let load = useCallback(
    () => invoke("load_json", { path }) as Promise<string>,
    []
  );
  return [save, load];
}

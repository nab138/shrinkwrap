import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Store } from "@tauri-apps/plugin-store";
import { ToastContextProps, ToastOptions, ToastType } from "react-toast-plus";
import { NT4_Topic } from "../ntcore-react/NT4";
import { platform } from "@tauri-apps/plugin-os";
import { invoke } from "@tauri-apps/api/core";
import { window as tauriWindow } from "@tauri-apps/api";
import { NTClient } from "../ntcore-react/NT4UserFriendly";

export async function importConfig(store: Store | null, addToast: AddToast) {
  if (store == null || addToast == null) return;
  const file = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
    pickerMode: 'document'
  });
  if (file == null) return;
  try {
    const config = await readTextFile(file);
    if (config == null) throw new Error("Failed to read file");
    importConfigFromJson(config, store, addToast);
  } catch (e) {
    console.error(e);
    addToast.error("Failed to import config: " + e);
  }
}

export async function importConfigFromJson(
  config: string,
  store: Store | null,
  addToast: AddToast
) {
  if (store == null || addToast == null) return;
  try {
    const json = JSON.parse(config);
    if (json == null) throw new Error("Failed to parse JSON");
    if (json["isShrinkwrapConfig"] !== true)
      throw new Error("Not a valid ShrinkWrap config");
    await store.clear();
    for (let key in json) {
      await store.set(key, json[key]);
    }
    await store.save();
    window.location.reload();
  } catch (e) {
    console.error(e);
    addToast.error("Failed to import config: " + e);
  }
}

export async function exportConfig(store: Store | null, addToast: AddToast) {
  if (store == null || addToast == null) return;
  const file = await save({
    filters: [{ name: "JSON", extensions: ["json", "txt"] }],
  });
  if (file == null) return;
  try {
    let json: { [key: string]: any } = {};
    const keys = await store.keys();
    for (let key of keys) {
      json[key] = await store.get(key);
    }
    json["isShrinkwrapConfig"] = true;
    await store.save();
    await writeTextFile(file, JSON.stringify(json));
    addToast.success("Exported config to " + file);
  } catch (e) {
    console.error(e);
    addToast.error("Failed to export config: " + e);
  }
}

export async function importLog(client: NTClient | null, addToast: AddToast) {
  if (addToast == null || client == null) return;
  const file = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "WPILib robot log", extensions: ["wpilog"] }],
    pickerMode: 'document'
  });
  if (file == null) return;
  let separator = platform() === "windows" ? "\\" : "/";
  let parts = file.split(separator);
  let load_log_promise = new Promise<void>(async (resolve) => {
    let rawData: Map<string, [any, Object]> = new Map(
      Object.entries((await invoke("open_log", { logPath: file })) as Object)
    );
    // convert rawData into Map<string, Map<number, any>>
    let data: Map<string, Map<number, any>> = new Map();
    let topics: Map<string, NT4_Topic> = new Map();
    for (let [key, value] of rawData) {
      let topic = new NT4_Topic();
      topic.name = key;
      topic.type = value[0];
      topics.set(key, topic);
      let map: Map<number, any> = new Map();
      for (let [timestamp, val] of Object.entries(value[1])) {
        map.set(parseInt(timestamp), val);
      }
      data.set(key, map);
    }

    client.enableLogMode(data, topics);

    await tauriWindow
      .getCurrentWindow()
      .setTitle(`ShrinkWrap - ` + parts[parts.length - 1]);

    resolve();
  });
  addToast.promise(load_log_promise, {
    pending: "Reading " + parts[parts.length - 1],
    success: "Logfile loaded!",
    error: "Failed to load log",
  });
}

type AddToast = {
  (
    content: ToastContextProps["content"],
    type?: ToastType,
    options?: ToastOptions
  ): Pick<ToastContextProps, "id">;
  success: (
    message: ToastContextProps["content"],
    options?: ToastOptions
  ) => Pick<ToastContextProps, "id">;
  error: (
    message: ToastContextProps["content"],
    options?: ToastOptions
  ) => Pick<ToastContextProps, "id">;
  warning: (
    message: ToastContextProps["content"],
    options?: ToastOptions
  ) => Pick<ToastContextProps, "id">;
  info: (
    message: ToastContextProps["content"],
    options?: ToastOptions
  ) => Pick<ToastContextProps, "id">;
  empty: (
    message: ToastContextProps["content"],
    options?: ToastOptions
  ) => Pick<ToastContextProps, "id">;
  loading: (
    message: ToastContextProps["content"],
    options?: ToastOptions
  ) => Pick<ToastContextProps, "id">;
  promise<T>(
    promiseOrFunction: Promise<T> | (() => Promise<T>),
    messages: {
      pending: string;
      success: string | ((data: T) => string);
      error: string | ((err: T) => string);
    },
    options?: Omit<
      ToastOptions,
      "autoClose" | "closeButton" | "draggableClose"
    > & {
      success?: ToastOptions;
      error?: ToastOptions;
    }
  ): {
    id: string;
  };
  custom(
    renderFunction: ToastContextProps["renderCustomToast"],
    options?: ToastOptions
  ): {
    id: string;
  };
};

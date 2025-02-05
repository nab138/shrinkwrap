import React, { useCallback, useContext, useEffect, useRef } from "react";
import { DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig, components } from "../tabsConfig";
import { window as tauriWindow } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import LeftControls from "./LeftControls";
import { StoreContext, useStore } from "../utils/StoreContext";
import useNTConnected from "../ntcore-react/useNTConnected";
import { useToast } from "react-toast-plus";
import { platform } from "@tauri-apps/plugin-os";
import { useUpdate } from "../utils/UpdateContext";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import NTContext from "../ntcore-react/NTContext";

export interface HubProps {
  setIp: (ip: string) => void;
  ip: string;
}

const Hub: React.FC<HubProps> = ({ setIp, ip }) => {
  const [connectionIP] = useStore<string>("connectionIP", "10.30.44.2");
  const [theme] = useStore<string>("theme", "light");
  const [autoUpdate] = useStore<boolean>("autoUpdate", false);
  const connected = useNTConnected();
  const hasConnected = useRef<string | null>(null);
  const { checkForUpdates } = useUpdate();
  const { addToast } = useToast();
  const { store } = useContext(StoreContext);
  const client = useContext(NTContext);

  useEffect(() => {
    if (!autoUpdate) return;
    if (import.meta.env.DEV || platform() === "ios" || platform() === "android")
      return;
    checkForUpdates();
  }, [autoUpdate]);

  useEffect(() => {
    const setupListener = async () => {
      setIp(connectionIP);
      return await listen<boolean>("connect", (event) => {
        if (event.payload) {
          setIp("127.0.0.1");
        } else {
          setIp(connectionIP);
        }
      });
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [connectionIP, setIp]);

  useEffect(() => {
    const setupListener = async () => {
      const unlistenTwo = await listen<boolean>("import_config", async () => {
        if (store == null || addToast == null) return;
        const file = await open({
          multiple: false,
          directory: false,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (file == null) return;
        try {
          const config = await readTextFile(file);
          if (config == null) throw new Error("Failed to read file");
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
      });

      const unlistenThree = await listen<boolean>("export_config", async () => {
        if (store == null || addToast == null) return;
        const file = await save({
          filters: [{ name: "JSON", extensions: ["json"] }],
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
      });

      const unlistenFour = await listen<boolean>("open_log", async () => {
        if (store == null || addToast == null) return;
        const file = await open({
          multiple: false,
          directory: false,
          filters: [{ name: "WPILib robot log", extensions: ["wpilog"] }],
        });
        if (file == null) return;
        let separator = platform() === "windows" ? "\\" : "/";
        let parts = file.split(separator);
        addToast.info("Opening log " + parts[parts.length - 1]);
        await tauriWindow
          .getCurrentWindow()
          .setTitle(`ShrinkWrap - ` + parts[parts.length - 1]);
        let rawData: Map<string, Object> = new Map(
          Object.entries(
            (await invoke("open_log", { logPath: file })) as Object
          )
        );
        // convert rawData into Map<string, Map<number, any>>
        let data: Map<string, Map<number, any>> = new Map();
        for (let [key, value] of rawData) {
          let map: Map<number, any> = new Map();
          for (let [timestamp, val] of Object.entries(value)) {
            map.set(parseInt(timestamp), val);
          }
          data.set(key, map);
        }

        client?.enableLogMode(data);
      });

      return () => {
        unlistenTwo();
        unlistenThree();
        unlistenFour();
      };
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [client, store, addToast]);

  useEffect(() => {
    const renameWindow = async () => {
      await tauriWindow
        .getCurrentWindow()
        .setTitle(
          `ShrinkWrap - ${connected ? "Connected to " + ip : "Disconnected"}`
        );
      if (connected) {
        addToast.success("Connected to " + ip);
        hasConnected.current = ip;
      } else {
        if (hasConnected.current === ip)
          addToast.warning("Disconnected from " + ip);
      }
    };
    renameWindow();
  }, [connected, ip]);

  useEffect(() => {
    document.body.className = `${theme}`;
  }, [theme]);

  const onReady = useCallback(
    async (event: DockviewReadyEvent) => {
      if (store == null) return;
      let openSettingsTab = () => {
        let tab = tabsConfig.find((tab) => tab.id === "settings");
        if (tab == null) return;
        let newId = "settings" + event.api.panels.length;
        event.api
          ?.addPanel({
            id: newId,
            component: "settings",
            params: { id: newId },
          })
          .setTitle(tab.title);
      };
      let layout: string | null | undefined = null;
      let failed: boolean = false;
      try {
        layout = await store.get("layout");
      } catch (e) {
        console.warn("Failed to load saved layout", e);
        openSettingsTab();
        failed = true;
      }
      if (layout !== null && layout !== undefined && !failed) {
        event.api.fromJSON(JSON.parse(layout));
      }
      if (event.api.panels.length === 0) {
        openSettingsTab();
      }

      let unlisten = event.api.onDidLayoutChange(async () => {
        if (event.api.panels.length === 0) {
          openSettingsTab();
          return;
        }
        let json = event.api.toJSON();
        if (json == null) return;
        await store.set("layout", JSON.stringify(json));
        await store.save();
      });
      let unlisten2 = event.api.onDidRemovePanel(async (e) => {
        if (await store.has(e.id)) {
          await store.delete(e.id);
          await store.save();
        }
      });
      return () => {
        unlisten.dispose();
        unlisten2.dispose();
      };
    },
    [store]
  );

  return (
    <div className={`container` + (platform() === "linux" ? " linux" : "")}>
      <DockviewReact
        components={components}
        leftHeaderActionsComponent={LeftControls}
        onReady={onReady}
        className={"dockview-theme-" + theme + " view"}
      />
    </div>
  );
};

export default Hub;

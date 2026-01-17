import React, { useCallback, useContext, useEffect, useRef } from "react";
import { DockviewReact, DockviewReadyEvent, themeDark, themeAbyss, themeLight, themeAbyssSpaced, themeLightSpaced } from "dockview";
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
import NTContext from "../ntcore-react/NTContext";
import useNTWritable from "../ntcore-react/useNTWritable";
import { exportConfig, importConfig, importLog } from "../utils/MenubarCode";

export interface HubProps {
  setIp: (ip: string) => void;
  ip: string;
}

const Hub: React.FC<HubProps> = ({ setIp, ip }) => {
  const [connectionIP] = useStore<string>("connectionIP", "10.30.44.2");
  const [theme] = useStore<string>("theme", "light");
  const [autoUpdate] = useStore<boolean>("autoUpdate", false);
  const connected = useNTConnected();
  const logMode = useNTWritable();
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
    setIp(connectionIP);
  }, [connectionIP, setIp]);

  useEffect(() => {
    const setupListener = async () => {
      return await listen<boolean>("connect", (event) => {
        client?.disableLogMode();
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
  }, [connectionIP, setIp, client]);

  useEffect(() => {
    const setupListener = async () => {
      const unlistenImport = await listen<boolean>(
        "import_config",
        async () => {
          importConfig(store, addToast);
        }
      );

      const unlistenExport = await listen<boolean>(
        "export_config",
        async () => {
          exportConfig(store, addToast);
        }
      );

      const unlistenLog = await listen<boolean>("open_log", async () => {
        importLog(client, addToast);
      });

      return () => {
        unlistenImport();
        unlistenExport();
        unlistenLog();
      };
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [client, store, addToast]);

  useEffect(() => {
    if (logMode) return;
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
  }, [connected, ip, logMode]);

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

  let dockviewTheme;
  switch (theme) {
    case "dark":
      dockviewTheme = themeDark
      break;
    case "light":
      dockviewTheme = themeLight
      break;
    case "abyss":
      dockviewTheme = themeAbyss
      break;
    default:
      dockviewTheme = themeDark;
      break;
  }
  console.log(dockviewTheme);

  return (
    <div className={`container` + (platform() === "linux" ? " linux" : "")}>
      <DockviewReact
        theme={dockviewTheme}
        components={components}
        leftHeaderActionsComponent={LeftControls}
        onReady={onReady}
        className={"view"}
      />
    </div>
  );
};

export default Hub;

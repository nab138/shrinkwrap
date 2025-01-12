import React, { useCallback, useContext, useEffect, useRef } from "react";
import { DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig, components } from "../tabsConfig";
import { window as tauriWindow } from "@tauri-apps/api";
import useSaveLoad from "../utils/saveload";
import { listen } from "@tauri-apps/api/event";
import LeftControls from "./LeftControls";
import { StoreContext, useStore } from "../utils/StoreContext";
import useNTConnected from "../ntcore-react/useNTConnected";
import { useToast } from "react-toast-plus";
import { platform } from "@tauri-apps/plugin-os";
import { useUpdate } from "../utils/UpdateContext";

export interface HubProps {
  setIp: (ip: string) => void;
  ip: string;
}

const Hub: React.FC<HubProps> = ({ setIp, ip }) => {
  const [connectionIP] = useStore<string>("connectionIP", "10.30.44.2");
  const [theme] = useStore<string>("theme", "light");
  const [autoUpdate] = useStore<boolean>("autoUpdate", false);
  const [save, load] = useSaveLoad("shrinkwrap-layout.json");
  const connected = useNTConnected();
  const hasConnected = useRef<string | null>(null);
  const { checkForUpdates } = useUpdate();
  const { addToast } = useToast();
  const { store } = useContext(StoreContext);

  useEffect(() => {
    if (!autoUpdate) return;
    if (import.meta.env.DEV || platform() === "ios" || platform() === "android")
      return;
    checkForUpdates();
  }, [autoUpdate]);

  useEffect(() => {
    const setupListener = async () => {
      setIp(connectionIP);
      const unlisten = await listen<boolean>("connect", (event) => {
        if (event.payload) {
          setIp("127.0.0.1");
        } else {
          setIp(connectionIP);
        }
      });
      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [connectionIP, setIp]);

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
      let layout: string | null = null;
      let failed: boolean = false;
      try {
        layout = await load();
      } catch (e) {
        console.warn("Failed to load saved layout", e);
        openSettingsTab();
        failed = true;
      }
      if (layout != null && !failed) {
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
        await save(JSON.stringify(json));
      });
      let unlisten2 = event.api.onDidRemovePanel(async (e) => {
        if (store?.has(e.id)) {
          await store.delete(e.id);
          await store.save();
        }
      });
      return () => {
        unlisten.dispose();
        unlisten2.dispose();
      };
    },
    [load, save, store]
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

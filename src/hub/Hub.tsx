import React, { useCallback, useEffect, useRef } from "react";
import { DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig, components } from "../tabsConfig";
import { window as tauriWindow } from "@tauri-apps/api";
import useSaveLoad from "../utils/saveload";
import { listen } from "@tauri-apps/api/event";
import LeftControls from "./LeftControls";
import { useStore } from "../utils/StoreContext";
import useNTConnected from "../ntcore-react/useNTConnected";
import { useToast } from "react-toast-plus";

export interface HubProps {
  setIp: (ip: string) => void;
}

const Hub: React.FC<HubProps> = ({ setIp }) => {
  const [connectionIP] = useStore<string>("connectionIP", "127.0.0.1");
  const [theme] = useStore<string>("theme", "light");
  const [save, load] = useSaveLoad("layout.json");
  const connected = useNTConnected();
  const hasConnected = useRef<boolean>();
  const { addToast } = useToast();

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
          `ShrinkWrap - ${
            connected ? "Connected to " + connectionIP : "Disconnected"
          }`
        );
      if (connected) {
        addToast.success("Connected to " + connectionIP);
        hasConnected.current = true;
      } else {
        if (hasConnected.current)
          addToast.warning("Disconnected from " + connectionIP);
      }
    };
    renameWindow();
  }, [connected, connectionIP]);

  useEffect(() => {
    document.body.className = `${theme}`;
  }, [theme]);

  const onReady = useCallback(
    async (event: DockviewReadyEvent) => {
      let openWelcomeTab = () => {
        let tab = tabsConfig.find((tab) => tab.id === "welcome");
        if (tab == null) return;
        let newId = "welcome" + event.api.panels.length;
        event.api
          ?.addPanel({
            id: newId,
            component: "welcome",
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
        openWelcomeTab();
        failed = true;
      }
      if (layout != null && !failed) {
        event.api.fromJSON(JSON.parse(layout));
      }
      if (event.api.panels.length === 0) {
        openWelcomeTab();
      }

      let unlisten = event.api.onDidLayoutChange(async () => {
        if (event.api.panels.length === 0) {
          openWelcomeTab();
          return;
        }
        let json = event.api.toJSON();
        if (json == null) return;
        await save(JSON.stringify(json));
      });

      return () => {
        unlisten.dispose();
      };
    },
    [load, save]
  );

  return (
    <div className={`container`}>
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

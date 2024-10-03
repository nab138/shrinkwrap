import React, { useCallback, useEffect, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig } from "../tabsConfig";
import { window as tauriWindow } from "@tauri-apps/api";
import { usePrefs } from "../utils/PrefsContext";
import useSaveLoad from "../utils/saveload";
import { listen } from "@tauri-apps/api/event";
import LeftControls from "./LeftControls";
import useNTConnected from "../../node_modules/ntcore-react/src/lib/useNTConnected";

export interface HubProps {
  setIp: React.Dispatch<React.SetStateAction<string>>;
}
const Hub: React.FC<HubProps> = ({ setIp }) => {
  const { connectionIP, theme } = usePrefs();
  const [api, setApi] = useState<DockviewApi>();
  const [save, load] = useSaveLoad("layout.json");
  const connected = useNTConnected();

  const openTab = useCallback(
    (tabId: string) => {
      let tab = tabsConfig.find((tab) => tab.id === tabId);
      if (tab == null) return;
      api
        ?.addPanel({
          id: tabId + api.panels.length,
          component: tabId,
          params: { title: tab.title },
        })
        .setTitle(tab.title);
    },
    [api]
  );

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
  }, [connectionIP]);

  useEffect(() => {
    const renameWindow = async () => {
      await tauriWindow
        .getCurrentWindow()
        .setTitle(
          `ShrinkWrap - ${
            connected ? "Connected to " + connectionIP : "Disconnected"
          }`
        );
    };
    renameWindow();
  }, [connected, connectionIP]);

  useEffect(() => {
    document.body.className = `${theme}`;
  }, [theme]);

  const onReady = useCallback(
    async (event: DockviewReadyEvent) => {
      setApi(event.api);
      let openWelcomeTab = () => {
        let tab = tabsConfig.find((tab) => tab.id === "welcome");
        if (tab == null) return;
        console.log(tab);
        event.api
          ?.addPanel({
            id: "welcome" + event.api.panels.length,
            component: "welcome",
            params: { title: tab.title },
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
    [openTab]
  );

  return (
    <div className={`container`}>
      <DockviewReact
        components={tabsConfig.reduce((acc, tab) => {
          acc[tab.id] = tab.component;
          return acc;
        }, {} as any)}
        leftHeaderActionsComponent={LeftControls}
        onReady={onReady}
        className={"dockview-theme-" + theme + " view"}
      />
    </div>
  );
};

export default Hub;

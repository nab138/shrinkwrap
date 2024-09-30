import React, { useCallback, useEffect, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig } from "../tabsConfig";
import { window as tauriWindow } from "@tauri-apps/api";
import { usePrefs } from "../utils/PrefsContext";
import useSaveLoad from "../utils/saveload";
import { listen } from "@tauri-apps/api/event";
import {
  connect,
  createClient,
  useNetworktables,
} from "../networktables/NetworkTables";
import LeftControls from "./LeftControls";

const Hub: React.FC = () => {
  const { connectionIP, theme } = usePrefs();
  const [api, setApi] = useState<DockviewApi>();
  const [save, load] = useSaveLoad("layout.json");
  const { status } = useNetworktables();

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
      const unlisten = await listen<boolean>("connect", (event) => {
        if (event.payload) {
          createClient("127.0.0.1");
          connect();
        } else {
          createClient(connectionIP);
          connect();
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
      await tauriWindow.getCurrentWindow().setTitle(`ShrinkWrap - ${status}`);
    };
    renameWindow();
  }, [status]);

  useEffect(() => {
    document.body.className = `${theme}`;
  }, [theme]);

  const onReady = useCallback(async (event: DockviewReadyEvent) => {
    setApi(event.api);
    let layout: string | null = null;
    try {
      layout = await load();
    } catch (e) {
      console.warn("Failed to load saved layout", e);
    }
    if (layout != null) {
      event.api.fromJSON(JSON.parse(layout));
    } else {
      openTab("welcome");
    }
    let unlisten = event.api.onDidLayoutChange(async () => {
      console.log("layout changed");
      let json = event.api.toJSON();
      if (json == null) return;
      await save(JSON.stringify(json));
    });
    return () => {
      unlisten.dispose();
    };
  }, []);

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

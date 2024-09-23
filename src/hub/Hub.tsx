import React, { useCallback, useEffect, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig } from "../tabsConfig";
import { invoke } from "@tauri-apps/api/core";
import { window as tauriWindow } from "@tauri-apps/api";
import Navbar from "./Navbar";

const Hub: React.FC = () => {
  const [api, setApi] = useState<DockviewApi>();

  const onReady = useCallback(async (event: DockviewReadyEvent) => {
    setApi(event.api);
    let layout: string | null = null;
    try {
      layout = (await invoke("load_layout")) as string;
    } catch (e) {
      console.warn("Failed to load saved layout", e);
    }
    if (layout != null) {
      event.api.fromJSON(JSON.parse(layout));
    } else {
      openTab("welcome");
    }
  }, []);

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
      saveLayout();
    },
    [api]
  );

  const saveLayout = useCallback(() => {
    if (api == null) return;
    let json = api.toJSON();
    if (json == null) return;
    invoke("save_layout", { layout: JSON.stringify(json) });
  }, [api]);

  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await tauriWindow
        .getCurrentWindow()
        .onCloseRequested(async () => {
          await saveLayout();
        });
      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [saveLayout]);

  return (
    <div className="container">
      <Navbar openTab={openTab} />
      <DockviewReact
        components={tabsConfig.reduce((acc, tab) => {
          acc[tab.id] = tab.component;
          return acc;
        }, {} as any)}
        onReady={onReady}
        className={"dockview-theme-dark"}
      />
    </div>
  );
};

export default Hub;

import React, { useCallback, useEffect, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent } from "dockview";
import "./App.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig } from "./tabsConfig";
import { invoke } from "@tauri-apps/api/core";
import { window as tauriWindow } from "@tauri-apps/api";
import { TauriEvent } from "@tauri-apps/api/event";

const App: React.FC = () => {
  const [api, setApi] = useState<DockviewApi>();

  const onReady = useCallback(async (event: DockviewReadyEvent) => {
    setApi(event.api);
    let layout: string | null = null;
    try {
      layout = (await invoke("load_layout")) as string;
    } catch (e) {
      console.warn("Failed to load saved layout", e);
    }
    if (layout) {
      event.api.fromJSON(JSON.parse(layout));
      return;
    }
    let tab = tabsConfig[0];
    event.api.addPanel({
      id: getPanelId(tab.id, event.api.panels.length),
      component: tab.id,
      params: { title: tab.title },
    });
  }, []);

  const openTab = useCallback(
    (tabId: string) => {
      api?.addPanel({
        id: getPanelId(tabId),
        component: tabId,
        params: { title: tabId },
      });
      saveLayout();
    },
    [api]
  );

  const saveLayout = useCallback(() => {
    invoke("save_layout", { layout: JSON.stringify(api?.toJSON()) });
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
      <div className="toolbar">
        {tabsConfig.map((tab) => (
          <button key={tab.id} onClick={() => openTab(tab.id)}>
            {tab.title}
          </button>
        ))}
      </div>
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

export default App;

function getPanelId(tabId: string, tabCount = 0) {
  return tabId + (tabCount > 0 ? `-${tabCount}` : "");
}

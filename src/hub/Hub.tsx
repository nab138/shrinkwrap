import React, { useCallback, useEffect, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent } from "dockview";
import "./Hub.css";
import "dockview/dist/styles/dockview.css";
import { tabsConfig } from "../tabsConfig";
import { window as tauriWindow } from "@tauri-apps/api";
import Navbar from "./Navbar";
import { usePrefs } from "../utils/PrefsContext";
import useSaveLoad from "../utils/saveload";

const Hub: React.FC = () => {
  const { theme, savePrefs } = usePrefs();
  const [api, setApi] = useState<DockviewApi>();
  const [save, load] = useSaveLoad("layout.json");

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

  const saveLayout = useCallback(async () => {
    if (api == null) return;
    let json = api.toJSON();
    if (json == null) return;
    await save(JSON.stringify(json));
  }, [api]);

  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await tauriWindow
        .getCurrentWindow()
        .onCloseRequested(async () => {
          await saveLayout();
          await savePrefs();
        });
      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [saveLayout, savePrefs]);

  return (
    <div className={`container ${theme}`}>
      <Navbar openTab={openTab} />
      <DockviewReact
        components={tabsConfig.reduce((acc, tab) => {
          acc[tab.id] = tab.component;
          return acc;
        }, {} as any)}
        onReady={onReady}
        className={"dockview-theme-" + theme}
      />
    </div>
  );
};

export default Hub;

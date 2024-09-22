import React, { useState } from 'react';
import { DockviewApi, DockviewReact, DockviewReadyEvent } from 'dockview';
import './App.css';
import 'dockview/dist/styles/dockview.css';
import { tabsConfig } from './tabsConfig';

const App: React.FC = () => {
  const [api, setApi] = useState<DockviewApi>();
  
    const onReady = (event: DockviewReadyEvent) => {
      setApi(event.api);
      let tab = tabsConfig[0];
      event.api.addPanel({
          id: getPanelId(tab.id),
          component: tab.id,
          params: { title: tab.title },
      });
    };

    const openTab = (tabId: string) => {
      api?.addPanel({
          id: getPanelId(tabId),
          component: tabId,
          params: { title: tabId },
      });
    };

    return (
        <div className="container">
            <div className="toolbar">
                {tabsConfig.map(tab => (
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
                className={'dockview-theme-dark'}
            />
        </div>
    );
};

export default App;

let numTabs = 0;
function getPanelId(tabId: string) {
  console.log(tabId + numTabs);
  return tabId + numTabs++;
}
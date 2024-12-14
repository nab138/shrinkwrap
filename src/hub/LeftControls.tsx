import React, { useCallback } from "react";
import { IDockviewHeaderActionsProps } from "dockview";
import { tabsConfig } from "../tabsConfig";
import Dropdown from "./Dropdown";

const options = tabsConfig.map((tab) => ({ id: tab.id, title: tab.title })).reverse();

const LeftControlsRaw: React.FC<IDockviewHeaderActionsProps> = ({
  containerApi,
  group,
}) => {
  const openTab = useCallback(
    (tabId: string) => {
      let tab = tabsConfig.find((tab) => tab.id === tabId);
      if (tab == null) return;
      let newId = tabId + containerApi.panels.length;
      containerApi
        ?.addPanel({
          id: newId,
          component: tabId,
          params: { id: newId },
          position: {
            referenceGroup: group,
          },
        })
        .setTitle(tab.title);
    },
    [containerApi, group]
  );

  return (
    <div
      className="group-control"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0px 8px",
        height: "100%",
        color: "var(--dv-activegroup-visiblepanel-tab-color)",
        zIndex: 5000,
      }}
    >
      <Dropdown className="tab-dropdown" options={options} onSelect={openTab} />
    </div>
  );
};

export default React.memo(LeftControlsRaw);

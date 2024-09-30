import React, { useCallback } from "react";
import { IDockviewHeaderActionsProps } from "dockview";
import { tabsConfig } from "../tabsConfig";
import Dropdown from "./Dropdown";

const LeftControlsRaw: React.FC<IDockviewHeaderActionsProps> = ({
  containerApi,
  group,
}) => {
  const openTab = useCallback(
    (tabId: string) => {
      let tab = tabsConfig.find((tab) => tab.id === tabId);
      if (tab == null) return;
      containerApi
        ?.addPanel({
          id: tabId + containerApi.panels.length,
          component: tabId,
          params: { title: tab.title },
          position: {
            referenceGroup: group,
          },
        })
        .setTitle(tab.title);
    },
    [containerApi]
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
      }}
    >
      <Dropdown
        className="tab-dropdown"
        options={tabsConfig.map((tab) => ({ id: tab.id, title: tab.title }))}
        onSelect={openTab}
      />
    </div>
  );
};
export default React.memo(LeftControlsRaw);

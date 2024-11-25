import { IDockviewPanelProps } from "dockview";
import LogViewer from "./tabs/Log";
import OxConfig from "./tabs/OxConfig/OxConfig";
import Settings from "./tabs/Settings";
import ThreeDimensionField from "./tabs/ThreeDimensionField/ThreeDimensionField";

export type TabInfo = {
  id: string;
  component: React.FC<IDockviewPanelProps<{ id: string }>>;
  title: string;
};

export const tabsConfig: TabInfo[] = [
  {
    id: "settings",
    component: Settings,
    title: "⚙️ Settings",
  },
  {
    id: "3dfield",
    component: ThreeDimensionField,
    title: "🏟️ 3D Field",
  },
  {
    id: "log",
    component: LogViewer,
    title: "📜 Log",
  },
  {
    id: "oxconfigeditor",
    component: OxConfig,
    title: "🛠️ OxConfig",
  },
];

export const components = tabsConfig.reduce((acc, tab) => {
  acc[tab.id] = tab.component;
  return acc;
}, {} as any);

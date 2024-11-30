import { IDockviewPanelProps } from "dockview";
import LogViewer from "./tabs/Log";
import OxConfig from "./tabs/OxConfig/OxConfig";
import Settings from "./tabs/Settings";
import ThreeDimensionField from "./tabs/ThreeDimensionField/ThreeDimensionField";
import StateVisualizer from "./tabs/StateVisualizer";

export type TabInfo = {
  id: string;
  component: React.FC<IDockviewPanelProps<{ id: string }>>;
  title: string;
};

export const tabsConfig: TabInfo[] = [
  {
    id: "oxconfigeditor",
    component: OxConfig,
    title: "🛠️ OxConfig",
  },
  {
    id: "3dfield",
    component: ThreeDimensionField,
    title: "🏟️ 3D Field",
  },
  {
    id: "statevis",
    component: StateVisualizer,
    title: "👀 Statemachine",
  },
  {
    id: "settings",
    component: Settings,
    title: "⚙️ Settings",
  },
  {
    id: "log",
    component: LogViewer,
    title: "📜 Log",
  },
];

export const components = tabsConfig.reduce((acc, tab) => {
  acc[tab.id] = tab.component;
  return acc;
}, {} as any);

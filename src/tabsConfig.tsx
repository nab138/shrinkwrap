import { IDockviewPanelProps } from "dockview";
import OxConfig from "./tabs/OxConfig/OxConfig";
import Settings from "./tabs/Settings";
import ThreeDimensionField from "./tabs/ThreeDimensionField/ThreeDimensionField";
import StateVisualizer from "./tabs/StateVisualizer";
import TwoDimensionField from "./tabs/TwoDimensionField";

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
    id: "statevis",
    component: StateVisualizer,
    title: "👀 Statemachine",
  },
  {
    id: "3dfield",
    component: ThreeDimensionField,
    title: "🏟️ 3D Field",
  },
  {
    id: "2dfield",
    component: TwoDimensionField,
    title: "🗺️ 2D Field",
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

import { IDockviewPanelProps } from "dockview";
import OxConfigTab from "./tabs/OxConfig/OxConfigTab";
import Settings from "./tabs/Settings";
import ThreeDimensionField from "./tabs/ThreeDimensionField/ThreeDimensionField";
import StateVisualizer from "./tabs/StateMachine/StateVisualizer";
import TwoDimensionField from "./tabs/TwoDimensionField/TwoDimensionField";
// import ReefscapeButtonBoard from "./tabs/ReefscapeButtonBoard";
import RebuiltAutoAim from "./tabs/RebuiltAutoAim";
import MjpegStreams from "./tabs/MjpegStreams";

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
    component: OxConfigTab,
    title: "🛠️ OxConfig",
  },
  // {
  //   id: "reefscapebuttonboard",
  //   component: ReefscapeButtonBoard,
  //   title: "🎛️ Reefscape Button Board",
  // },
  {
    id: "rebuiltautoaim",
    component: RebuiltAutoAim,
    title: "🤖 Rebuilt Aim Tuner",
  },
  {
    id: "mjpegstreams",
    component: MjpegStreams,
    title: "📷 Cameras",
  },
];

export const components = tabsConfig.reduce((acc, tab) => {
  acc[tab.id] = tab.component;
  return acc;
}, {} as any);

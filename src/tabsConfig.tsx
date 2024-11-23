import LogViewer from "./tabs/Log";
import OxConfigEditor from "./tabs/OxConfigEditor";
import Settings from "./tabs/Settings";
import ThreeDimensionField from "./tabs/ThreeDimensionField/ThreeDimensionField";
import OxConfigTuner from "./tabs/OxConfigTuner";

export const tabsConfig = [
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
    component: OxConfigEditor,
    title: "🛠️ OxConfig (Editor)",
  },
  {
    id: "oxconfigtuner",
    component: OxConfigTuner,
    title: "🎛️ OxConfig (Tuner)",
  },
];

export const components = tabsConfig.reduce((acc, tab) => {
  acc[tab.id] = tab.component;
  return acc;
}, {} as any);

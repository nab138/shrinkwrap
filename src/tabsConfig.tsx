import LogViewer from "./tabs/Log";
import OxConfigEditor from "./tabs/OxConfigEditor";
import Settings from "./tabs/Settings";
import ThreeDimensionField from "./tabs/ThreeDimensionField/ThreeDimensionField";
import Welcome from "./tabs/Welcome";

export const tabsConfig = [
  {
    id: "settings",
    component: Settings,
    title: "⚙️ Settings",
  },
  {
    id: "welcome",
    component: Welcome,
    title: "📚 Welcome",
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
    id: "oxconfig",
    component: OxConfigEditor,
    title: "🛠️ OxConfig (Editor)",
  },
];

export const components = tabsConfig.reduce((acc, tab) => {
  acc[tab.id] = tab.component;
  return acc;
}, {} as any);

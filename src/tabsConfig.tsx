import Settings from "./tabs/Settings";
import Welcome from "./tabs/Welcome";

export const tabsConfig = [
  {
    id: "settings",
    component: Settings,
    title: "Settings",
  },
  {
    id: "welcome",
    component: Welcome,
    title: "Welcome",
  },
];

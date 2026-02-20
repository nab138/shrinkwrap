import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { StoreProvider, useStore } from "./utils/StoreContext";
import NTProvider from "./ntcore-react/NTProvider";
import { ToastProvider } from "react-toast-plus";
import { platform } from "@tauri-apps/plugin-os";
import { UpdateProvider } from "./utils/UpdateContext";
import { load } from "@tauri-apps/plugin-store";
import { OxConfigProvider } from "./tabs/OxConfig/OxConfigProvider";

const MemoizedHub = React.memo(Hub);
const MemoizedNTProvider = React.memo(NTProvider);

const AppComponent = () => {
  const [ip, setIp] = React.useState("invalid");

  return (
    <MemoizedNTProvider uri={ip === "" ? "0" : ip}>
      <StoreProvider>
        <InnerAppComponent ip={ip} setIp={setIp} />
      </StoreProvider>
    </MemoizedNTProvider>
  );
};

const InnerAppComponent: React.FC<{
  ip: string;
  setIp: (ip: string) => void;
}> = ({ ip, setIp }) => {
  const [theme] = useStore<string>("theme", "light");
  return (
    <ToastProvider
      toastOptions={{
        closeOnClick: true,
        placement: "bottom-right",
        pauseOnFocusLoss: platform() !== "ios" && platform() !== "android",
      }}
      toastStyles={{
        toastBgColor: theme === "dark" ? "#050505" : "#fff",
        toastTextColor: theme === "dark" ? "#fff" : "#111",
      }}
    >
      <UpdateProvider>
        <OxConfigProvider>
          <MemoizedHub setIp={setIp} ip={ip === "" ? "0" : ip} />
        </OxConfigProvider>
      </UpdateProvider>
    </ToastProvider>
  );
};

async function initializeDevMode() {
  const devStoreInstance = await load("devmode.json");
  if ((await devStoreInstance.get("devmode")) === undefined) {
    await devStoreInstance.set("devmode", false);
    await devStoreInstance.save();
  }
  const devMode = (await devStoreInstance.get("devmode")) === true;
  if (devMode) {
    import("eruda").then((eruda) => eruda.default.init());
  }
  return { devStoreInstance, devMode };
}

export const devModePromise = initializeDevMode();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AppComponent />
);

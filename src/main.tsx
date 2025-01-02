import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { StoreProvider } from "./utils/StoreContext";
import NTProvider from "./ntcore-react/NTProvider";
import { ToastProvider } from "react-toast-plus";
import { platform } from "@tauri-apps/plugin-os";
import { UpdateProvider } from "./utils/UpdateContext";
import { createStore } from "@tauri-apps/plugin-store";

const MemoizedHub = React.memo(Hub);
const MemoizedNTProvider = React.memo(NTProvider);

const AppComponent = () => {
  const [ip, setIp] = React.useState("invalid");

  const stableSetIp = React.useCallback((newIp: string) => {
    setIp(newIp);
  }, []);

  return (
    <MemoizedNTProvider uri={ip === "" ? "0" : ip}>
      <StoreProvider>
        <ToastProvider
          toastOptions={{
            closeOnClick: true,
            placement: "bottom-right",
            pauseOnFocusLoss: platform() !== "ios" && platform() !== "android",
          }}
        >
          <UpdateProvider>
            <MemoizedHub setIp={stableSetIp} ip={ip === "" ? "0" : ip} />
          </UpdateProvider>
        </ToastProvider>
      </StoreProvider>
    </MemoizedNTProvider>
  );
};

export const devStoreInstance = await createStore("devmode.bin");
if ((await devStoreInstance.get("devmode")) === undefined) {
  await devStoreInstance.set("devmode", false);
  await devStoreInstance.save();
}
export const devMode = (await devStoreInstance.get("devmode")) === true;
if (devMode) {
  import("eruda").then((eruda) => eruda.default.init());
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AppComponent />
);

import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { LogProvider } from "./utils/LogContext";
import { StoreProvider } from "./utils/StoreContext";
import NTProvider from "./ntcore-react/NTProvider";
import { ToastProvider } from "react-toast-plus";
import { platform } from "@tauri-apps/plugin-os";
import { UpdateProvider } from "./utils/UpdateContext";

const MemoizedHub = React.memo(Hub);
const MemoizedNTProvider = React.memo(NTProvider);
const MemoizedLogProvider = React.memo(LogProvider);

const AppComponent = () => {
  const [ip, setIp] = React.useState("invalid");

  const stableSetIp = React.useCallback((newIp: string) => {
    setIp(newIp);
  }, []);

  return (
    <MemoizedNTProvider uri={ip === "" ? "0" : ip}>
      <StoreProvider>
        <MemoizedLogProvider>
          <ToastProvider
            toastOptions={{
              closeOnClick: true,
              placement: "bottom-right",
              pauseOnFocusLoss:
                platform() !== "ios" && platform() !== "android",
            }}
          >
            <UpdateProvider>
              <MemoizedHub setIp={stableSetIp} ip={ip === "" ? "0" : ip} />
            </UpdateProvider>
          </ToastProvider>
        </MemoizedLogProvider>
      </StoreProvider>
    </MemoizedNTProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AppComponent />
);

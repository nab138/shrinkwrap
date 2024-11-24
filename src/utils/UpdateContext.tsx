import React, { createContext, useContext, useCallback } from "react";
import { useToast } from "react-toast-plus";
import { ask } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { platform } from "@tauri-apps/plugin-os";

interface UpdateContextProps {
  checkForUpdates: (alertIfNone?: boolean) => void;
}

const UpdateContext = createContext<UpdateContextProps | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addToast } = useToast();

  const checkForUpdates = useCallback(
    async (alertIfNone?: boolean) => {
      if (platform() === "ios" || platform() === "android") return;
      if (import.meta.env.DEV) {
        if (alertIfNone)
          addToast.info("Auto updates are disabled in development mode.");
        return;
      }
      const update = await check();
      if (update) {
        if (
          !(await ask(
            "A new update is available (v" +
              update.version +
              "). Would you like to download & install it?"
          ))
        )
          return;

        let relaunchConfirm = async () => {
          if (!(await ask("Update installed. Relaunch now?"))) return;
          await relaunch();
        };

        let updatePromise = update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              break;
            case "Progress":
              break;
            case "Finished":
              relaunchConfirm();
              break;
          }
        });

        addToast.promise(updatePromise, {
          pending: "Downloading update...",
          success: () => `App updated to v${update.version}`,
          error: (error) => `Failed to update: ${error}`,
        });
      } else if (alertIfNone) {
        addToast.info("No updates available.");
      }
    },
    [addToast]
  );

  return (
    <UpdateContext.Provider value={{ checkForUpdates }}>
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdate must be used within an UpdateProvider");
  }
  return context;
};

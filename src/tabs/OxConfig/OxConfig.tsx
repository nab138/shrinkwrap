import React, { useState, useEffect, useRef } from "react";
import fuzzysort from "fuzzysort";
import { useComputedNTValue, useNTValue } from "../../ntcore-react/useNTValue";
import { useStore } from "../../utils/StoreContext";
import "./OxConfig.css";
import { platform } from "@tauri-apps/plugin-os";
import useNTConnected from "../../ntcore-react/useNTConnected";
import useNTState from "../../ntcore-react/useNTState";
import { IDockviewPanelProps } from "dockview";
import { ErrorIcon, SuccessIcon, useToast } from "react-toast-plus";
import { invoke } from "@tauri-apps/api/core";
import { decode } from "@msgpack/msgpack";
import OxConfigEditor from "./Editor";
import OxConfigTuner from "./Tuner";

const isMobile = platform() === "ios" || platform() === "android";

export type ScreenSize = "small" | "medium" | "large";
export type Parameter = {
  key: string;
  values: string[];
  comment: string;
  type: string;
  displayKey?: string;
};

// name, key, type, values
export type ClassParam = {
  prettyName: string;
  key: string;
  type: string;
  values: string[];
};
export type Class = ClassParam[];

const OxConfig: React.FC<IDockviewPanelProps> = () => {
  const [screenSize, setMobileScreen] = useState<ScreenSize>(
    isMobile ? "small" : "large"
  );

  const { addToast, removeToast } = useToast();
  const [theme] = useStore("theme", "light");
  const lastTimestamp = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      if (isMobile) return;
      if (window.innerWidth < 600) return setMobileScreen("small");
      if (window.innerWidth < 890) return setMobileScreen("medium");
      return setMobileScreen("large");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);
  const [deployDir] = useStore("deployDir", "");

  const connected = useNTConnected();
  const [hasConnected, setHasConnected] = useState(false);

  useEffect(() => {
    if (connected && !hasConnected) {
      setHasConnected(true);
    }
  }, [connected, hasConnected]);

  const modes = useComputedNTValue<string, string[]>(
    "/OxConfig/Modes",
    (val) => val.split(",").filter((v) => v !== ""),
    ""
  );
  const currentMode = useNTValue<string>("/OxConfig/CurrentMode", "");
  const [__, setMode] = useNTState<string>(
    "/OxConfig/ModeSetter",
    "string",
    ""
  );

  const parameters = useComputedNTValue<string, Parameter[]>(
    "/OxConfig/Params",
    (params) => {
      if (params == "") return [];
      let paramsRaw = JSON.parse(params);
      let parametersMap: Parameter[] = [];
      for (let paramRaw of paramsRaw) {
        if (paramRaw[0] == "root/mode") continue;
        let key = paramRaw[0];
        let comment = paramRaw[1];
        let type = paramRaw[2].toLowerCase();
        parametersMap.push({ key, values: paramRaw.slice(3), comment, type });
      }
      return parametersMap;
    },
    ""
  );

  const [displayParameters, setDisplayParameters] = useState<Parameter[]>([]);

  const classes = useComputedNTValue<string, Class[]>(
    "/OxConfig/Classes",
    (classesRaw) => {
      if (classesRaw == "") return [];
      let parsed: string[][] = JSON.parse(classesRaw);
      let classes: Class[] = [];
      for (let cls of parsed) {
        let prettyName = cls[0];
        let key = cls[1];
        let type = cls[2];
        let values = cls.slice(3);
        //classes.push({ prettyName, key, type, values });
      }
      //return parametersMap;
      return [];
    },
    ""
  );

  useEffect(() => {
    if (parameters.length === 0) return;
    let search = document.querySelector(".config-search") as HTMLInputElement;
    if (search == null) return;
    if (search.value === "") setDisplayParameters(parameters);
    let searchHandler = () => {
      let searchValue = search.value;
      if (searchValue === "") return setDisplayParameters(parameters);
      let filteredParams: Parameter[] = [];
      parameters.forEach((param) => {
        let result = fuzzysort.single(searchValue, param.key);
        if (result) {
          filteredParams.push({
            ...param,
            displayKey: result.highlight(
              '<span style="color: red">',
              "</span>"
            ),
          });
        }
      });
      setDisplayParameters(filteredParams);
    };
    search.addEventListener("input", searchHandler);
    return () => {
      search.removeEventListener("input", searchHandler);
    };
  }, [parameters]);

  const [_, setKey] = useNTState<string>("/OxConfig/KeySetter", "string", "");

  const connectedClients = useComputedNTValue<Uint8Array, any>(
    "$clients",
    (val) => {
      try {
        // Ensure val is a valid Uint8Array before decoding
        if (val instanceof Uint8Array) {
          return decode(val);
        } else {
          console.error("Expected Uint8Array but received:", val);
          return [];
        }
      } catch (error) {
        return [];
      }
    },
    new Uint8Array()
  );

  const raw = useNTValue<string>("/OxConfig/Raw", "");

  useEffect(() => {
    if (isMobile) return;
    if (deployDir === "") {
      let warning = addToast.error(
        "[OxConfig] Deploy directory is unset. Changes will be overwritten on code rebuild."
      );
      return () => {
        removeToast(warning.id);
      };
    }
  }, [deployDir]);

  useEffect(() => {
    if (raw === "" || !connected || (!isMobile && deployDir == "")) return;
    if (isMobile) {
      if (connectedClients.length === 0) return;
      if (
        !connectedClients.some((client: any) => {
          if (client === undefined || client === null) return false;
          if (client.id === undefined || client.id === null) return false;
          return client.id.includes("ShrinkWrapDesktop");
        })
      ) {
        addToast.warning(
          "[OxConfig] Shrinkwrap mobile is unable to save changes to the config file unless a desktop client is connected."
        );
      }
      return;
    }
    (async () => {
      let split = raw.split(",");
      let timestamp = parseInt(split.shift() ?? "0");
      if (timestamp <= lastTimestamp.current) return;
      lastTimestamp.current = timestamp;
      let result = await invoke("write_oxconfig", {
        deploy: deployDir,
        data: split.join(","),
        timestamp,
      });
      if (result === "success") {
        addToast.success("[OxConfig] Wrote config to deploy folder");
      } else if (result === "no-exist") {
        addToast.error(
          "[OxConfig] Deploy directory missing or doesn't contain config.json"
        );
      } else if (result !== "time") {
        addToast.error("[OxConfig] Failed to save config, check permissions");
      }
    })();
  }, [raw, connected, deployDir, connectedClients]);

  const [isTuner, setIsTuner] = useState<boolean>(false);

  return (
    <div className="pageContainer config-editor">
      <div>
        <div>
          <div
            className="config-editor-line"
            style={{ padding: "20px", paddingBottom: "10px" }}
          >
            <h2>
              {isTuner ? "Tuner" : "Config Editor"}{" "}
              <a
                onClick={() => {
                  setIsTuner((prev) => !prev);
                }}
                style={{ fontSize: "0.6em", margin: "0" }}
              >
                (to {isTuner ? "config editor" : "tuner"})
              </a>
            </h2>
            {(screenSize === "large" || (deployDir === "" && !isMobile)) && (
              <p className="deploy-dir deploy-path-cfg">
                Deploy Directory
                <span className="question-icon">?</span>
                <span className="extra-info">
                  The config file is modified directly on the rio, which will be
                  overwritten on code rebuild. To save locally to prevent this
                  and for source control, you must select a deploy directory in
                  Settings.
                </span>
                <span style={{ marginRight: "5px" }}>:</span>
                <code className="deploy-dir-path">
                  {deployDir === "" ? (
                    <span
                      style={{
                        fontWeight: "bold",
                        color: theme === "light" ? "darkred" : "red",
                      }}
                    >
                      Not Set
                    </span>
                  ) : (
                    deployDir
                  )}
                </code>
              </p>
            )}
          </div>
          <div className="config-editor-line">
            <div className="search">
              <h3>Search</h3>
              <input
                className="config-search"
                type="text"
                placeholder="Search..."
              />
            </div>
            <div className="mode-dropdown-container">
              <h3 className="mode-text">Mode</h3>
              <select
                className="dropdown mode-dropdown"
                value={currentMode === "" ? undefined : currentMode}
                onChange={(e) => {
                  setMode(e.currentTarget.value);
                }}
              >
                {modes.length === 0 && (
                  <option value="failed">Not connected</option>
                )}
                {modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </select>

              {isMobile && (
                <>
                  {connected &&
                  connectedClients.some((client: any) => {
                    if (client === undefined || client === null) return false;
                    if (client.id === undefined || client.id === null)
                      return false;
                    return client.id.includes("ShrinkWrapDesktop");
                  }) ? (
                    <div className="pc-indicator">
                      PC <SuccessIcon />
                    </div>
                  ) : (
                    <div className="pc-indicator">
                      PC <ErrorIcon />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {isTuner ? (
          <OxConfigTuner />
        ) : (
          <OxConfigEditor
            displayParameters={displayParameters}
            screenSize={screenSize}
            connected={connected}
            modes={modes}
            setKey={setKey}
          />
        )}
      </div>
    </div>
  );
};

export default OxConfig;

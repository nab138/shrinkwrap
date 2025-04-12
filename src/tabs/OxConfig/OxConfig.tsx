import React, { useState, useEffect, useRef, useCallback } from "react";
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
import useNTLive from "../../ntcore-react/useNTLive";
import Modal from "../../hub/Modal";

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
export type Class = {
  prettyName: string;
  key: string;
  parameters: ClassParam[];
  displayKey?: string;
};

const OxConfig: React.FC<IDockviewPanelProps> = () => {
  const [screenSize, setMobileScreen] = useState<ScreenSize>(
    isMobile ? "small" : "large"
  );

  const { addToast, removeToast } = useToast();
  const [theme] = useStore("theme", "light");
  const lastTimestamp = useRef<number>(0);

  const liveMode = useNTLive();

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

  const computeModes = useCallback(
    (val: string) => val.split(",").filter((v) => v !== ""),
    []
  );
  const modes = useComputedNTValue<string, string[]>(
    "/OxConfig/Modes",
    computeModes,
    ""
  );
  const currentMode = useNTValue<string>("/OxConfig/CurrentMode", "");
  const [__, setMode] = useNTState<string>(
    "/OxConfig/ModeSetter",
    "string",
    ""
  );

  const computeParameters = useCallback((params: string) => {
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
  }, []);

  const parameters = useComputedNTValue<string, Parameter[]>(
    "/OxConfig/Params",
    computeParameters,
    ""
  );

  const [displayParameters, setDisplayParameters] = useState<Parameter[]>([]);
  const [displayClasses, setDisplayClasses] = useState<Class[]>([]);

  const computeClasses = useCallback((classesRaw: string) => {
    if (classesRaw == "") return [];
    let parsed: [string, string, ...string[][]][] = JSON.parse(classesRaw);
    let classes: Class[] = [];
    for (let cls of parsed) {
      let prettyName = cls.shift() as string;
      let key = cls.shift() as string;
      let parameters: ClassParam[] = [];
      for (let param of cls) {
        if (typeof param === "string") {
          console.error("Invalid class parameter (not string[])", param);
          continue;
        }
        let prettyName = param.shift();
        let key = param.shift();
        let type = param.shift();
        if (
          prettyName === undefined ||
          key === undefined ||
          type === undefined
        ) {
          console.error("Invalid class parameter", param);
          continue;
        }
        parameters.push({ prettyName, key, type, values: param });
      }
      classes.push({ prettyName, key, parameters });
    }
    return classes;
  }, []);

  const classes = useComputedNTValue<string, Class[]>(
    "/OxConfig/Classes",
    computeClasses,
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

  useEffect(() => {
    if (classes.length === 0) return;
    let search = document.querySelector(".config-search") as HTMLInputElement;
    if (search == null) return;
    if (search.value === "") setDisplayClasses(classes);
    let searchHandler = () => {
      let searchValue = search.value;
      if (searchValue === "") return setDisplayClasses(classes);
      let filteredClasses: Class[] = [];
      classes.forEach((cls) => {
        let result = fuzzysort.single(searchValue, cls.key);
        if (result) {
          filteredClasses.push({
            ...cls,
            displayKey: result.highlight(
              '<span style="color: red">',
              "</span>"
            ),
          });
        }
      });
      setDisplayClasses(filteredClasses);
    };
    search.addEventListener("input", searchHandler);
    return () => {
      search.removeEventListener("input", searchHandler);
    };
  }, [classes]);

  const [_, setKey] = useNTState<string>("/OxConfig/KeySetter", "string", "");
  const [______, setCopyAll] = useNTState<string>(
    "/OxConfig/CopyAll",
    "string",
    ""
  );
  const [_____, setClass] = useNTState<string>(
    "/OxConfig/ClassSetter",
    "string",
    ""
  );

  const computeConnectedClients = useCallback((val: Uint8Array) => {
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
  }, []);
  const connectedClients = useComputedNTValue<Uint8Array, any>(
    "$clients",
    computeConnectedClients,
    new Uint8Array()
  );

  const raw = useNTValue<string>("/OxConfig/Raw", "");

  const [copyOpen, setCopyOpen] = useState<boolean>(false);

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

  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [copyTo, setCopyTo] = useState<string | null>(null);

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
                disabled={!liveMode}
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
              {!isMobile && (
                <button onClick={() => setCopyOpen(true)}>Copy</button>
              )}

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
          <OxConfigTuner
            classes={displayClasses}
            modes={modes}
            setClass={setClass}
            connected={connected}
            screenSize={screenSize}
          />
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
      {copyOpen && (
        <Modal isOpen={true} onClose={() => setCopyOpen(false)}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: "10px",
              }}
            >
              Copy {copyFrom ?? "N/A"} to {copyTo ?? "N/A"} :
            </h2>

            <div>
              <h3 style={{ margin: 0, marginBottom: "5px" }}>From</h3>
              {modes.map((copyMode) => (
                <button
                  key={copyMode}
                  onClick={() => {
                    setCopyFrom(copyMode);
                    setCopyTo((old) => (old === copyMode ? null : old));
                  }}
                  style={{
                    backgroundColor: copyMode === copyFrom ? "#008800" : "",
                  }}
                >
                  {copyMode.charAt(0).toUpperCase() + copyMode.slice(1)}
                </button>
              ))}
            </div>
            <div>
              <h3 style={{ margin: 0, marginBottom: "5px" }}>To</h3>
              {modes
                .filter((m) => m !== copyFrom)
                .map((copyMode) => (
                  <button
                    key={copyMode}
                    onClick={() => {
                      setCopyTo(copyMode);
                    }}
                    style={{
                      backgroundColor: copyMode === copyTo ? "#008800" : "",
                    }}
                  >
                    {copyMode.charAt(0).toUpperCase() + copyMode.slice(1)}
                  </button>
                ))}
            </div>
            <button
              disabled={
                copyTo === null || copyFrom === null || copyTo === copyFrom
              }
              onClick={() => {
                setCopyAll([copyFrom, copyTo].join(","));
                setCopyOpen(false);
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OxConfig;

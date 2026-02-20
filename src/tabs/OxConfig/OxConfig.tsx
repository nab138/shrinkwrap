import React, { useState, useEffect, useRef } from "react";
import fuzzysort from "fuzzysort";
import { useStore } from "../../utils/StoreContext";
import "./OxConfig.css";
import { platform } from "@tauri-apps/plugin-os";
import useNTConnected from "../../ntcore-react/useNTConnected";
import { IDockviewPanelProps } from "dockview";
import { ErrorIcon, SuccessIcon, useToast } from "react-toast-plus";
import { invoke } from "@tauri-apps/api/core";
import OxConfigEditor from "./Editor";
import OxConfigTuner from "./Tuner";
import useNTLive from "../../ntcore-react/useNTLive";
import Modal from "../../hub/Modal";
import { useOxConfig, Parameter, Class } from "./OxConfigProvider";

const isMobile = platform() === "ios" || platform() === "android";

export type ScreenSize = "small" | "medium" | "large";

const OxConfig: React.FC<IDockviewPanelProps> = (props) => {
  const [screenSize, setMobileScreen] = useState<ScreenSize>(
    isMobile ? "small" : "large"
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    const element = containerRef.current;
    if (!element) return;
    const resizeObserver = new ResizeObserver(() => {
      const width = element.offsetWidth;
      if (width < 600) setMobileScreen("small");
      else if (width < 915) setMobileScreen("medium");
      else setMobileScreen("large");
    });
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [isMobile]);
  const [deployDir] = useStore("deployDir", "");

  const { addToast, removeToast } = useToast();
  const [theme] = useStore("theme", "light");
  const lastTimestamp = useRef<number>(0);

  const liveMode = useNTLive();

  const [isFocused, setIsFocused] = useState(props.api?.isActive ?? false);

  const {
    modes,
    currentMode,
    parameters,
    classes,
    connectedClients,
    raw,
    setMode,
    setKey,
    setCopyAll,
    setClass,
  } = useOxConfig();
  useEffect(() => {
    if (!props.api) return;
    if (props.api.isActive) setIsFocused(true);
    const focusDisposable = props.api.onDidActiveChange((a) => { setIsFocused(a.isActive) });
    return () => {
      focusDisposable.dispose();
    };
  }, [props.api]);
  const connected = useNTConnected();
  const [hasConnected, setHasConnected] = useState(false);

  useEffect(() => {
    if (connected && !hasConnected) {
      setHasConnected(true);
    }
  }, [connected, hasConnected]);

  const [displayParameters, setDisplayParameters] = useState<Parameter[]>([]);
  const [displayClasses, setDisplayClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (parameters.length === 0 || !isFocused) return;
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
    // Run on mount/focus to apply current search value
    searchHandler();
    return () => {
      search.removeEventListener("input", searchHandler);
    };
  }, [parameters, isFocused]);

  useEffect(() => {
    if (classes.length === 0 || !isFocused) return;
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
    // Run on mount/focus to apply current search value
    searchHandler();
    return () => {
      search.removeEventListener("input", searchHandler);
    };
  }, [classes, isFocused]);

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
    <div className="pageContainer config-editor" ref={containerRef}>
      <div className="inner-ox-container">
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
            {((screenSize === "large" || screenSize === "medium") || (deployDir === "" && !isMobile)) && (
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
                    screenSize === "medium" ? "Set" : deployDir
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
              {modes.map((copyMode) => (
                <button
                  disabled={copyMode === copyFrom}
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

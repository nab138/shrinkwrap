import React, { useState, useEffect, useRef } from "react";
import fuzzysort from "fuzzysort";
import { useComputedNTValue, useNTValue } from "../ntcore-react/useNTValue";
import { useStore } from "../utils/StoreContext";
import "./OxConfigEditor.css";
import { platform } from "@tauri-apps/plugin-os";
import useNTConnected from "../ntcore-react/useNTConnected";
import useNTState from "../ntcore-react/useNTState";
import { IDockviewPanelProps } from "dockview";
import { useToast } from "react-toast-plus";
import { invoke } from "@tauri-apps/api/core";
import { decode } from "@msgpack/msgpack";
import Modal from "../hub/Modal";

const isMobile = platform() === "ios" || platform() === "android";

export type ScreenSize = "small" | "medium" | "large";
export type Parameter = {
  key: string;
  values: string[];
  comment: string;
  type: string;
  displayKey?: string;
};

const OxConfigEditor: React.FC<IDockviewPanelProps> = () => {
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

  const table = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (table.current == null) return;
    let isResizing = false;
    let resizingColumn: any = null;
    let startX = 0;
    let startWidth = 0;

    let onMouseDown = (e: MouseEvent) => {
      if (e.target == null) return;
      let target = e.target as HTMLElement;
      if (target.classList.contains("resizer")) {
        const column = target.closest("th");
        if (column == null) return;
        const nextColumn = column.nextElementSibling;

        if (nextColumn && !nextColumn.classList.contains("no-resize")) {
          isResizing = true;
          resizingColumn = column;
          startX = e.pageX;
          startWidth = column.offsetWidth;

          table.current?.classList.add("resizing");
        }
      }
    };

    let onMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const offset = e.pageX - startX;
        const newWidth = startWidth + offset;

        resizingColumn.style.width = newWidth + "px";
      }
    };

    let onMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        resizingColumn = null;
        startX = 0;
        startWidth = 0;

        table.current?.classList.remove("resizing");
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [table.current]);

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

  let [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="pageContainer config-editor">
      <div>
        <div>
          <div
            className="config-editor-line"
            style={{ padding: "20px", paddingBottom: "10px" }}
          >
            <h2>Config Editor</h2>

            {isMobile && (
              <p style={{ margin: "0px" }}>
                {connectedClients.some((client: any) => {
                  if (client === undefined || client === null) return false;
                  if (client.id === undefined || client.id === null)
                    return false;
                  return client.id.includes("ShrinkWrapDesktop");
                })
                  ? "PC Conneted"
                  : "No PC Connected"}
              </p>
            )}
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
            </div>
          </div>
          <div className="warning-container">
            <div className="ce-warning" style={{ display: "none" }}>
              <h3 className="warning-text">
                <span className="warning-prefix">⚠️ Warning! </span>
                <span className="warning-content">
                  Failed to write file: Deploy directory is missing or doesn't
                  contain config.json.
                </span>
              </h3>
            </div>
          </div>
        </div>
        <div className="param-table-container">
          <table className="data-table param-table">
            <thead>
              <tr className="parameter-table-headers">
                <th className="param-table-header">
                  <div>Parameter</div> <div className="resizer" />
                </th>
                {screenSize !== "small" && (
                  <th className="comment-table-header">
                    <div>Comment</div> <div className="resizer" />
                  </th>
                )}
                {screenSize !== "small" &&
                  modes.map((mode) => (
                    <th key={mode}>
                      <div>{mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
                      <div className="resizer" />
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="parameter-table" ref={table}>
              {displayParameters.map((param) => (
                <>
                  {screenSize === "small" && (
                    <Modal
                      isOpen={openKey === param.key}
                      onClose={() => setOpenKey(null)}
                      key={param.key}
                    >
                      <h2 style={{ marginTop: 0 }}>{param.key}</h2>
                      <table className="data-table param-table">
                        <thead>
                          <tr>
                            <th>Mode</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        {param.values.map((value, i) => {
                          let inputElem = getInputElem(
                            param,
                            value,
                            i,
                            connected,
                            setKey
                          );
                          return (
                            <tr>
                              <td>
                                {modes[i].charAt(0).toUpperCase() +
                                  modes[i].slice(1)}
                              </td>
                              <td>
                                <div>{inputElem}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </table>
                    </Modal>
                  )}

                  <tr key={param.key}>
                    <td
                      dangerouslySetInnerHTML={{
                        __html: param.displayKey ?? param.key,
                      }}
                      style={
                        screenSize === "small"
                          ? { padding: "5px", width: "100%" }
                          : undefined
                      }
                      onClick={() => {
                        if (screenSize !== "small") return;
                        setOpenKey(param.key);
                      }}
                    ></td>
                    {screenSize !== "small" && (
                      <td>
                        <div>
                          <input
                            style={connected ? undefined : { color: "gray" }}
                            disabled={!connected}
                            defaultValue={param.comment}
                            onBlur={(e) => {
                              if (param.comment === e.currentTarget.value)
                                return;
                              setKey(
                                [
                                  param.key,
                                  e.currentTarget.value,
                                  ...param.values,
                                ].join(",")
                              );
                            }}
                          ></input>
                        </div>
                      </td>
                    )}

                    {screenSize !== "small" &&
                      param.values.map((value, i) => {
                        let inputElem = getInputElem(
                          param,
                          value,
                          i,
                          connected,
                          setKey
                        );
                        return (
                          <td key={i}>
                            <div>{inputElem}</div>
                          </td>
                        );
                      })}
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OxConfigEditor;

function getInputElem(
  param: Parameter,
  value: any,
  i: number,
  connected: boolean,
  setKey: (key: string) => void
) {
  let type = paramToInputType(param.type);
  let update = (e: any) => {
    let newValues = [...param.values];
    if (type === "checkbox")
      newValues[i] = e.currentTarget.checked ? "true" : "false";
    else newValues[i] = e.currentTarget.value;
    if (newValues[i] === param.values[i]) return;
    setKey([param.key, param.comment, ...newValues].join(","));
  };
  let inputElem = (
    <input
      style={connected ? undefined : { color: "gray" }}
      disabled={!connected}
      key={value}
      type={type}
      onBlur={type === "checkbox" ? undefined : update}
      onChange={type === "checkbox" ? update : undefined}
      defaultValue={type === "checkbox" ? undefined : value}
      checked={type === "checkbox" ? value === "true" : undefined}
    />
  );
  return inputElem;
}

function paramToInputType(typeRaw: string) {
  let type = typeRaw.toLowerCase();
  if (type == "boolean") return "checkbox";
  if (["integer", "short", "long", "double", "float"].includes(type))
    return "number";
  return "text";
}

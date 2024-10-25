import React, { useState, useEffect, useRef } from "react";
//import fuzzysort from "fuzzysort";
//import useNTState from "../ntcore-react/useNTState";
import { NetworkTablesTypeInfos } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src";
import { useComputedNTValue, useNTValue } from "../ntcore-react/useNTValue";
//import useNTConnected from "../ntcore-react/useNTConnected";
import { useStore } from "../utils/StoreContext";
import "./OxConfigEditor.css";
import { platform } from "@tauri-apps/plugin-os";
import useNTConnected from "../ntcore-react/useNTConnected";
import useNTState from "../ntcore-react/useNTState";

const isMobile = platform() === "ios" || platform() === "android";

export type ScreenSize = "small" | "medium" | "large";
export type Parameter = {
  key: string;
  values: string[];
  comment: string;
  type: string;
};

const OxConfigEditor: React.FC = () => {
  const [screenSize, setMobileScreen] = useState<ScreenSize>(
    isMobile ? "small" : "large"
  );

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
    NetworkTablesTypeInfos.kString,
    (val) => val.split(",").filter((v) => v !== ""),
    ""
  );
  const currentMode = useNTValue<string>(
    "/OxConfig/CurrentMode",
    NetworkTablesTypeInfos.kString,
    ""
  );

  const parameters = useComputedNTValue<string, Parameter[]>(
    "/OxConfig/Params",
    NetworkTablesTypeInfos.kString,
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

  const [_, setKey] = useNTState<string>(
    "/OxConfig/KeySetter",
    NetworkTablesTypeInfos.kString,
    ""
  );

  const raw = useNTValue<string>(
    "/OxConfig/Raw",
    NetworkTablesTypeInfos.kString,
    ""
  );
  const successWarning = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (successWarning.current == null) return;
    successWarning.current.style.display = "block";
    successWarning.current.style.opacity = "1";
    let interval: any = null;
    let timeout = setTimeout(() => {
      let opacity = 1;
      interval = setInterval(() => {
        if (successWarning.current == null) return;

        opacity -= 0.01;
        successWarning.current.style.opacity = opacity.toString();
        if (opacity < -0.5) {
          successWarning.current.style.display = "none";
          clearInterval(interval);
        }
      }, 5);
    }, 2000);
    return () => {
      clearTimeout(timeout);
      if (interval !== null) clearInterval(interval);
    };
  }, [raw]);

  return (
    <div className="pageContainer config-editor">
      <div>
        <div>
          <div
            className="config-editor-line"
            style={{ padding: "20px", paddingBottom: "10px" }}
          >
            <h2>Config Editor</h2>
            {screenSize === "large" && (
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
                  {deployDir === "" ? "Not Set" : deployDir}
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
            {!connected && hasConnected && (
              <div className="ce-warning">
                <h3 className="warning-text">
                  <span className="warning-prefix">⚠️ Warning! </span>The robot
                  is disconnected. All changes from now until reconnection will
                  be lost.
                </h3>
              </div>
            )}
            {deployDir === "" && (
              <div className="ce-warning">
                <h3 className="warning-text">
                  <span className="warning-prefix">⚠️ Warning! </span>The deploy
                  directory is unset. Changes will be overwritten on code
                  rebuild.
                </h3>
              </div>
            )}
            <div className="ce-warning" style={{ display: "none" }}>
              <h3 className="warning-text">
                <span className="warning-prefix">⚠️ Warning! </span>
                <span className="warning-content">
                  Failed to write file: Deploy directory is missing or doesn't
                  contain config.json.
                </span>
              </h3>
            </div>
            <div
              ref={successWarning}
              className="ce-warning success"
              style={{ display: "none" }}
            >
              <h3 className="warning-text">
                <span className="success-prefix">✅ Success! </span>
                <span className="warning-content">
                  {" "}
                  Wrote config to deploy folder.
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
                <th className="comment-table-header">
                  <div>Comment</div> <div className="resizer" />
                </th>
                {screenSize !== "small" &&
                  modes.map((mode) => (
                    <th key={mode}>
                      <div>{mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
                      <div className="resizer" />
                    </th>
                  ))}
                {screenSize === "small" && (
                  <th>
                    <div>
                      {currentMode.charAt(0).toUpperCase() +
                        currentMode.slice(1)}
                    </div>
                    <div className="resizer" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="parameter-table" ref={table}>
              {parameters.map((param) => (
                <tr key={param.key}>
                  <td>{param.key}</td>
                  <td>
                    <div>
                      <input value={param.comment}></input>
                    </div>
                  </td>
                  {screenSize !== "small" &&
                    param.values.map((value, i) => {
                      let type = paramToInputType(param.type);
                      return (
                        <td key={i}>
                          <div>
                            <input
                              key={value}
                              type={type}
                              onBlur={(e) => {
                                let newValues = [...param.values];
                                if (type === "checkbox")
                                  newValues[i] = e.currentTarget.checked
                                    ? "true"
                                    : "false";
                                else newValues[i] = e.currentTarget.value;
                                if (newValues[i] === param.values[i]) return;
                                setKey(
                                  [param.key, param.comment, ...newValues].join(
                                    ","
                                  )
                                );
                              }}
                              defaultValue={
                                type === "checkbox" ? undefined : value
                              }
                              checked={
                                type === "checkbox"
                                  ? value === "true"
                                  : undefined
                              }
                            ></input>
                          </div>
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OxConfigEditor;

function paramToInputType(typeRaw: string) {
  let type = typeRaw.toLowerCase();
  if (type == "boolean") return "checkbox";
  if (["integer", "short", "long", "double", "float"].includes(type))
    return "number";
  return "text";
}

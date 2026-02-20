import { useEffect, useRef, useState } from "react";
import { Parameter } from "./OxConfigProvider";
import { ScreenSize } from "./OxConfig";
import Modal from "../../hub/Modal";
import React from "react";
import useNTLive from "../../ntcore-react/useNTLive";

export interface OxConfigEditorProps {
  screenSize: ScreenSize;
  connected: boolean;
  modes: string[];
  displayParameters: Parameter[];
  setKey: (key: string) => void;
}

const OxConfigEditor: React.FC<OxConfigEditorProps> = ({
  screenSize,
  connected,
  modes,
  displayParameters,
  setKey,
}) => {
  const liveMode = useNTLive();
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

  let [openKey, setOpenKey] = useState<string | null>(null);

  return (
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
            <React.Fragment key={param.key}>
              {screenSize === "small" && (
                <Modal
                  isOpen={openKey === param.key}
                  onClose={() => setOpenKey(null)}
                  key={param.key}
                >
                  <h2 style={{ marginTop: 0, marginBottom: "15px" }}>
                    {param.key}
                  </h2>
                  <table className="data-table param-table">
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Comment</td>
                        <td>
                          <div>
                            <input
                              style={connected ? undefined : { color: "gray" }}
                              disabled={!connected || !liveMode}
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
                            />
                          </div>
                        </td>
                      </tr>

                      {param.values.map((value, i) => {
                        let inputElem = getInputElem(
                          param,
                          value,
                          i,
                          connected,
                          liveMode,
                          setKey
                        );
                        return (
                          <tr key={i}>
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
                    </tbody>
                  </table>
                  <button
                    style={{ width: "100%", marginTop: "15px" }}
                    onClick={() => setOpenKey(null)}
                  >
                    Close
                  </button>
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
                        disabled={!connected || !liveMode}
                        defaultValue={param.comment}
                        onBlur={(e) => {
                          if (param.comment === e.currentTarget.value) return;
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
                      liveMode,
                      setKey
                    );
                    return (
                      <td key={i}>
                        <div>{inputElem}</div>
                      </td>
                    );
                  })}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OxConfigEditor;

function getInputElem(
  param: Parameter,
  value: any,
  i: number,
  connected: boolean,
  liveMode: boolean,
  setKey: (key: string) => void
) {
  let type = paramToInputType(param.type);
  let update = (e: any) => {
    let newValues = [...param.values];
    if (type === "checkbox")
      newValues[i] = e.currentTarget.checked ? "true" : "false";
    else newValues[i] = e.currentTarget.value;
    setKey([param.key, param.comment, ...newValues].join(","));
  };
  let inputElem = (
    <input
      style={connected ? undefined : { color: "gray" }}
      disabled={!connected || !liveMode}
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

export function paramToInputType(typeRaw: string) {
  let type = typeRaw.toLowerCase();
  if (type == "boolean") return "checkbox";
  if (["integer", "short", "long", "double", "float"].includes(type))
    return "number";
  return "text";
}

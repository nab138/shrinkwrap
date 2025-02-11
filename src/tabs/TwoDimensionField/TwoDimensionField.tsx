import React, { useCallback, useEffect, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import Sidebar, { Setting } from "../../hub/Sidebar";
import { useStore } from "../../utils/StoreContext";
import { Item } from "../../hub/NetworkArrayConfig";
import Timeline from "../../hub/Timeline";
import "./TwoDimensionField.css";
import { fields } from "../ThreeDimensionField/Fields";
import { Layer, Stage } from "react-konva";
import FieldImage from "./FieldImage";
import Robot from "./Robot";
import Lines from "./Lines";
import Trajectory from "./Trajectory";
import Points from "./Points";

const TwoDimensionField: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const initialSettings: Setting[] = [
    {
      id: "field",
      label: "Field",
      type: "dropdown",
      value: "2025",
      options: fields.map((field) => field.year),
      displaySource: true,
    },
    {
      id: "elements",
      label: "Elements",
      type: "itemList",
      value: [],
      options: ["Robot", "Lines", "Points", "Trajectory"],
      ntTypes: ["double[]"],
    },
  ];

  const [settings, setSettings] = useStore<Setting[]>(
    params.id,
    initialSettings
  );

  const handleSettingChange = (
    id: string,
    value: boolean | string | number | Item[]
  ) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === id ? { ...setting, value: value as any } : setting
      )
    );
  };

  const getSettingValue = useCallback(
    (id: string) => {
      const setting = settings.find((setting) => setting.id === id);
      return setting ? setting.value : undefined;
    },
    [settings]
  );

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth - (sidebarOpen ? 250 : 0),
          height: containerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize(); // Initial call to set dimensions

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [sidebarOpen]);

  const [calcCoordinates, setCalcCoordinates] = useState<
    | ((
        translation: [number, number],
        alwaysFlipped: boolean
      ) => [number, number])
    | undefined
  >();

  const [fieldScale, setFieldScale] = useState<number>(1);

  return (
    <div className="pageContainer">
      <div
        style={{
          width: sidebarOpen ? "calc(100% - 250px)" : "calc(100% - 45px)",
          marginLeft: sidebarOpen ? "250px" : "45px",
          position: "relative",
        }}
      >
        <Timeline />
      </div>
      <div
        className={"twodfieldContainer" + (sidebarOpen ? " sidebar-open" : "")}
        ref={containerRef}
      >
        <Stage width={dimensions.width} height={dimensions.height}>
          <Layer>
            <FieldImage
              setFieldScale={setFieldScale}
              width={dimensions.width}
              height={dimensions.height}
              field={`${getSettingValue("field") ?? 2025}`}
              setCalcCoordinates={setCalcCoordinates}
            />
          </Layer>
          <Layer>
            {calcCoordinates &&
              (getSettingValue("elements") as Item[])
                .filter((item) => item.type === "Lines" && item.value != "")
                .map((item) => {
                  return (
                    <Lines
                      key={item.value}
                      ntKey={item.value}
                      calcCoordinates={calcCoordinates}
                      size={
                        fieldScale *
                        parseFloat(
                          item.options?.find((o) => o.label === "Thickness")
                            ?.value ?? "0.035"
                        )
                      }
                      color={
                        item.options?.find((o) => o.label === "Color")?.value ??
                        "black"
                      }
                    />
                  );
                })}
          </Layer>
          <Layer>
            {calcCoordinates &&
              (getSettingValue("elements") as Item[])
                .filter((item) => item.type === "Points" && item.value != "")
                .map((item) => {
                  return (
                    <Points
                      key={item.value}
                      ntKey={item.value}
                      calcCoordinates={calcCoordinates}
                      size={
                        fieldScale *
                        parseFloat(
                          item.options?.find((o) => o.label === "Size")
                            ?.value ?? "0.05"
                        )
                      }
                      color={
                        item.options?.find((o) => o.label === "Color")?.value ??
                        "black"
                      }
                    />
                  );
                })}
          </Layer>

          <Layer>
            {calcCoordinates &&
              (getSettingValue("elements") as Item[])
                .filter((item) => item.type === "Robot" && item.value != "")
                .map((item) => {
                  return (
                    <Robot
                      key={item.value}
                      ntKey={item.value}
                      calcCoordinates={calcCoordinates}
                      scale={fieldScale}
                      bumperLength={parseFloat(
                        item.options?.find(
                          (o) => o.label === "Bumper Length (m)"
                        )?.value ?? "0.92"
                      )}
                      bumperWidth={parseFloat(
                        item.options?.find(
                          (o) => o.label === "Bumper Width (m)"
                        )?.value ?? "0.92"
                      )}
                    />
                  );
                })}
          </Layer>
          <Layer>
            {calcCoordinates &&
              (getSettingValue("elements") as Item[])
                .filter(
                  (item) => item.type === "Trajectory" && item.value != ""
                )
                .map((item) => {
                  return (
                    <Trajectory
                      key={item.value}
                      ntKey={item.value}
                      calcCoordinates={calcCoordinates}
                      size={
                        fieldScale *
                        parseFloat(
                          item.options?.find((o) => o.label === "Thickness")
                            ?.value ?? "0.035"
                        )
                      }
                      color={
                        item.options?.find((o) => o.label === "Color")?.value ??
                        "black"
                      }
                    />
                  );
                })}
          </Layer>
        </Stage>
      </div>
      <Sidebar
        tabId={params.id}
        title="Field Settings"
        settings={settings}
        onSettingChange={handleSettingChange}
        collapsible={true}
        onOpenDidChange={setSidebarOpen}
        defaultArrayOptions={{
          Lines: [
            {
              type: "color",
              value: "#000000",
              label: "Color",
            },
            {
              type: "number",
              value: "0.035",
              label: "Thickness",
            },
          ],
          Points: [
            {
              type: "color",
              value: "#000000",
              label: "Color",
            },
            {
              type: "number",
              value: "0.05",
              label: "Size",
            },
          ],
          Trajectory: [
            {
              type: "color",
              value: "#ff9100",
              label: "Color",
            },
            {
              type: "number",
              value: "0.05",
              label: "Thickness",
            },
          ],
          Robot: [
            {
              type: "number",
              value: "0.92",
              label: "Bumper Width (m)",
            },
            {
              type: "number",
              value: "0.92",
              label: "Bumper Length (m)",
            },
          ],
        }}
      />
    </div>
  );
};

export default TwoDimensionField;

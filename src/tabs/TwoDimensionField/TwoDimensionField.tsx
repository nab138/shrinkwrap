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
import { Vector2d } from "konva/lib/types";

const TwoDimensionField: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const initialSettings: Setting[] = [
    {
      id: "field",
      label: "Field",
      type: "dropdown",
      value: "2026",
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
    initialSettings,
  );

  const handleSettingChange = (
    id: string,
    value: boolean | string | number | Item[],
  ) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === id ? { ...setting, value: value as any } : setting,
      ),
    );
  };

  const getSettingValue = useCallback(
    (id: string) => {
      const setting = settings.find((setting) => setting.id === id);
      return setting ? setting.value : undefined;
    },
    [settings],
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
        alwaysFlipped: boolean,
      ) => [number, number])
    | undefined
  >();

  const [fieldScale, setFieldScale] = useState<number>(1);
  const [stageScale, setStageScale] = useState<number>(1);
  const [stagePosition, setStagePosition] = useState<Vector2d>({ x: 0, y: 0 });

  const stageRef = React.useRef<any>(null);
  const pinchDistanceRef = React.useRef<number | null>(null);

  const applyScaleAtPoint = useCallback(
    (point: Vector2d, nextScaleRaw: number) => {
      const oldScale = stageScale;
      const nextScale = Math.max(0.35, Math.min(4, nextScaleRaw));

      const pointTo = {
        x: (point.x - stagePosition.x) / oldScale,
        y: (point.y - stagePosition.y) / oldScale,
      };

      setStageScale(nextScale);
      setStagePosition({
        x: point.x - pointTo.x * nextScale,
        y: point.y - pointTo.y * nextScale,
      });
    },
    [stagePosition, stageScale],
  );

  const resetView = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = (event: any) => {
    event.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextScaleUnclamped =
      direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    applyScaleAtPoint(pointer, nextScaleUnclamped);
  };

  const handleTouchMove = (event: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const touches = event.evt.touches;
    if (!touches || touches.length !== 2) return;

    event.evt.preventDefault();
    stage.draggable(false);

    const rect = stage.container().getBoundingClientRect();
    const touch1 = touches[0];
    const touch2 = touches[1];

    const point1 = {
      x: touch1.clientX - rect.left,
      y: touch1.clientY - rect.top,
    };
    const point2 = {
      x: touch2.clientX - rect.left,
      y: touch2.clientY - rect.top,
    };

    const center = {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
    };

    const distance = Math.hypot(point2.x - point1.x, point2.y - point1.y);
    if (pinchDistanceRef.current === null) {
      pinchDistanceRef.current = distance;
      return;
    }

    if (pinchDistanceRef.current > 0) {
      const scaleFactor = distance / pinchDistanceRef.current;
      applyScaleAtPoint(center, stageScale * scaleFactor);
    }

    pinchDistanceRef.current = distance;
  };

  const handleTouchEnd = () => {
    const stage = stageRef.current;
    if (stage) {
      stage.draggable(true);
    }
    pinchDistanceRef.current = null;
  };

  useEffect(() => {
    resetView();
  }, [getSettingValue("field"), resetView]);

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
        <button className="twodfield-reset-view" onClick={resetView}>
          Reset View
        </button>
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          draggable
          onDragEnd={(event) => {
            setStagePosition(event.currentTarget.position());
          }}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
        >
          <Layer>
            <FieldImage
              setFieldScale={setFieldScale}
              width={dimensions.width}
              height={dimensions.height}
              field={`${getSettingValue("field") ?? 2026}`}
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
                            ?.value ?? "0.035",
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
                            ?.value ?? "0.1",
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
                          (o) => o.label === "Bumper Length (m)",
                        )?.value ?? "0.92",
                      )}
                      bumperWidth={parseFloat(
                        item.options?.find(
                          (o) => o.label === "Bumper Width (m)",
                        )?.value ?? "0.92",
                      )}
                    />
                  );
                })}
          </Layer>
          <Layer>
            {calcCoordinates &&
              (getSettingValue("elements") as Item[])
                .filter(
                  (item) => item.type === "Trajectory" && item.value != "",
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
                            ?.value ?? "0.035",
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
              value: "0.1",
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

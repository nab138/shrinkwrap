import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import chroma from "chroma-js";
import { useStateMachine } from "./StateMachineContext";
import "./ResizableNodeSelected.css"; // Import the CSS file

export interface ResizableNodeSelectedProps {
  data: any;
  selected: boolean;
}

const colorsForLayers = [
  "#ff0071",
  "#00e3ae",
  "#ffcc00",
  "#ff0071",
  "#00e3ae",
  "#00aaff",
  "#ffcc00",
];

const darkModeColors = colorsForLayers.map((color) =>
  chroma(color).darken(0.4).desaturate(0.6).hex()
);

const lightModeColors = colorsForLayers.map((color) => chroma(color).hex());

const activeColor = "#14ff24";
const ResizableNodeSelected: React.FC<ResizableNodeSelectedProps> = ({
  data,
  selected,
}) => {
  const { activeState, lightMode } = useStateMachine();
  const isActive = activeState === data.id;
  const colorIndex = data.id.split("/").length - 1;
  return (
    <>
      <NodeResizer
        color="#ff0071"
        isVisible={selected}
        minWidth={100}
        minHeight={30}
      />
      <Handle type="target" position={Position.Left} />
      <div
        className={`resizable-node ${isActive ? "active" : ""}`}
        style={{
          padding: 10,
          backgroundColor: isActive
            ? activeColor
            : (lightMode
                ? lightModeColors[colorIndex]
                : darkModeColors[colorIndex]) + "aa",
          height: "100%",
          boxSizing: "border-box",
          borderRadius: "5px",
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default memo(ResizableNodeSelected);

import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";

export interface ResizableNodeSelectedProps {
  data: any;
  selected: boolean;
}

const colorsForLayers = [
  "#ff0071",
  "#00e3ae",
  "#00aaff",
  "#ffcc00",
  "#ff0071",
  "#00e3ae",
  "#00aaff",
  "#ffcc00",
];

const ResizableNodeSelected: React.FC<ResizableNodeSelectedProps> = ({
  data,
  selected,
}) => {
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
        style={{
          padding: 10,
          backgroundColor:
            colorsForLayers[data.id.split("/").length - 1] + "aa",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default memo(ResizableNodeSelected);

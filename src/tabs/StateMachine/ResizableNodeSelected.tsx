import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";

export interface ResizableNodeSelectedProps {
  data: any;
  selected: boolean;
}
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
            "color-mix(in srgb, var(--background-color-2), transparent 40%)",
          height: "100%",
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default memo(ResizableNodeSelected);

import {
  ReactFlow,
  Controls,
  Background,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  Edge,
  EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../../utils/StoreContext";
import { useCallback, useEffect, useState } from "react";
import ResizableNodeSelected from "./ResizableNodeSelected";
import PositionableEdge from "./PositionableEdge.jsx";

export interface StateNode {
  name: string;
  children?: StateNode[];
  transitions?: { target: string; name: string }[];
}

interface StateMachineGraphProps {
  data: StateNode;
  width: number;
  height: number;
}

const StateMachineGraph: React.FC<StateMachineGraphProps> = ({ data }) => {
  const [theme] = useStore<"light" | "dark" | "abyss">("theme", "light");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  useEffect(() => {
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    // Recursively add all children of the root and children of each child
    let addNodes = (node: StateNode, parentId?: string) => {
      if (!node || !node.name) return;
      let nodeName: string | string[] = node.name.split("/");
      nodeName = nodeName[nodeName.length - 1];
      nodes.push({
        id: node.name,
        data: { label: nodeName },
        position: { x: 0, y: 0 },
        parentId: parentId || undefined,
        expandParent: true,
        type: "ResizableNodeSelected",
      });
      (node.transitions ?? []).forEach((transition) =>
        edges.push({
          id: transition.name + transition.target + node.name,
          source: node.name,
          target: transition.target,
          label: transition.name,
          type: "PositionableEdge",
        })
      );
      if (node.children) {
        node.children.forEach((child) => addNodes(child, node.name));
      }
    };
    addNodes(data);
    setNodes(nodes);
    setEdges(edges);
  }, [data]);

  return (
    <div style={{ height: "100%", width: "100%", margin: 0, padding: 0 }}>
      <ReactFlow
        colorMode={theme === "abyss" ? "dark" : theme}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        edgeTypes={{ PositionableEdge }}
        nodeTypes={{ ResizableNodeSelected }}
        elementsSelectable={true}
        deleteKeyCode={null}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default StateMachineGraph;

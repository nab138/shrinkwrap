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
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StoreContext, useStore } from "../../utils/StoreContext";
import { useCallback, useContext, useEffect, useState } from "react";
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

interface SavedEdgeData {
  id: string;
  positionHandlers: { x: number; y: number }[];
}

interface SavedNodeData {
  position: { x: number; y: number };
  width: number;
  height: number;
  id: string;
}

const StateMachineGraph: React.FC<StateMachineGraphProps> = ({ data }) => {
  const [theme] = useStore<"light" | "dark" | "abyss">("theme", "light");
  const { storeInitialized, storeValues, setStoreValue } =
    useContext(StoreContext);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      if (storeInitialized)
        setStoreValue(
          "stateMachineNodes",
          nodes.map((node) => ({
            id: node.id,
            position: node.position,
            width: node.width,
            height: node.height,
          }))
        );
    },
    [setStoreValue, storeInitialized, nodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        if (storeInitialized) {
          setStoreValue(
            "stateMachineEdges",
            newEdges.map((edge) => ({
              id: edge.id,
              positionHandlers: edge.data?.positionHandlers || [],
            }))
          );
        }
        return newEdges;
      });
    },
    [setStoreValue, storeInitialized]
  );

  useEffect(() => {
    if (!storeInitialized) return;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    const levelHeight = 100;
    const siblingSpacing = 150;

    let savedNodes: SavedNodeData[] = storeValues.stateMachineNodes ?? [];
    let savedEdges: SavedEdgeData[] = storeValues.stateMachineEdges ?? [];

    const addNodes = (
      node: StateNode,
      parentId?: string,
      depth = 0,
      xOffset = 0,
      yOffset = 0
    ) => {
      if (!node || !node.name) return;
      let nodeName: string | string[] = node.name.split("/");
      nodeName = nodeName[nodeName.length - 1];
      let savedNode = savedNodes.find((n) => n.id === node.name) ?? {
        id: node.name,
        position: { x: xOffset, y: yOffset },
        width: undefined,
        height: undefined,
      };
      nodes.push({
        id: node.name,
        data: { label: nodeName, id: node.name },
        width: savedNode.width,
        height: savedNode.height,
        position: savedNode.position,
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
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: "#000",
          },
          markerStart: {
            type: MarkerType.Arrow,
            width: 25,
            height: 25,
            color: "#000",
          },
          data: {
            label: transition.name,
            type: "straight",
            positionHandlers:
              savedEdges.find(
                (e) => e.id === transition.name + transition.target + node.name
              )?.positionHandlers || [],
          },
        })
      );
      if (node.children) {
        let childXOffset = xOffset;
        let childYOffset = yOffset + levelHeight;
        node.children.forEach((child) => {
          addNodes(child, node.name, depth + 1, childXOffset, childYOffset);
          childXOffset += siblingSpacing;
        });
      }
    };
    addNodes(data);
    setNodes(nodes);
    setEdges(edges);
  }, [data, storeInitialized]);

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
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        connectOnClick={false}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default StateMachineGraph;

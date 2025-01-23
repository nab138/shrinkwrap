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
  data: StateNode | null;
  width: number;
  height: number;
}

const StateMachineGraph: React.FC<StateMachineGraphProps> = ({ data }) => {
  const [theme] = useStore<"light" | "dark" | "abyss">("theme", "light");
  const [savedNodes, setSavedNodes] = useStore<Node[]>("savedNodes", []);
  const [savedEdges, setSavedEdges] = useStore<Edge[]>("savedEdges", []);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        setSavedNodes(updatedNodes); // Save user-updated nodes
        return updatedNodes;
      });
    },
    [setSavedNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        setSavedEdges(updatedEdges); // Save user-updated edges
        return updatedEdges;
      });
    },
    [setSavedEdges]
  );

  useEffect(() => {
    if (!data) return; // Do nothing if data is still null or empty

    const parseData = () => {
      let newNodes: Node[] = [];
      let newEdges: Edge[] = [];
      const levelHeight = 100;
      const siblingSpacing = 150;

      const addNodes = (
        node: StateNode,
        parentId?: string,
        depth = 0,
        xOffset = 0,
        yOffset = 0
      ) => {
        if (!node || !node.name) return;

        // Check for saved node positions
        const savedNode = savedNodes.find((n) => n.id === node.name);
        newNodes.push(
          savedNode || {
            id: node.name,
            data: { label: node.name, id: node.name },
            position: { x: xOffset, y: yOffset },
            parentId: parentId || undefined,
            expandParent: true,
            type: "ResizableNodeSelected",
          }
        );

        // Add edges
        (node.transitions ?? []).forEach((transition) => {
          const savedEdge = savedEdges.find(
            (e) => e.id === `${transition.name}${transition.target}${node.name}`
          );
          newEdges.push(
            savedEdge || {
              id: transition.name + transition.target + node.name,
              source: node.name,
              target: transition.target,
              label: transition.name,
              type: "PositionableEdge",
              data: {
                label: transition.name,
                type: "straight",
                positionHandlers: [],
              },
            }
          );
        });

        // Add child nodes
        if (node.children) {
          let childXOffset = xOffset;
          let childYOffset = yOffset + levelHeight;
          node.children.forEach((child) => {
            addNodes(child, node.name, depth + 1, childXOffset, childYOffset);
            childXOffset += siblingSpacing;
          });
        }
      };

      // Build nodes and edges
      addNodes(data);

      setNodes(newNodes);
      setEdges(newEdges);
    };

    parseData();
  }, [data, savedNodes, savedEdges]);

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
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default StateMachineGraph;

import "./StateVisualizer.css";
import Timeline from "../hub/Timeline";
import React, { useEffect, useState } from "react";
import { useComputedNTValue, useNTValue } from "../ntcore-react/useNTValue";
import {
  ConnectionLineType,
  Node,
  Edge,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

type Transition = {
  name: string;
  target: string;
};

type StateNode = {
  name: string;
  children: StateNode[];
  transitions?: Transition[];
};

type LastTransition = {
  from: string;
  to: string;
  name: string;
};

const nodeWidth = 200;
const nodeHeight = 100;

const StateVisualizer: React.FC = () => {
  const activeState = useNTValue<string>(
    "/SmartDashboard/CurrentState",
    "/Root"
  );
  const stateTree = useComputedNTValue<string, StateNode>(
    "/SmartDashboard/State Tree",
    JSON.parse,
    JSON.stringify({
      name: "Not Connected",
      children: [],
      transitions: [],
    })
  );
  const lastTransition = useComputedNTValue<string, LastTransition | null>(
    "lastTransition",
    (value) => (value && value !== "" ? JSON.parse(value) : null),
    ""
  );

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const applyDagreLayout = (
    nodes: Node[],
    edges: Edge[]
  ): { nodes: Node[]; edges: Edge[] } => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph layout direction and spacing
    dagreGraph.setGraph({
      rankdir: "TB", // Top-to-bottom
      nodesep: 50, // Horizontal spacing
      ranksep: 100, // Vertical spacing
    });

    // Add nodes to Dagre graph
    nodes.forEach((node) => {
      if (!node.id) {
        console.error("Node missing 'id':", node);
        return;
      }
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Add edges to Dagre graph
    edges.forEach((edge) => {
      if (!edge.source || !edge.target) {
        console.error("Edge missing 'source' or 'target':", edge);
        return;
      }
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Perform the layout
    dagre.layout(dagreGraph);

    // Update node positions
    const updatedNodes = nodes.map((node) => {
      const dagreNode = dagreGraph.node(node.id);
      if (!dagreNode) {
        console.warn(`Dagre failed to layout node with id '${node.id}'`);
        return node; // Keep node unchanged if Dagre layout fails
      }
      return {
        ...node,
        position: {
          x: dagreNode.x - nodeWidth / 2,
          y: dagreNode.y - nodeHeight / 2,
        },
      };
    });

    return { nodes: updatedNodes, edges };
  };

  // Updated parseStateTree
  const parseStateTree = (
    node: StateNode,
    parentPath: string = ""
  ): { nodes: Node[]; edges: Edge[] } => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

    const currentNodes: Node[] = [
      {
        id: currentPath,
        data: { label: node.name },
        position: { x: 0, y: 0 }, // Position set by Dagre
        style:
          currentPath === activeState
            ? { border: "2px solid #007BFF", backgroundColor: "#D4F1FF22" }
            : { backgroundColor: "#FFFFFF22" },
        expandParent: true,

        parentId: parentPath || undefined,
      },
    ];

    const currentEdges: Edge[] = (node.transitions || []).map((transition) => ({
      id: `${currentPath}->${transition.target}`,
      source: currentPath,
      target: transition.target,
      label: transition.name,
      animated:
        lastTransition?.to === transition.target &&
        lastTransition?.from === currentPath,
      style:
        lastTransition?.to === transition.target &&
        lastTransition?.from === currentPath
          ? { stroke: "#FF5733" }
          : {},
    }));

    const childResults = node.children.map((child) =>
      parseStateTree(child, currentPath)
    );

    const childNodes = childResults.flatMap((result) => result.nodes);
    const childEdges = childResults.flatMap((result) => result.edges);

    return {
      nodes: [...currentNodes, ...childNodes],
      edges: [...currentEdges, ...childEdges],
    };
  };

  // Use Effect
  useEffect(() => {
    if (stateTree) {
      const { nodes, edges } = parseStateTree(stateTree);
      const layoutedGraph = applyDagreLayout(nodes, edges);
      setNodes(layoutedGraph.nodes);
      setEdges(layoutedGraph.edges);
    }
  }, [stateTree, activeState, lastTransition]);

  return (
    <div className="pageContainer">
      <div
        style={{
          width: "calc(100%)",
          position: "relative",
          zIndex: 99999,
        }}
      >
        <Timeline />
      </div>
      <div style={{ height: "100%", width: "100%" }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            connectionLineType={ConnectionLineType.SmoothStep}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default StateVisualizer;

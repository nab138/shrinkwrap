import React, { useRef } from "react";

export interface StateNode {
  name: string;
  children?: StateNode[];
  transitions?: { target: string }[];
}

interface StateMachineGraphProps {
  data: StateNode;
  width: number;
  height: number;
}

const StateMachineGraph: React.FC<StateMachineGraphProps> = ({
  data,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default StateMachineGraph;

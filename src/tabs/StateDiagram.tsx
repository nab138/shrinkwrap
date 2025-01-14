import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface StateNode extends d3.SimulationNodeDatum {
  name: string;
  children?: StateNode[];
  transitions?: { target: string }[];
  width?: number;
  height?: number;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<StateNode, undefined> | null>(
    null
  );

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const { simulation } = drawNode(data, width / 2, height / 2, svg);
    simulationRef.current = simulation;

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        margin: 0,
        padding: 0,
      }}
    />
  );
};

export default StateMachineGraph;

function drawNode(
  node: StateNode,
  x: number,
  y: number,
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
) {
  let deepest = 0;
  const nodes: StateNode[] = [];
  const links: { source: StateNode; target: StateNode }[] = [];
  const parentMap = new Map<StateNode, StateNode>();

  function traverse(node: StateNode, parent?: StateNode, depth = 1) {
    if (deepest < depth) deepest = depth;

    nodes.push(node);
    if (parent) {
      parentMap.set(node, parent);
    }

    for (const transition of node.transitions || []) {
      const target = nodes.find((n) => n.name === transition.target);
      if (target) {
        links.push({ source: node, target });
      }
    }
    if (node.children) {
      node.children.forEach((child) => traverse(child, node, depth + 1));
    }
    let size = calculateNodeSize(node, x * 2, y * 2);
    node.width = size.width;
    node.height = size.height;
  }

  traverse(node);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(
          links.filter(
            (l) =>
              l.source.name.split("/").shift() ===
              l.target.name.split("/").shift()
          )
        )
        .distance(
          (l) =>
            ((deepest - l.source.name.split("/").length + 1) * 500 +
              l.source.width! +
              l.target.width!) /
            4
        )
      //.strength(0.02)
    )
    .force("charge", d3.forceManyBody().strength(-100))
    //.force("collision", () => collide(nodes, 10, parentMap))
    .force("parent", parentForce(parentMap, x, y, node))
    .on("tick", ticked);

  const linkSelection = svg
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#999")
    .attr("stroke-width", 2);

  const nodeSelection = svg
    .selectAll("rect")
    .data(nodes)
    .enter()
    .append("rect")
    .attr("width", (d) => d.width ?? 60)
    .attr("height", (d) => d.height ?? 60)
    .attr("fill", (d) =>
      (d.children ?? []).length > 0 ? "#69b3a230" : "#69b3a2"
    )

    .attr("stroke", "#3c665c")
    .call(
      d3
        .drag<SVGRectElement, StateNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  const textSelection = svg
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("dy", "-0.5em") // Adjust this value to position the text above the rectangle
    .attr("text-anchor", "middle")
    .text((d) => (d.name || "").split("/").pop() ?? d.name);

  function ticked() {
    linkSelection
      .attr("x1", (d) => d.source.x!)
      .attr("y1", (d) => d.source.y!)
      .attr("x2", (d) => d.target.x!)
      .attr("y2", (d) => d.target.y!);

    nodeSelection
      .attr("x", (d) => d.x! - (d.width ?? 40) / 2)
      .attr("y", (d) => d.y! - (d.height ?? 40) / 2);

    textSelection
      .attr("x", (d) => d.x!)
      .attr("y", (d) => d.y! - (d.height ?? 40) / 2 + 25); // Adjust the value to position the text above the rectangle
  }

  function dragstarted(event: any, d: StateNode) {
    if (d.name === "Root") return;
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: any, d: StateNode) {
    if (d.name === "Root") return;
    let parent = parentMap.get(d);
    if (parent) {
      d.fx = clamp(
        event.x,
        parent.x! - parent.width! / 2 + d.width! / 2,
        parent.x! + parent.width! / 2 - d.width! / 2
      );
      d.fy = clamp(
        event.y,
        parent.y! - parent.height! / 2 + d.height! / 2 + 20,
        parent.y! + parent.height! / 2 - d.height! / 2
      );
    } else {
      d.fx = event.x;
      d.fy = event.y;
    }
  }

  function dragended(event: any, d: StateNode) {
    if (d.name === "Root") return;
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return { simulation, linkSelection, nodeSelection, textSelection };
}

function parentForce(
  parentMap: Map<StateNode, StateNode>,
  centerX: number,
  centerY: number,
  root: StateNode
) {
  return (alpha: number) => {
    if (root.x == undefined) root.x = 0;
    if (root.y == undefined) root.y = 0;
    if (root.vx == undefined) root.vx = 0;
    if (root.vy == undefined) root.vy = 0;
    root.vx -= (root.x - centerX) * alpha * 0.5;
    root.vy -= (root.y - centerY) * alpha * 0.5;

    let handleChildCollisions = (node: StateNode) => {
      // Ensure children don't intersect each other
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < (node.children ?? []).length; i++) {
          let child = node.children![i];
          if (child.x == undefined) child.x = 0;
          if (child.y == undefined) child.y = 0;
          if (child.width == undefined) child.width = 60;
          if (child.height == undefined) child.height = 60;
          for (let j = i + 1; j < (node.children ?? []).length; j++) {
            let otherChild = node.children![j];
            if (otherChild.x == undefined) otherChild.x = 0;
            if (otherChild.y == undefined) otherChild.y = 0;
            if (otherChild.width == undefined) otherChild.width = 60;
            if (otherChild.height == undefined) otherChild.height = 60;

            // Proper rectangle collision detection and resolution
            let dx = child.x - otherChild.x;
            let dy = child.y - otherChild.y;
            let dw = (child.width + otherChild.width) / 2;
            let dh = (child.height + otherChild.height) / 2;
            if (Math.abs(dx) < dw && Math.abs(dy) < dh) {
              let ox = dw - Math.abs(dx);
              let oy = dh - Math.abs(dy);
              if (ox < oy) {
                if (dx > 0) {
                  child.x += ox / 2;
                  otherChild.x -= ox / 2;
                } else {
                  child.x -= ox / 2;
                  otherChild.x += ox / 2;
                }
              } else {
                if (dy > 0) {
                  child.y += oy / 2;
                  otherChild.y -= oy / 2;
                } else {
                  child.y -= oy / 2;
                  otherChild.y += oy / 2;
                }
              }
            }
          }
        }
      }

      // Recurse
      for (const child of node.children ?? []) {
        handleChildCollisions(child);
      }
    };

    handleChildCollisions(root);

    parentMap.forEach((parent, node) => {
      if (node.x == undefined) node.x = 0;
      if (node.y == undefined) node.y = 0;
      if (parent.x == undefined) parent.x = 0;
      if (parent.y == undefined) parent.y = 0;
      if (parent.width == undefined) parent.width = 60;
      if (parent.height == undefined) parent.height = 60;
      if (node.width == undefined) node.width = 60;
      if (node.height == undefined) node.height = 60;
      node.x = clamp(
        node.x,
        parent.x - parent.width / 2 + node.width / 2,
        parent.x + parent.width / 2 - node.width / 2
      );
      node.y = clamp(
        node.y,
        parent.y - parent.height / 2 + node.height / 2 + 20,
        parent.y + parent.height / 2 - node.height / 2
      );

      // if (node.vx == undefined) node.vx = 0;
      // if (node.vy == undefined) node.vy = 0;
      // // Apply
      // node.vx -= dx * alpha * 0.01;
      // node.vy -= dy * alpha * 0.01;
    });
  };
}

function calculateNodeSize(node: StateNode, w: number, h: number) {
  if (node.name === "Root") return { width: w - 2, height: h - 2 };
  let size = { width: 50, height: 50 };
  for (const child of node.children ?? []) {
    let childSize = calculateNodeSize(child, w, h);
    size.width = Math.max(
      size.width +
        (childSize.width * 1.1) / Math.log((node.children ?? []).length),
      childSize.width
    );
    size.height = Math.max(
      size.height +
        (childSize.height * 1.1) / Math.log((node.children ?? []).length),
      childSize.height
    );
  }
  // Measure svg text width, then ensure that the node is at least that wide
  let textWidth =
    measureText((node.name ?? "").split("/").pop() ?? node.name) + 20;
  size.width = Math.max(size.width, textWidth);
  return size;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function measureText(text: string): number {
  // Create a temporary SVG element
  const svg = d3.select("body").append("svg").attr("class", "temp-svg");

  // Add a text element to the SVG
  const textElement = svg
    .append("text")
    .attr("dy", "-0.5em") // Adjust this value to position the text above the rectangle
    .attr("text-anchor", "middle")
    .text(text);

  // Measure the text element's width
  const width = textElement.node()?.getComputedTextLength() ?? 0;

  // Remove the temporary SVG element
  svg.remove();

  return width;
}

// function rectCollide() {
//   let nodes: any, sizes: any, masses: any;
//   let size = constant([0, 0]);
//   let strength = 1;
//   let iterations = 1;

//   function force() {
//     let node: any, size: any, mass: any, xi: any, yi: any;
//     let i = -1;
//     while (++i < iterations) {
//       iterate();
//     }

//     function iterate() {
//       let j = -1;
//       let tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare);

//       while (++j < nodes.length) {
//         node = nodes[j];
//         size = sizes[j];
//         mass = masses[j];
//         xi = xCenter(node);
//         yi = yCenter(node);

//         tree.visit(apply);
//       }
//     }

//     function apply(quad: any, x0: any, y0: any, x1: any, y1: any) {
//       let data = quad.data;
//       let xSize = (size[0] + quad.size[0]) / 2;
//       let ySize = (size[1] + quad.size[1]) / 2;
//       if (data) {
//         if (data.index <= node.index) {
//           return;
//         }

//         let x = xi - xCenter(data);
//         let y = yi - yCenter(data);
//         let xd = Math.abs(x) - xSize;
//         let yd = Math.abs(y) - ySize;

//         if (xd < 0 && yd < 0) {
//           let l = Math.sqrt(x * x + y * y);
//           let m = masses[data.index] / (mass + masses[data.index]);

//           if (Math.abs(xd) < Math.abs(yd)) {
//             node.vx -= (x *= (xd / l) * strength) * m;
//             data.vx += x * (1 - m);
//           } else {
//             node.vy -= (y *= (yd / l) * strength) * m;
//             data.vy += y * (1 - m);
//           }
//         }
//       }

//       return (
//         x0 > xi + xSize || y0 > yi + ySize || x1 < xi - xSize || y1 < yi - ySize
//       );
//     }

//     function prepare(quad: any) {
//       if (quad.data) {
//         quad.size = sizes[quad.data.index];
//       } else {
//         quad.size = [0, 0];
//         let i = -1;
//         while (++i < 4) {
//           if (quad[i] && quad[i].size) {
//             quad.size[0] = Math.max(quad.size[0], quad[i].size[0]);
//             quad.size[1] = Math.max(quad.size[1], quad[i].size[1]);
//           }
//         }
//       }
//     }
//   }

//   function xCenter(d: any) {
//     return d.x + d.vx + sizes[d.index][0] / 2;
//   }
//   function yCenter(d: any) {
//     return d.y + d.vy + sizes[d.index][1] / 2;
//   }

//   force.initialize = function (_: any) {
//     sizes = (nodes = _).map(size);
//     masses = sizes.map(function (d: any) {
//       return d[0] * d[1];
//     });
//   };

//   force.size = function (_: any) {
//     return arguments.length
//       ? ((size = typeof _ === "function" ? _ : constant(_)), force)
//       : size;
//   };

//   force.strength = function (_: any) {
//     return arguments.length ? ((strength = +_), force) : strength;
//   };

//   force.iterations = function (_: any) {
//     return arguments.length ? ((iterations = +_), force) : iterations;
//   };

//   return force;
// }

// function constant(_: any) {
//   return function () {
//     return _;
//   };
// }

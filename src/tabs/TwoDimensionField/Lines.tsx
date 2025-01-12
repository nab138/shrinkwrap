import { Group, Line } from "react-konva";
import { useNTValue } from "../../ntcore-react/useNTValue";
import { useEffect, useState } from "react";

export interface LinesProps {
  ntKey: string;
  calcCoordinates: (
    translation: [number, number],
    alwaysFlipped: boolean
  ) => [number, number];
  scale: number;
}

const Lines: React.FC<LinesProps> = ({ ntKey, calcCoordinates, scale }) => {
  const rawCoordinates = useNTValue<number[]>(ntKey, [-99, -99, -99], 0.001);
  const [lines, setLines] = useState<[[number, number], [number, number]][]>(
    []
  );
  useEffect(() => {
    let coords: [[number, number], [number, number]][] = [];
    if (rawCoordinates.length % 6 !== 0) {
      console.warn("Invalid lines data");
    }
    for (let i = 0; i < rawCoordinates.length; i += 6) {
      if (i + 5 >= rawCoordinates.length) {
        break;
      }
      coords.push([
        calcCoordinates([rawCoordinates[i], rawCoordinates[i + 1]], false),
        calcCoordinates([rawCoordinates[i + 3], rawCoordinates[i + 4]], false),
      ]);
    }
    setLines(coords);
  }, [rawCoordinates, calcCoordinates]);

  return (
    <Group>
      {lines.map((line) => (
        <Line
          points={[line[0][0], line[0][1], line[1][0], line[1][1]]}
          stroke="black"
          strokeWidth={scale * 0.035}
          lineCap="round"
        />
      ))}
    </Group>
  );
};

export default Lines;

import { Circle, Group } from "react-konva";
import { useNTValue } from "../../ntcore-react/useNTValue";
import { useEffect, useState } from "react";

export interface PointsProps {
  ntKey: string;
  calcCoordinates: (
    translation: [number, number],
    alwaysFlipped: boolean
  ) => [number, number];
  size: number;
  color: string;
}

const Points: React.FC<PointsProps> = ({
  ntKey,
  calcCoordinates,
  size,
  color,
}) => {
  const rawCoordinates = useNTValue<number[]>(ntKey, [-99, -99, -99], 0.01);
  const [Points, setPoints] = useState<[number, number][]>([]);
  useEffect(() => {
    let coords: [number, number][] = [];
    if (rawCoordinates.length % 3 !== 0) {
      console.warn("Invalid Points data");
    }
    for (let i = 0; i < rawCoordinates.length; i += 3) {
      if (i + 2 >= rawCoordinates.length) {
        break;
      }
      coords.push(
        calcCoordinates([rawCoordinates[i], rawCoordinates[i + 1]], false)
      );
    }
    setPoints(coords);
  }, [rawCoordinates, calcCoordinates]);

  return (
    <Group>
      {Points.map((line, i) => (
        <Circle
          key={i}
          x={line[0]}
          y={line[1]}
          fill={color}
          radius={Math.abs(size / 2)}
        />
      ))}
    </Group>
  );
};

export default Points;

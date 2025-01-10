import React, { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Field, fields } from "../ThreeDimensionField/Fields";

export interface FieldImageProps {
  field: string;
  width: number;
  height: number;
}

const FieldImage: React.FC<FieldImageProps> = ({
  field: fieldName,
  width,
  height,
}) => {
  const [image] = useImage("/2dfields/Field2d_" + fieldName + ".png");
  const [renderValues, setRenderValues] = useState<number[]>([]);

  const [field, setField] = useState<Field | undefined>(
    fields.find((f) => f.year == fieldName)
  );
  useEffect(() => {
    setField(fields.find((f) => f.year == fieldName));
  }, [fieldName]);

  useEffect(() => {
    if (image && field) {
      let fieldWidth =
        field.imageData.bottomRight[0] - field.imageData.topLeft[0];
      let fieldHeight =
        field.imageData.bottomRight[1] - field.imageData.topLeft[1];

      let topMargin = field.imageData.topLeft[1];
      let bottomMargin = image.height - field.imageData.bottomRight[1];
      let leftMargin = field.imageData.topLeft[0];
      let rightMargin = image.width - field.imageData.bottomRight[0];

      let margin = Math.min(topMargin, bottomMargin, leftMargin, rightMargin);
      let extendedFieldWidth = fieldWidth + margin * 2;
      let extendedFieldHeight = fieldHeight + margin * 2;
      let constrainHeight =
        width / height > extendedFieldWidth / extendedFieldHeight;
      let imageScalar: number;
      if (constrainHeight) {
        imageScalar = height / extendedFieldHeight;
      } else {
        imageScalar = width / extendedFieldWidth;
      }
      let fieldCenterX = fieldWidth * 0.5 + field.imageData.topLeft[0];
      let fieldCenterY = fieldHeight * 0.5 + field.imageData.topLeft[1];
      let renderValues = [
        Math.floor(width * 0.5 - fieldCenterX * imageScalar), // X (normal)
        Math.floor(height * 0.5 - fieldCenterY * imageScalar), // Y (normal)
        Math.ceil(width * -0.5 - fieldCenterX * imageScalar), // X (flipped)
        Math.ceil(height * -0.5 - fieldCenterY * imageScalar), // Y (flipped)
        image.width * imageScalar, // Width
        image.height * imageScalar, // Height
      ];
      setRenderValues(renderValues);
    }
  }, [image, field, width, height]);

  return (
    <>
      {image && renderValues.length > 0 && (
        <KonvaImage
          image={image}
          x={renderValues[0]}
          y={renderValues[1]}
          width={renderValues[4]}
          height={renderValues[5]}
        />
      )}
    </>
  );
};

export default FieldImage;

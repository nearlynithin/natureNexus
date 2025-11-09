import React, { useState, useRef, useEffect } from "react";

export default function ImageViewer({ x1, y1, x2, y2 }) {
  const [boxes, setBoxes] = useState([
    { label: "found", box: [x1, y1, x2, y2] },
  ]);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !image.complete) return;

    const ctx = canvas.getContext("2d");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    setImageDimensions({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });

    ctx.drawImage(image, 0, 0);

    boxes.forEach((item) => {
      const [x1, y1, x2, y2] = item.box;
      const width = x2 - x1;
      const height = y2 - y1;

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      ctx.font = "bold 16px Arial";
      const textMetrics = ctx.measureText(item.label);
      const textHeight = 20;
      const padding = 4;

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(
        x1,
        y1 - textHeight - padding,
        textMetrics.width + padding * 2,
        textHeight + padding,
      );

      ctx.fillStyle = "white";
      ctx.fillText(item.label, x1 + padding, y1 - padding - 4);
    });
  };

  useEffect(() => {
    const img = imageRef.current;
    if (img) img.onload = drawBoundingBoxes;
  }, [boxes]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <img
        ref={imageRef}
        src="test.jpg" // change to your image path
        alt="Detected"
        className="max-w-full h-auto hidden"
      />
      <canvas ref={canvasRef} className="border border-gray-300" />
      <div className="max-w-6xl mx-auto">
        {imageDimensions.width > 0 && (
          <p className="text-sm text-gray-600">
            Image dimensions: {imageDimensions.width} × {imageDimensions.height}
          </p>
        )}
      </div>
    </div>
  );
}

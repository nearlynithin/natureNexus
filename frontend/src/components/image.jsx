import React, { useRef, useEffect } from "react";

export default function ImageViewer({ image, boxes = [] }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      boxes.forEach(({ label, box }) => {
        const [x1, y1, x2, y2] = box;
        const width = x2 - x1;
        const height = y2 - y1;

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, width, height);

        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#ef4444";
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x1, y1 - 20, textWidth + 8, 20);
        ctx.fillStyle = "white";
        ctx.fillText(label, x1 + 4, y1 - 6);
      });
    };

    if (img.complete) draw();
    else img.onload = draw;
  }, [boxes, image]);

  return (
    <div className="p-4">
      <img ref={imageRef} src={image} alt="" className="hidden" />
      <canvas ref={canvasRef} className="border border-gray-300" />
    </div>
  );
}

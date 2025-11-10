import { useState } from "react";
import ImageViewer from "../components/image";

export default function ImageUpload() {
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("http://localhost:3000/detect", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    console.log("Response:", data.result);
    if (data.success && data.result?.boxes) {
      setBoxes(data.result.boxes);
    }
  }

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {image && <ImageViewer image={image} boxes={boxes} />}
    </div>
  );
}

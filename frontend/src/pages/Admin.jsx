import { useState } from "react";
import ImageViewer from "../components/image";

export default function ImageUpload() {
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [message, setMessage] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);
    setBoxes([]);
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("http://localhost:3000/detect", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    console.log(data);

    if (data.success && data.result?.boxes) {
      setBoxes(data.result.boxes);
      setMessage("");
    } else {
      setMessage("No animal detected");
    }
  }

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {message && <div className="text-red-500">{message}</div>}
      {image && <ImageViewer image={image} boxes={boxes} />}
    </div>
  );
}

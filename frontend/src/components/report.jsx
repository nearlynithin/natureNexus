import React, { useState } from "react";

function Report() {
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !text.trim()) return alert("All fields required");

    const response = await fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        text,
        image,
        status: "pending",
      }),
    });

    if (response.ok) {
      alert("Report submitted");
      setEmail("");
      setText("");
      setImage("");
    } else {
      alert("Submit failed");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Wildlife Sighting Report
      </h1>

      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <textarea
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
        rows={4}
        placeholder="Describe the sighting..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mb-4"
      />

      {image && (
        <img
          src={image}
          alt="preview"
          className="w-48 h-48 object-cover rounded mb-4 border"
        />
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
      >
        Submit Report
      </button>
    </div>
  );
}

export default Report;

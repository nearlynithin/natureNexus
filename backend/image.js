import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import sizeOf from "image-size";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function getImageDimensions(buffer) {
  return sizeOf(buffer);
}

export async function detectObjectsInImage(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const base64Data = imageBuffer.toString("base64");
  const mimeType = "image/png";

  const prompt =
    "Detect any animals in the image" +
    "The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000.";

  const contents = [
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    { text: prompt },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
  });

  let text = response.text;
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");

  console.log(match[0]);
  const boxes = JSON.parse(match[0]);

  const { width, height } = await getImageDimensions(imageBuffer);

  const converted = boxes.map((b) => {
    const [yminN, xminN, ymaxN, xmaxN] = b.box_2d;
    const absY1 = Math.round((yminN / 1000) * height);
    const absX1 = Math.round((xminN / 1000) * width);
    const absY2 = Math.round((ymaxN / 1000) * height);
    const absX2 = Math.round((xmaxN / 1000) * width);
    return { label: b.label, box: [absX1, absY1, absX2, absY2] };
  });

  console.log("Image size:", width, height);
  console.log("Converted bounding boxes:", converted);
  return { width, height, boxes: converted };
}

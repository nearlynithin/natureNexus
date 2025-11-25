import mongoose from "mongoose";

const WaterSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lon: Number,
  addedBy: String
});

const Water = mongoose.model("Water", WaterSchema);
export default Water;

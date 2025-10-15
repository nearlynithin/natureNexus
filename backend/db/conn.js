import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const connString = process.env.DB_URI || "";
const client = new MongoClient(connString);
let conn;

try {
  conn = await client.connect();
} catch (e) {
  console.log(e);
}

let db = conn.db(process.env.DB_NAME);

export default db;

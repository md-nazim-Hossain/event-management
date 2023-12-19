import mongoose from "mongoose";
let cashed = (global as any).mongoose || { conn: null, promise: null };
const MONGODB_URI = process.env.DATABASE_URL;
export async function connectToDb() {
  try {
    if (cashed.conn) {
      return cashed.conn;
    }
    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env"
      );
    }

    cashed.promise =
      cashed.promise ||
      mongoose.connect(MONGODB_URI, {
        dbName: "event-management",
        bufferCommands: false,
      });
    cashed.conn = await cashed.promise;
    return cashed.conn;
  } catch (error) {
    console.log(error);
  }
}

import { connectToDb } from "@/database";
import { sendServerActionResponse } from "./utils";

export const catchServerActionsAsync = <T>(fn: Function) => {
  return async (data?: T) => {
    try {
      await connectToDb();
      return await fn(data);
    } catch (error) {
      console.log(error);
      return sendServerActionResponse({
        statusCode: 500,
        success: false,
        data: null,
        error: error,
      });
    }
  };
};

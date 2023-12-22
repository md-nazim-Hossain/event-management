import { connectToDb } from "@/database";
import { sendServerActionResponse } from "./utils";
import { IResponseTypes } from "@/types";

export const catchServerActionsAsync = <T>(fn: Function): Function => {
  return async (data?: T): Promise<IResponseTypes<T>> => {
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

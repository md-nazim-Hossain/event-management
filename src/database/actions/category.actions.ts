"use server";

import { catchServerActionsAsync } from "@/lib/catchAsync";
import { sendServerActionResponse } from "@/lib/utils";
import { CreateCategoryParams, ICategory } from "@/types";
import { Category } from "../models/category.model";

export const createCategory = catchServerActionsAsync<CreateCategoryParams>(
  async ({ categoryName }: CreateCategoryParams) => {
    const category = await Category.create({ name: categoryName });
    return sendServerActionResponse<ICategory>({
      statusCode: 200,
      success: true,
      data: category,
    });
  }
);

export const getAllCategories = catchServerActionsAsync(async () => {
  const categories = await Category.find();
  return sendServerActionResponse<ICategory[]>({
    statusCode: 200,
    success: true,
    data: categories,
  });
});

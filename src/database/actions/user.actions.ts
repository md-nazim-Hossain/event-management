"use server";

import { sendServerActionResponse } from "@/lib/utils";
import { CreateUserParams, IUser, UpdateUserParams } from "@/types";
import { User } from "../models/user.model";
import { Event } from "../models/event.model";
import { Order } from "../models/order.model";
import { revalidatePath } from "next/cache";
import { catchServerActionsAsync } from "@/lib/catchAsync";

export const createUser = catchServerActionsAsync<CreateUserParams>(
  async (user: CreateUserParams) => {
    const newUser = await User.create(user);
    return sendServerActionResponse<IUser>({
      statusCode: 200,
      success: true,
      data: newUser,
    });
  }
);

export const getUserById = catchServerActionsAsync<string>(
  async (userId: string) => {
    const user: IUser | null = await User.findById(userId);
    if (!user) throw new Error("User not found");
    return sendServerActionResponse<IUser>({
      statusCode: 200,
      success: true,
      data: user,
    });
  }
);

export const updateUser = catchServerActionsAsync<UpdateUserParams>(
  async (user: UpdateUserParams & { clerkId: string }) => {
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: user.clerkId },
      user,
      {
        new: true,
      }
    );
    return sendServerActionResponse<IUser>({
      statusCode: 200,
      success: true,
      data: updatedUser,
    });
  }
);
export const deleteUser = catchServerActionsAsync<string>(
  async (clerkId: string) => {
    const userToDelete = await User.findOne({ clerkId });
    if (!userToDelete) throw new Error("User not found");
    await Promise.all([
      // Update the 'events' collection to remove references to the user
      Event.updateMany(
        { _id: { $in: userToDelete.events } },
        { $pull: { organizer: userToDelete._id } }
      ),

      // Update the 'orders' collection to remove references to the user
      Order.updateMany(
        { _id: { $in: userToDelete.orders } },
        { $unset: { buyer: 1 } }
      ),
    ]);

    const deletedUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");

    return sendServerActionResponse<any>({
      statusCode: 200,
      success: true,
      data: deletedUser,
    });
  }
);

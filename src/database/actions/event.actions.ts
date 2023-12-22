"use server";

import { catchServerActionsAsync } from "@/lib/catchAsync";
import { sendServerActionResponse } from "@/lib/utils";
import {
  CreateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
  IEvent,
  UpdateEventParams,
} from "@/types";
import { Event } from "../models/event.model";
import { User } from "../models/user.model";
import { Category } from "../models/category.model";
import { revalidatePath } from "next/cache";
const populateEvent = (query: any) => {
  return query
    .populate({
      path: "organizer",
      model: User,
      select: "_id clerkId firstName lastName",
    })
    .populate({ path: "category", model: Category, select: "_id name" });
};
const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: "i" } });
};
export const createEvent = catchServerActionsAsync<CreateEventParams>(
  async ({ event, userId, path }: CreateEventParams) => {
    const organizer = await User.findById(userId);
    if (!organizer) throw new Error("User not found");
    const newEvent = await Event.create({
      ...event,
      category: event.categoryId,
      organizer: organizer._id,
    });
    // revalidatePath(path);
    return sendServerActionResponse<IEvent>({
      statusCode: 200,
      success: true,
      data: newEvent,
    });
  }
);

export const getEventById = catchServerActionsAsync<string>(
  async (eventId: string) => {
    const event = await populateEvent(Event.findById(eventId));

    if (!event) throw new Error("Event not found");
    return sendServerActionResponse<IEvent>({
      statusCode: 200,
      success: true,
      data: event,
    });
  }
);

export const updateEvent = catchServerActionsAsync<UpdateEventParams>(
  async ({ event, path, userId }: UpdateEventParams) => {
    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error("Unauthorized or event not found");
    }
    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: event.categoryId },
      { new: true }
    );
    revalidatePath(path);
    return sendServerActionResponse<IEvent>({
      statusCode: 200,
      success: true,
      data: updatedEvent,
    });
  }
);

export const deleteEvent = catchServerActionsAsync<DeleteEventParams>(
  async ({ eventId, path }: DeleteEventParams) => {
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (deletedEvent) revalidatePath(path);
    return sendServerActionResponse<any>({
      statusCode: 200,
      success: true,
      data: deletedEvent,
    });
  }
);

export const getAllEvents = catchServerActionsAsync(
  async ({ query, limit = 6, page, category }: GetAllEventsParams) => {
    const titleCondition = query
      ? { title: { $regex: query, $options: "i" } }
      : {};
    const categoryCondition = category
      ? await getCategoryByName(category)
      : null;
    const conditions = {
      $and: [
        titleCondition,
        categoryCondition ? { category: categoryCondition._id } : {},
      ],
    };

    const skipAmount = (Number(page) - 1) * limit;
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return sendServerActionResponse<IEvent[]>({
      statusCode: 200,
      success: true,
      data: events,
      totalPages: Math.ceil(eventsCount / limit),
    });
  }
);

export const getEventsByUser = catchServerActionsAsync(
  async ({ userId, limit = 6, page }: GetEventsByUserParams) => {
    const conditions = { organizer: userId };
    const skipAmount = (page - 1) * limit;

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);
    return sendServerActionResponse({
      statusCode: 200,
      success: true,
      data: events,
      totalPages: Math.ceil(eventsCount / limit),
    });
  }
);

export const getRelatedEventsByCategory = catchServerActionsAsync(
  async ({
    categoryId,
    eventId,
    limit = 3,
    page = 1,
  }: GetRelatedEventsByCategoryParams) => {
    const skipAmount = (Number(page) - 1) * limit;
    const conditions = {
      $and: [{ category: categoryId }, { _id: { $ne: eventId } }],
    };

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);
    return sendServerActionResponse({
      statusCode: 200,
      success: true,
      data: events,
      totalPages: Math.ceil(eventsCount / limit),
    });
  }
);

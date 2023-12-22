"use server";

import { catchServerActionsAsync } from "@/lib/catchAsync";
import {
  CheckoutOrderParams,
  CreateOrderParams,
  GetOrdersByEventParams,
  GetOrdersByUserParams,
  IOrder,
} from "@/types";
import { Order } from "../models/order.model";
import { sendServerActionResponse } from "@/lib/utils";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { User } from "../models/user.model";
import { Event } from "../models/event.model";
import { ObjectId } from "mongodb";

export const checkoutOrder = async (order: CheckoutOrderParams) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const price = order.isFree ? 0 : Number(order.price) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: order.eventTitle,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: order.eventId,
        buyerId: order.buyerId,
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    });

    redirect(session.url!);
  } catch (error) {
    throw error;
  }
};
export const createOrder = catchServerActionsAsync<CreateOrderParams>(
  async (user: CreateOrderParams) => {
    const order = await Order.create(user);
    return sendServerActionResponse<IOrder>({
      statusCode: 200,
      success: true,
      data: order,
    });
  }
);

export const getOrdersByUser = catchServerActionsAsync<GetOrdersByUserParams>(
  async ({ page, userId, limit = 3 }: GetOrdersByUserParams) => {
    const skipAmount = (Number(page) - 1) * limit;
    const conditions = { buyer: userId };
    const orders: IOrder[] = await Order.distinct("event._id")
      .find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: "event",
        model: Event,
        populate: {
          path: "organizer",
          model: User,
          select: "_id firstName lastName",
        },
      });
    const ordersCount = await Order.distinct("event._id").countDocuments(
      conditions
    );
    return sendServerActionResponse<IOrder[]>({
      statusCode: 200,
      success: true,
      data: orders,
      totalPages: Math.ceil(ordersCount / limit),
    });
  }
);

export const getOrderByEvents = catchServerActionsAsync<GetOrdersByEventParams>(
  async ({ eventId, searchString }: GetOrdersByEventParams) => {
    if (!eventId) throw new Error("Event ID is required");
    const eventObjectId = new ObjectId(eventId);
    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "buyer",
          foreignField: "_id",
          as: "buyer",
        },
      },
      {
        $unwind: "$buyer",
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: "$event",
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          createdAt: 1,
          eventTitle: "$event.title",
          eventId: "$event._id",
          buyer: {
            $concat: ["$buyer.firstName", " ", "$buyer.lastName"],
          },
        },
      },
      {
        $match: {
          $and: [
            { eventId: eventObjectId },
            { buyer: { $regex: RegExp(searchString, "i") } },
          ],
        },
      },
    ]);
    return sendServerActionResponse({
      statusCode: 200,
      success: true,
      data: orders,
    });
  }
);

"use server";

import { catchServerActionsAsync } from "@/lib/catchAsync";
import { CheckoutOrderParams, CreateOrderParams, IOrder } from "@/types";
import { Order } from "../models/order.model";
import { sendServerActionResponse } from "@/lib/utils";
import Stripe from "stripe";
import { redirect } from "next/navigation";

export const checkoutOrder = catchServerActionsAsync<CheckoutOrderParams>(
  async (order: CheckoutOrderParams) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const price = order.isFree ? 0 : Number(order.price) * 100;
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
  }
);
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

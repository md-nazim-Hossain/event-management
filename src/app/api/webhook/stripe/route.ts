import stripe from "stripe";
import { createOrder } from "@/database/actions/order.actions";
import { sendApiResponse } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.text();

  const sig = request.headers.get("stripe-signature") as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return sendApiResponse({
      statusCode: 400,
      success: false,
      data: null,
      error: "Stripe webhook error",
    });
  }

  // Get the ID and type
  const eventType = event.type;

  // CREATE
  if (eventType === "checkout.session.completed") {
    const { id, amount_total, metadata } = event.data.object;

    const order = {
      stripeId: id,
      eventId: metadata?.eventId || "",
      buyerId: metadata?.buyerId || "",
      totalAmount: amount_total ? (amount_total / 100).toString() : "0",
      createdAt: new Date(),
    };

    const newOrder = await createOrder(order);
    return sendApiResponse({
      statusCode: 200,
      success: true,
      data: newOrder,
      error: null,
    });
  }

  return sendApiResponse({
    statusCode: 200,
    success: true,
    data: null,
    error: null,
  });
}

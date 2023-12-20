import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { sendApiResponse } from "@/lib/utils";
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/database/actions/user.actions";
import { clerkClient } from "@clerk/nextjs";
import { CreateUserParams, IResponseTypes, IUser } from "@/types";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return sendApiResponse<{ data: null }>({
      statusCode: 200,
      success: true,
      data: null,
      error: "Error occured -- no svix headers",
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return sendApiResponse<{ data: null }>({
      statusCode: 400,
      success: true,
      data: null,
      error: "Error verifying webhook",
    });
  }

  // Get the ID and type
  const eventType = evt.type;
  if (eventType === "user.created") {
    const { id, email_addresses, image_url, first_name, last_name, username } =
      evt.data;
    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      photo: image_url,
      firstName: first_name,
      lastName: last_name,
      username: username!,
    };
    const { data, success }: IResponseTypes<IUser> = await createUser(user);
    if (success && data) {
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: data._id,
        },
      });

      return sendApiResponse<CreateUserParams>({
        statusCode: 200,
        success: true,
        data,
        error: null,
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    const deletedUser = await deleteUser(id!);
    return sendApiResponse<{ data: CreateUserParams }>({
      statusCode: 200,
      success: true,
      data: deletedUser,
    });
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, image_url, first_name, last_name, username } =
      evt.data;
    const user = {
      clerkId: id,
      photo: image_url,
      firstName: first_name,
      lastName: last_name,
      username: username!,
    };
    const update = await updateUser(user!);
    return sendApiResponse<IUser>({
      statusCode: 200,
      success: true,
      data: update,
    });
  }
  return sendApiResponse<{ data: null }>({
    statusCode: 200,
    success: true,
    data: null,
    error: null,
  });
}

import EventForm from "@/components/shared/event-form";
import { getEventById } from "@/database/actions/event.actions";
import { IEvent, IResponseTypes } from "@/types";
import { auth } from "@clerk/nextjs";

type UpdateEventProps = {
  params: {
    id: string;
  };
};

const UpdateEvent = async ({ params: { id } }: UpdateEventProps) => {
  const { sessionClaims } = auth();
  const { data: event }: IResponseTypes<IEvent> = await getEventById(id);
  const userId = sessionClaims?.userId;
  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Update Event
        </h3>
      </section>

      <div className="wrapper my-8">
        <EventForm
          type="Update"
          event={event ?? undefined}
          eventId={event?._id ?? ""}
          userId={userId as string}
        />
      </div>
    </>
  );
};

export default UpdateEvent;

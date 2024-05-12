import { Hono } from "hono";
import { Bindings, Variables } from "../types";
import authMiddleware from "../middleware/auth";
import { PushSubscription } from "@block65/webcrypto-web-push";
import { Notifications } from "../lib/notifications";
import { Users } from "../lib/db/users";
import { Subscriptions } from "../lib/db/subscriptions";
import { Event, Events, ParsedEvent } from "../lib/db/events";

export default (app: Hono<{ Bindings: Bindings, Variables: Variables }>) => {
    app.use("/user/*", authMiddleware);

    app.get("/user", async ctx => {
        return ctx.json(Users.from(ctx).getUser());
    });

    app.get("/user/events", async ctx => {
        const user = Users.from(ctx).getUser();
        const events = await Events.from(ctx).getEvents(user);
        const parsed = events.map(Events.parseEvent);
        const now = new Date();

        const byId = (event: ParsedEvent) => event.id;
        const today = parsed.filter(event => Events.isToday(event, now)).map(byId);
        const upcoming = parsed.filter(event => Events.isUpcomingToday(event, now)).map(byId);
        const currentlyRunning = parsed.filter(event => Events.isRunning(event, now, now)).map(byId);

        const response = { events, today, upcoming, currentlyRunning } as EventsResponse;
        return ctx.json(response);
    });

    app.get("/user/subscription", async ctx => {
        const user = Users.from(ctx).getUser();
        const subscription = await Subscriptions.from(ctx).findSubscription(user);
        return ctx.json(subscription);
    });

    app.post("/user/subscribe", async ctx => {
        const subscription = await ctx.req.json<PushSubscription>();
        if (!subscription) return ctx.text("Bad Request", 400);

        const user = Users.from(ctx).getUser();
        await Subscriptions.from(ctx).createOrUpdateSubscription(user, subscription);
        await Notifications.from(ctx).sendNotificationToSubscription(
            subscription,
            { title: "Raspored", body: "Uspješno ste se pretplatili na obavijesti!" }
        );
        return ctx.text("OK");
    });
}

interface EventsResponse {
    events: Event[];
    today: string[];
    upcoming: string[];
    currentlyRunning: string[];
}

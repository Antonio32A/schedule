import { Context } from "hono";
import { Bindings, Variables } from "../types";
import { Events } from "../lib/db/events";
import { Users } from "../lib/db/users";
import { Subscriptions } from "../lib/db/subscriptions";
import { Notifications } from "../lib/notifications";

const CRON_INTERVAL = 60_000;
const SOON_INTERVAL = 5 * 60 * 1000;

export default async (ctx: Context<{ Bindings: Bindings, Variables: Variables }>, scheduledEvent: ScheduledEvent) => {
    const currentTime = new Date(scheduledEvent.scheduledTime);
    const previousMinute = new Date(currentTime.getTime() - CRON_INTERVAL);
    const runningEvents = await Events.from(ctx).getRunningEventsInRange(previousMinute, currentTime);
    const endingSoon = runningEvents.filter(event => {
        const delta = event.endTime - currentTime.getTime();
        return delta <= SOON_INTERVAL && delta >= SOON_INTERVAL - CRON_INTERVAL;
    });

    for (let event of endingSoon) {
        const user = await Users.from(ctx).findUser(event.userId);
        if (!user) {
            console.error(`User with ID ${event.userId} not found`);
            continue;
        }

        const subscription = await Subscriptions.from(ctx).findSubscription(user);
        if (!subscription) {
            console.error(`Subscription for user ${user.id} not found`);
            continue;
        }

        const title = `${event.name} završava za 5 minuta`;
        const nextEvent = await Events.from(ctx).getNextEvent(event, user, currentTime);
        if (nextEvent == null) {
            await Notifications.from(ctx).sendNotificationToSubscription(subscription, {
                title,
                body: "Nemate sljedeći događaj"
            });
            
            return;
        }

        await Notifications.from(ctx).sendNotificationToSubscription(subscription, {
            title,
            body: `Sljedeći događaj: ${nextEvent.name} (${nextEvent.location})`
        });
    }
}

import { buildPushPayload, PushMessage, PushSubscription, VapidKeys } from "@block65/webcrypto-web-push";
import { User } from "./db/users";
import { Subscriptions } from "./db/subscriptions";
import { Contextable } from "./contextable";

export class Notifications extends Contextable {
    public async sendNotification(user: User, message: object) {
        const subscription = await Subscriptions.from(this.ctx).findSubscription(user);
        if (!subscription) return;
        return this.sendNotificationToSubscription(subscription, message);
    }

    public async sendNotificationToSubscription(subscription: PushSubscription, message: object) {
        const data = {
            data: message,
            options: {
                ttl: 60
            }
        } as PushMessage;

        const keys = this.getVapidKeys();
        const payload = await buildPushPayload(data, subscription, keys);
        await fetch(subscription.endpoint, payload);
    }

    private getVapidKeys(): VapidKeys {
        return {
            subject: "https://schedule.antonio32a.com",
            publicKey: this.ctx.env.NOTIFICATION_PUBLIC_KEY,
            privateKey: this.ctx.env.NOTIFICATION_PRIVATE_KEY
        };
    }
}

import { Bindings, Variables } from "../types";
import { buildPushPayload, PushMessage, PushSubscription, VapidKeys } from "@block65/webcrypto-web-push";
import { Context } from "hono";
import { User, Users } from "./users";

export class Notifications {
    private ctx: Context<{ Bindings: Bindings, Variables: Variables }>;

    constructor(ctx: Context<{ Bindings: Bindings, Variables: Variables }>) {
        this.ctx = ctx;
    }

    static from(ctx: Context<{ Bindings: Bindings, Variables: Variables }>): Notifications {
        return new Notifications(ctx);
    }

    public async sendNotification(user: User, message: object) {
        const subscription = await Users.from(this.ctx).getSubscription(user)
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
        }
    }
}

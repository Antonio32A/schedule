import { PushSubscription } from "@block65/webcrypto-web-push";
import { Database } from "./database";
import { User } from "./users";

export class Subscriptions extends Database {
    async createOrUpdateSubscription(user: User, subscription: PushSubscription): Promise<void> {
        const foundSubscription = await this.findSubscription(user);
        if (foundSubscription) {
            const stmt = this.db
                .prepare("UPDATE Subscriptions SET endpoint = ?, authKey = ?, p256dhKey = ? WHERE userId = ?")
                .bind(subscription.endpoint, subscription.keys.auth, subscription.keys.p256dh, user.id);
            await stmt.run();
            return;
        }

        const id = crypto.randomUUID();
        const stmt = this.db
            .prepare("INSERT INTO Subscriptions (id, endpoint, authKey, p256dhKey, userId) VALUES (?, ?, ?, ?, ?)")
            .bind(id, subscription.endpoint, subscription.keys.auth, subscription.keys.p256dh, user.id);

        await stmt.run();
    }

    async findSubscription(user: User): Promise<PushSubscription | null> {
        const stmt = this.db
            .prepare("SELECT * FROM Subscriptions WHERE userId = ?")
            .bind(user.id);

        const subscription = await stmt.first<Subscription>();
        if (!subscription) return null;

        return {
            endpoint: subscription.endpoint,
            expirationTime: null,
            keys: {
                auth: subscription.authKey,
                p256dh: subscription.p256dhKey
            }
        } as PushSubscription;
    }
}


export interface Subscription {
    id: string;
    endpoint: string;
    authKey: string;
    p256dhKey: string;
}

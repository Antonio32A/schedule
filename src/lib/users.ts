import { Bindings, Variables } from "../types";
import { Context } from "hono";
import { PushSubscription } from "@block65/webcrypto-web-push";

const KEY_DURATION = 1000 * 60 * 60 * 24 * 7;

export class Users {
    private ctx: Context<{ Bindings: Bindings, Variables: Variables }>;
    private db: D1Database;
    private kv: KVNamespace;

    constructor(ctx: Context<{ Bindings: Bindings, Variables: Variables }>) {
        this.ctx = ctx;
        this.db = ctx.env.D1_DATABASE;
        this.kv = ctx.env.KV_STORE;
    }

    static from(ctx: Context<{ Bindings: Bindings, Variables: Variables }>): Users {
        return new Users(ctx);
    }

    getUser() {
        return this.ctx.get("user");
    }

    async getOrCreateUser(googleId: string, name: string): Promise<User> {
        const foundUser = await this.findUser(googleId);
        if (foundUser) return foundUser;

        const id = crypto.randomUUID();
        const stmt = this.db
            .prepare("INSERT INTO Users (id, googleId, name) VALUES (?, ?, ?)")
            .bind(id, googleId, name);

        await stmt.run();
        return { id, googleId, name };
    }

    async findUser(googleId: string): Promise<User | null> {
        const stmt = this.db.prepare("SELECT * FROM Users WHERE googleId = ?").bind(googleId);
        return await stmt.first<User>();
    }

    async findUserByKey(key: APIKey): Promise<User> {
        const stmt = this.db.prepare("SELECT * FROM Users WHERE id = ?").bind(key.userId);
        const user = await stmt.first<User>();
        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async createAPIKey(userId: string): Promise<APIKey> {
        const key = crypto.randomUUID();
        const expiresAt = Date.now() + KEY_DURATION;
        const keys = (await this.getAllKeys()).filter(k => k.userId !== userId);
        keys.push({ userId, key, expiresAt });
        await this.kv.put("keys", JSON.stringify(keys));
        return { userId, key, expiresAt };
    }

    async getAllKeys(): Promise<APIKey[]> {
        const text = await this.kv.get("keys") ?? "[]";
        return JSON.parse(text) as APIKey[];
    }

    async findKey(token: string): Promise<APIKey | undefined> {
        const keys = await this.getAllKeys();
        return keys.find(key => key.key === token && key.expiresAt > Date.now());
    }

    async getSubscription(user: User): Promise<PushSubscription> {
        const stmt = this.db
            .prepare("SELECT * FROM Subscriptions WHERE userId = ?")
            .bind(user.id);

        const subscription = await stmt.first<Subscription>();
        if (!subscription) {
            throw new Error("Subscription not found");
        }

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

export interface User {
    id: string;
    googleId: string;
    name: string;
}

export interface Subscription {
    id: string;
    endpoint: string;
    authKey: string;
    p256dhKey: string;
}

export interface Event {
    id: string;
    name: string;
    location: string;
    startTime: number;
    endTime: number;
    recurrence: number;
}

export interface APIKey {
    userId: string;
    key: string;
    expiresAt: number;
}
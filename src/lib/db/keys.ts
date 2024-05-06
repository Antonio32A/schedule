import { Database } from "./database";

const KEY_DURATION = 1000 * 60 * 60 * 24 * 7;

export class Keys extends Database {
    getKey() {
        return this.ctx.get("apiKey");
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
}

export interface APIKey {
    userId: string;
    key: string;
    expiresAt: number;
}

import { Database } from "./database";
import { APIKey } from "./keys";

export class Users extends Database {
    getUser() {
        return this.ctx.get("user");
    }

    async getOrCreateUser(googleId: string, name: string): Promise<User> {
        const foundUser = await this.findUserByGoogleId(googleId);
        if (foundUser) return foundUser;

        const id = crypto.randomUUID();
        const stmt = this.db
            .prepare("INSERT INTO Users (id, googleId, name) VALUES (?, ?, ?)")
            .bind(id, googleId, name);

        await stmt.run();
        return { id, googleId, name };
    }

    async findUserByGoogleId(googleId: string): Promise<User | null> {
        const stmt = this.db.prepare("SELECT * FROM Users WHERE googleId = ?").bind(googleId);
        return await stmt.first<User>();
    }

    async findUser(id: string): Promise<User | null> {
        const stmt = this.db.prepare("SELECT * FROM Users WHERE id = ?").bind(id);
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
}

export interface User {
    id: string;
    googleId: string;
    name: string;
}

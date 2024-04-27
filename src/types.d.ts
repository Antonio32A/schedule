import { APIKey, User } from "./lib/users";

export type Bindings = {
    KV_STORE: KVNamespace;
    D1_DATABASE: D1Database;
    NOTIFICATION_PUBLIC_KEY: string;
    NOTIFICATION_PRIVATE_KEY: string
    GOOGLE_CREDENTIALS: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    DOMAIN: string;
    FRONTEND_DOMAIN: string;
    DEV: boolean | undefined;
}

export type Variables = {
    apiKey: APIKey;
    user: User;
}

import { Context, Hono } from "hono";
import { Bindings, Variables } from "./types";
import { cors } from "hono/cors";
import loginHandler from "./routes/login";
import userHandler from "./routes/user";
import notifyHandler from "./cron/notify";

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

app.use("*", cors({
    origin: (_origin: string, ctx: Context<{ Bindings: Bindings, Variables: Variables }>) => {
        if (ctx.env.DEV) {
            return "*";
        }

        return ctx.env.FRONTEND_DOMAIN;
    }
}));

userHandler(app);
loginHandler(app);

// noinspection JSUnusedGlobalSymbols
export default {
    fetch: app.fetch,
    scheduled: async (event: ScheduledEvent, env: Bindings) => {
        const ctx = { env } as Context<{ Bindings: Bindings, Variables: Variables }>;
        return await notifyHandler(ctx, event);
    }
};

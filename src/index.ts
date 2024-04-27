import { Context, Hono } from "hono";
import { Bindings, Variables } from "./types";
import loginHandler from "./routes/login";
import userHandler from "./routes/user";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

app.use("*", cors({
    origin: (_origin: string, ctx: Context<{ Bindings: Bindings, Variables: Variables }>) => {
        if (ctx.env.DEV) {
            return "*";
        }
        return "https://schedule-frontend-5fa.pages.dev/";
    }
}));

userHandler(app);
loginHandler(app);

// noinspection JSUnusedGlobalSymbols
export default app;

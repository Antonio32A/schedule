import { Hono } from "hono";
import { Bindings, Variables } from "../types";
import { Users } from "../lib/db/users";
import { Keys } from "../lib/db/keys";
import { Events } from "../lib/db/events";
import { Google } from "../lib/google";

const CALLBACK_PATH = "/login";

export default (app: Hono<{ Bindings: Bindings, Variables: Variables }>) => {
    app.get("/login-redirect", async ctx => {
        const url = await Google.from(ctx).createRedirectUrl(CALLBACK_PATH);
        return ctx.redirect(url);
    });

    app.get(CALLBACK_PATH, async ctx => {
        const { code } = ctx.req.query();
        if (!code) return ctx.text("Bad Request", 400);

        const { user, events } = await Google.from(ctx).login(code, CALLBACK_PATH);
        const createdUser = await Users.from(ctx).getOrCreateUser(user.id, user.name);
        await Events.from(ctx).importEvents(events, createdUser);

        const key = await Keys.from(ctx).createAPIKey(createdUser.id);
        ctx.header("Authorization", `Bearer ${key.key}`);
        return ctx.redirect(ctx.env.FRONTEND_DOMAIN + "/?key=" + key.key);
    });
}

import { Hono } from "hono";
import { Bindings, Variables } from "../types";
import { Notifications } from "../lib/notifications";
import { PushSubscription } from "@block65/webcrypto-web-push";
import { createRedirectUrl, login } from "../lib/google";
import { Users } from "../lib/users";

const CALLBACK_PATH = "/login";

export default (app: Hono<{ Bindings: Bindings, Variables: Variables }>) => {
    app.post("/subscribe", async ctx => {
        const body = await ctx.req.json<SubscribeRequest>();
        if (!body) return ctx.text("Bad Request", 400);

        await Notifications.from(ctx).sendNotificationToSubscription(
            body.subscription,
            { title: "test!", body: "AAAAA!" }
        );
        return ctx.text("OK");
    });

    app.get("/login-url", async ctx => {
        const url = await createRedirectUrl(ctx, CALLBACK_PATH);
        console.log(url);
        return ctx.text(url);
    });

    app.get(CALLBACK_PATH, async ctx => {
        console.log("HELLO?");
        const { code } = ctx.req.query();
        if (!code) return ctx.text("Bad Request", 400);

        const { user, events } = await login(ctx, code, CALLBACK_PATH);
        const createdUser = await Users.from(ctx).getOrCreateUser(user.id, user.name);
        // TODO store events
        console.log(events)
        const key = await Users.from(ctx).createAPIKey(createdUser.id);
        return ctx.json(key);
    });
}

interface SubscribeRequest {
    subscription: PushSubscription;
}

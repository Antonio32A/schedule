import { Bindings, Variables } from "../types";
import { Context, Next } from "hono";
import { Users } from "../lib/db/users";
import { Keys } from "../lib/db/keys";

export default async (ctx: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const { authorization } = ctx.req.header();
    if (!authorization) {
        return ctx.text("Unauthorized", 401);
    }

    const token = authorization.split(" ")[1];
    const foundKey = await Keys.from(ctx).findKey(token);
    if (!foundKey) {
        return ctx.text("Forbidden", 403);
    }

    const user = await Users.from(ctx).findUserByKey(foundKey);
    ctx.set("user", user);
    ctx.set("apiKey", foundKey);
    await next();
};

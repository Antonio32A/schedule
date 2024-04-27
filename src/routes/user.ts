import { Hono } from "hono";
import { Bindings, Variables } from "../types";
import authMiddleware from "../middleware/auth";
import { Users } from "../lib/users";

export default (app: Hono<{ Bindings: Bindings, Variables: Variables }>) => {
    app.use("/user/*", authMiddleware);
    app.get("/user/me", async ctx => {
        return ctx.json(Users.from(ctx).getUser());
    });
}

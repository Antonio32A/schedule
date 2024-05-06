import { Context } from "hono";
import { Bindings, Variables } from "../../types";
import { Contextable } from "../contextable";

export class Database extends Contextable {
    protected db: D1Database;
    protected kv: KVNamespace;

    constructor(ctx: Context<{ Bindings: Bindings, Variables: Variables }>) {
        super(ctx);
        this.db = ctx.env.D1_DATABASE;
        this.kv = ctx.env.KV_STORE;
    }
}

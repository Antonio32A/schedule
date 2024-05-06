import { Context } from "hono";
import { Bindings, Variables } from "../types";

export class Contextable {
    protected ctx: Context<{ Bindings: Bindings, Variables: Variables }>;

    constructor(ctx: Context<{ Bindings: Bindings, Variables: Variables }>) {
        this.ctx = ctx;
    }

    static from<T extends typeof Contextable>(
        this: T,
        ctx: Context<{ Bindings: Bindings, Variables: Variables }>
    ): InstanceType<T> {
        return new this(ctx) as InstanceType<T>;
    }
}

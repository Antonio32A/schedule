import { Context } from "hono";
import { Bindings, Variables } from "../types";
import { google } from "worker-auth-providers";
import { Google } from "worker-auth-providers/dist/providers/google";

const EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const SCOPES = ["profile", "https://www.googleapis.com/auth/calendar.events.readonly"];

export const createRedirectUrl = async (
    ctx: Context<{ Bindings: Bindings, Variables: Variables }>,
    callbackPath: string
): Promise<string> => google.redirect({
    options: {
        clientId: ctx.env.GOOGLE_CLIENT_ID,
        redirectTo: ctx.env.DOMAIN + callbackPath,
        scope: [SCOPES.join(" ")]
    }
});

export const login = async (
    ctx: Context<{ Bindings: Bindings, Variables: Variables }>,
    code: string,
    callbackPath: string
): Promise<LoginResponse> => {
    const options = {
        clientId: ctx.env.GOOGLE_CLIENT_ID,
        clientSecret: ctx.env.GOOGLE_CLIENT_SECRET,
        redirectUrl: ctx.env.DOMAIN + callbackPath
    };

    const tokens = await google.getTokensFromCode(code, options);
    const user = await google.getUser(tokens.access_token) as Google.UserResponse;
    const events = (await listEvents(tokens.access_token)).items;
    return { user, events } as LoginResponse;
};

const listEvents = async (token: string): Promise<ListEventsResponse> => {
    const response = await fetch(
        EVENTS_ENDPOINT,
        {
            headers: {
                authorization: `Bearer ${token}`
            }
        }
    );

    return await response.json();
};

export interface LoginResponse {
    user: Google.UserResponse,
    events: CalendarEvent[]
}

interface ListEventsResponse {
    kind: string;
    etag: string;
    summary: string;
    description: string;
    updated: string;
    timeZone: string;
    accessRole: string;
    defaultReminders: any[];
    nextSyncToken: string;
    items: CalendarEvent[];
}

interface CalendarEvent {
    kind: string;
    etag: string;
    id: string;
    status: string;
    htmlLink: string;
    created: string;
    updated: string;
    summary: string;
    description: string;
    location: string;
    colorId: string;
    creator: {
        email: string;
        displayName: string;
    };
    organizer: {
        email: string;
        displayName: string;
    };
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    endTimeUnspecified: boolean;
    recurrence: string[];
    recurringEventId: string;
    originalStartTime: {
        dateTime: string;
        timeZone: string;
    };
    transparency: string;
    visibility: string;
    iCalUID: string;
    sequence: number;
    attendees: any[];
    hangoutLink: string;
}

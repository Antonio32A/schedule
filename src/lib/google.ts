import { google } from "worker-auth-providers";
import { Google as GoogleData } from "worker-auth-providers/dist/providers/google";
import { Contextable } from "./contextable";

const EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const SCOPES = ["profile", "https://www.googleapis.com/auth/calendar.events.readonly"];

export class Google extends Contextable {
    async createRedirectUrl(callbackPath: string): Promise<string> {
        return google.redirect({
            options: {
                clientId: this.ctx.env.GOOGLE_CLIENT_ID,
                redirectTo: this.ctx.env.DOMAIN + callbackPath,
                scope: [SCOPES.join(" ")]
            }
        });
    }

    async login(code: string, callbackPath: string): Promise<LoginResponse> {
        const options = {
            clientId: this.ctx.env.GOOGLE_CLIENT_ID,
            clientSecret: this.ctx.env.GOOGLE_CLIENT_SECRET,
            redirectUrl: this.ctx.env.DOMAIN + callbackPath
        };

        const tokens = await google.getTokensFromCode(code, options);
        const user = await google.getUser(tokens.access_token) as GoogleData.UserResponse;
        const events = (await this.listEvents(tokens.access_token)).items;
        return { user, events } as LoginResponse;
    }

    private async listEvents(token: string): Promise<ListEventsResponse> {
        const response = await fetch(
            EVENTS_ENDPOINT,
            {
                headers: {
                    authorization: `Bearer ${token}`
                }
            }
        );

        return await response.json();
    }
}

export interface LoginResponse {
    user: GoogleData.UserResponse,
    events: CalendarEvent[]
}

export interface ListEventsResponse {
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

export interface CalendarEvent {
    kind: string;
    etag: string;
    id: string;
    status: string;
    htmlLink: string;
    created: string;
    updated: string;
    summary: string;
    description: string | null;
    location: string | null;
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
    recurrence?: string[];
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

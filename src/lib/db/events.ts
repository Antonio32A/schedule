import { Database } from "./database";
import { User } from "./users";
import { CalendarEvent } from "../google";
import { RRule, rrulestr } from "rrule";

const REQUIRED_TAG = "#raspored";

export class Events extends Database {
    async importEvents(events: CalendarEvent[], user: User): Promise<void> {
        events = events.filter(it => it.status === "confirmed" && it.description?.includes(REQUIRED_TAG));
        const values = events.flatMap(it => [
            it.id,
            it.summary,
            it.description,
            it.location ?? "",
            Date.parse(it.start.dateTime),
            Date.parse(it.end.dateTime),
            it.recurrence[0],
            user.id
        ]);

        const deleteStmt = this.db.prepare("DELETE FROM Events WHERE userId = ?").bind(user.id);
        const stmt = this.db
            .prepare(
                "INSERT INTO Events (id, name, description, location, startTime, endTime, recurrence, userId) VALUES "
                + events.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ")
            ).bind(...values);

        await deleteStmt.run();
        await stmt.run();
    }

    async getEvents(user: User): Promise<Event[]> {
        const stmt = this.db
            .prepare("SELECT * FROM Events WHERE userId = ?")
            .bind(user.id);

        return (await stmt.all<Event>()).results;
    }

    async getAllEvents(): Promise<Event[]> {
        const stmt = this.db.prepare("SELECT * FROM Events");
        return (await stmt.all<Event>()).results;
    }

    async getRunningEventsInRange(start: Date, end: Date): Promise<Event[]> {
        const events = await this.getParsedEvents();

        return events.filter(event => {
            const duration = event.endTime - event.startTime;
            const dates = event.rrule.between(new Date(start.getTime() - duration), end);
            return dates.length > 0;
        });
    }

    async getNextEvent(currentEvent: Event, user: User, currentTime: Date): Promise<Event | null> {
        const events = await this.getParsedEvents(user);
        const endOfDay = new Date(currentTime);
        endOfDay.setHours(23, 59, 59, 999);

        const sorted = events.toSorted((a, b) =>
            a.rrule.between(currentTime, endOfDay)?.[0]?.getTime() - b.rrule.between(currentTime, endOfDay)?.[0]?.getTime()
        );

        const index = sorted.findIndex(event => event.id === currentEvent.id);
        return sorted[index + 1] ?? null;
    }

    async getParsedEvents(user: User | null = null): Promise<ParsedEvent[]> {
        const events = user ? await this.getEvents(user) : await this.getAllEvents();
        return events.map(event => {
            const rule = rrulestr(event.recurrence, { dtstart: new Date(event.startTime) });
            return { ...event, rrule: rule };
        });
    }
}

export type ParsedEvent = {
    rrule: RRule
} & Event;

export type Event = {
    id: string;
    name: string;
    location: string;
    startTime: number;
    endTime: number;
    recurrence: string;
    userId: string;
}

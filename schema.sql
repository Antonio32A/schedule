DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users
(
    id       TEXT PRIMARY KEY,
    googleId TEXT NOT NULL,
    name     TEXT NOT NULL
);

DROP TABLE IF EXISTS Subscriptions;
CREATE TABLE IF NOT EXISTS Subscriptions
(
    id        TEXT PRIMARY KEY,
    endpoint  TEXT NOT NULL,
    authKey   Text NOT NULL,
    p256dhKey TEXT NOT NULL,
    userId    TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users (id)
);

DROP TABLE IF EXISTS Events;
CREATE TABLE IF NOT EXISTS Events
(
    id          TEXT PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL,
    location    TEXT    NOT NULL,
    startTime   INTEGER NOT NULL,
    endTime     INTEGER NOT NULL,
    recurrence  TEXT    NOT NULL,
    userId      TEXT    NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users (id)
);

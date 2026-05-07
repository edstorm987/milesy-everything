# Demo portals

Public-facing playable demos. Each subfolder hosts a fully-mocked
portal scoped to one persona, populated with random data (lorem
content, fake numbers, sample avatars) so visitors can click around
without hitting real customer data.

## Layout

```
demo portals/
├── README.md                 ← this file
├── demo agency/              ← what an agency-owner sees
├── demo employee/            ← what an agency-staff sees (no admin)
├── demo client/              ← what a client-owner sees in their custom portal
└── demo clients client/      ← what an end-customer (the client's customer) sees
```

## How they're served

The current architecture serves these via the existing `/dev/pov`
chooser hooked into the `seedDemoAgency()` flow — that issues a real
session cookie and routes the visitor to the matching `/portal/*`
surface. Round T2/R028 (queued — see queues/T2/) wires this folder
into a public-facing `/demo` chooser so non-Ed visitors can play
without dev-bypass exposure.

Until the round ships, this folder is scaffolding only. Each subfolder
will carry its persona's brand kit, mock data, and screen-cap or
content overrides as that round progresses.

## Why a separate folder

Keeps demo content **separate from real-tenant data** at the source-
tree level. A grep against `04-the-final-portal/demo portals/` is
authoritative for "what's the public demo showing" — no risk of
accidentally surfacing real client info in a public mock.

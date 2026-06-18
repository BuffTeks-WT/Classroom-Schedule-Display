# Classroom Schedule Display Frontend

The Classroom Schedule Display frontend is the user-facing part of the WTAMU Classroom Schedule Display project. It provides a browser-based interface for viewing classroom schedules, creating room reservations, and supporting room-specific kiosk displays.

This frontend was built by the BuffTeks frontend team to make classroom reservation information easier to access, review, and act on through a clean web experience.

## Project Purpose

The frontend helps students, faculty, staff, and classroom administrators interact with classroom reservation data through a simple set of web pages.

Users can:

- View classroom reservations from a schedule dashboard.
- Submit a room reservation through a guided form.
- Review room availability before choosing a time.
- Open a kiosk display for a specific classroom.
- Use kiosk QR links to start a reservation for the displayed room.

## What The Frontend Team Implemented

| Area | Implementation |
| --- | --- |
| Landing page | A branded entry point that directs users to the reservation form or schedule dashboard. |
| Reservation workflow | A multi-step form for collecting host, event, room, and time details. |
| Form validation | Client-side checks for required fields, WTAMU email format, reservation time rules, and room conflicts. |
| Availability UI | Calendar and recommended time-slot tools that help users find open reservation windows. |
| Schedule dashboard | A reservation dashboard with filtering, sorting, reservation cards, and detail views. |
| Reservation management | Edit and cancel/delete interactions for existing reservations. |
| Kiosk display | A room-facing display with live room status, upcoming reservations, and QR booking links. |
| Shared styling | WTAMU-inspired colors, typography, layout, forms, buttons, cards, and responsive behavior. |
| API integration | Shared JavaScript API helpers and a local Express proxy for connecting frontend pages to backend reservation data. |

## Tech Stack

| Technology | Used For |
| --- | --- |
| HTML5 | Page structure and semantic content. |
| CSS3 | Responsive layouts, branding, forms, buttons, cards, and visual polish. |
| JavaScript | Page behavior, validation, data rendering, filtering, modals, kiosk logic, and API calls. |
| Node.js | Local frontend runtime. |
| Express | Static file serving and backend API proxy routes. |

## Main Frontend Files

```text
Frontend/
  index.html              Landing page
  script.js               Landing page navigation
  reservation.html        Reservation form page
  reservation.js          Reservation workflow, validation, availability, and submit logic
  schedule.html           Schedule dashboard page
  schedule.js             Dashboard filtering, sorting, details, edit, and delete behavior
  kiosk.html              Classroom kiosk display page
  kiosk.js                Kiosk setup, room status, QR links, and refresh behavior
  services/api.js         Shared reservation API helper functions
  server.js               Express static server and backend proxy
  style.css               Shared frontend styling
  Images/                 Logos, icons, backgrounds, and visual assets
```

## Running The Frontend

Install dependencies from the `Frontend` folder:

```bash
npm install
```

Create a local `.env` file in the `Frontend` folder:

```bash
API_BASE_URL=http://localhost:<backend-port>
```

Start the frontend server:

```bash
npm start
```

Open the app:

```text
http://localhost:3000/index.html
```

Useful frontend pages:

```text
http://localhost:3000/reservation.html
http://localhost:3000/schedule.html
http://localhost:3000/kiosk.html
```

Room-specific kiosk and reservation links can include a `room_id` query parameter:

```text
http://localhost:3000/kiosk.html?room_id=101
http://localhost:3000/reservation.html?room_id=101
```

## Contributors

| Name | GitHub | Role |
| --- | --- | --- |
| AD Diallo | [@ad1135773](https://github.com/ad1135773) | Frontend Developer |
| Josue Bravo | [@jbravo2buffs](https://github.com/jbravo2buffs) | Frontend Developer |
| Seth Crump | [@Scrump05](https://github.com/Scrump05) | Frontend Developer |

## Portfolio Summary

This frontend demonstrates practical work in multi-page web development, responsive UI design, form validation, dashboard filtering, modal interactions, API integration, and kiosk-style user experiences.

The BuffTeks frontend team translated classroom scheduling requirements into an interactive browser-based product that supports reservation creation, schedule review, and room-specific display workflows.

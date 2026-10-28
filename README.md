# Gymnasium Booking

A web application for reserving gymnasium facilities (courts, pools, studios, fields and rooms). Staff can **add, edit, delete and search** bookings and facilities, and the system automatically prevents double-bookings, overbooking and bookings in the past.

Built with **React**, **Express.js** and **MongoDB** (the MERN stack). This version has **no authentication**: anyone using the app can manage all bookings.

> **Course:** _[Your course and section]_
> **Members:** _[Your name(s)]_
> **Instructor:** _[Instructor's name]_
> **Date submitted:** _[Date]_

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Requirements](#requirements)
4. [Folder structure](#folder-structure)
5. [Installation](#installation)
6. [Running the project](#running-the-project)
7. [Pages](#pages)
8. [Data fields](#data-fields)
9. [API endpoints](#api-endpoints)
10. [Booking rules](#booking-rules)
11. [Testing the API](#testing-the-api)
12. [Troubleshooting](#troubleshooting)

---

## Features

**Bookings**
- Add a booking with customer details, facility, date, time and number of people
- Edit any booking, including its status (Pending, Confirmed, Cancelled, Completed)
- Delete a booking with a confirmation dialog
- Search by booking code, customer name or contact number
- Filter by facility, date and status
- View full details, including duration and estimated cost
- Automatic booking codes, for example `GB-20261024-001`

**Facilities**
- Add, edit, delete and search facilities in a pop-up form
- Mark a facility as unavailable to stop new bookings on it
- Facilities with upcoming bookings cannot be deleted

**Dashboard**
- Today's schedule and the next upcoming bookings
- Counts of today's, upcoming and pending bookings, and available facilities

**Validation**
- No overlapping bookings on the same facility
- Number of people cannot exceed the facility's capacity
- No bookings in the past
- Format checks for contact numbers, emails and times
- Clear error messages shown directly on the form

---

## Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 + Vite | User interface |
| Routing | React Router | Page navigation without reloading |
| HTTP client | Axios | Sends requests from React to the API |
| Backend | Node.js + Express.js | REST API |
| Database | MongoDB | Stores facilities and bookings |
| ODM | Mongoose | Schemas, validation and queries |
| Dev tools | Nodemon, ESLint, REST Client | Auto-restart, linting, API testing |

---



Check that Node.js and npm are installed:

```bash
node -v
npm -v
```

> **Windows tip:** if PowerShell says *"running scripts is disabled on this system"*, see [Troubleshooting](#troubleshooting).

---

## Folder structure

```
gymnasium-booking/
├── server/                     # Backend (Express + MongoDB)
│   ├── models/
│   │   ├── Booking.js          # Booking schema, rules and auto booking code
│   │   └── Facility.js         # Facility schema and rules
│   ├── routes/
│   │   ├── bookings.js         # Booking endpoints + overlap, capacity and date checks
│   │   └── facilities.js       # Facility endpoints + protected delete
│   ├── .env                    # Settings (not uploaded to GitHub)
│   ├── server.js               # Starts the server and connects to MongoDB
│   ├── test.http               # API tests for the REST Client extension
│   └── package.json
│
└── client/                     # Frontend (React + Vite)
    ├── src/
    │   ├── api/
    │   │   └── client.js       # All requests to the backend
    │   ├── components/
    │   │   ├── BookingForm.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── FacilityForm.jsx
    │   │   ├── Modal.jsx
    │   │   └── Navbar.jsx
    │   ├── pages/
    │   │   ├── Home.jsx            # Dashboard
    │   │   ├── BookingsList.jsx
    │   │   ├── AddBooking.jsx
    │   │   ├── EditBooking.jsx
    │   │   ├── BookingDetails.jsx
    │   │   ├── Facilities.jsx
    │   │   └── NotFound.jsx
    │   ├── utils/
    │   │   └── format.js       # Date and time helpers
    │   ├── App.jsx             # Routes
    │   ├── index.css           # All styles
    │   └── main.jsx            # Entry point
    └── package.json
```

---

## Installation

### 1. Get the project

Copy or clone the `gymnasium-booking` folder to your computer, then open it in a terminal:

```bash
cd gymnasium-booking
```

### 2. Make sure MongoDB is running

Open **MongoDB Compass** and connect to:

```
mongodb://localhost:27017
```

If it connects, MongoDB is running. If you installed MongoDB "as a Service," it starts automatically with Windows.

### 3. Set up the backend

```bash
cd server
npm install
```

Create a file named `.env` inside the `server` folder with:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/gymnasium_booking
```

| Variable | Meaning |
| --- | --- |
| `PORT` | The port the API runs on |
| `MONGO_URI` | The MongoDB address and database name. The `gymnasium_booking` database is created automatically on the first save. |

> Using **MongoDB Atlas** instead? Replace `MONGO_URI` with your Atlas connection string and add `/gymnasium_booking` before the `?`.

### 4. Set up the frontend

Open a **second terminal**, then:

```bash
cd gymnasium-booking/client
npm install
```

---

## Running the project

The backend and frontend run **at the same time**, each in its own terminal.

**Terminal 1: backend**

```bash
cd server
npm run dev
```

Expected output:

```
MongoDB connected
Server running on http://localhost:5000
```

**Terminal 2: frontend**

```bash
cd client
npm run 
```

Expected output:

```
VITE ready
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

| Service | Address |
| --- | --- |
| Web app | http://localhost:5173 |
| API | http://localhost:5000/api |

### Available scripts

| Folder | Command | What it does |
| --- | --- | --- |
| `server` | `npm run dev` | Starts the API and restarts it on every save (nodemon) |
| `server` | `npm start` | Starts the API normally |
| `client` | `npm run dev` | Starts the React app with live reload |
| `client` | `npm run build` | Builds the app for production into `client/dist` |
| `client` | `npm run lint` | Checks the code for common mistakes |

### First time using the app

The database starts empty. Add facilities first:

1. Go to **Facilities** → **+ Add Facility** (for example: Basketball Court A, Court, capacity 20, ₱500/hour)
2. Then go to **New Booking** and book it

---

## Pages

| Page | Address | What it does |
| --- | --- | --- |
| Dashboard | `/` | Today's schedule, upcoming bookings and quick counts |
| Bookings List | `/bookings` | Table of all bookings with search, filters and delete |
| New Booking | `/bookings/new` | Booking form |
| Booking Details | `/bookings/:id` | Full record with duration and estimated cost |
| Edit Booking | `/bookings/:id/edit` | Pre-filled form, including status |
| Facilities | `/facilities` | Add, edit, delete and search facilities |

### User flow

1. The user opens the **Dashboard** and goes to **Bookings**, **Facilities** or **New Booking** from the sidebar.
2. On the **Bookings List**, they search or filter, then **View**, **Edit** or **Delete** a booking.
3. When saving a booking, the server checks the rules:
   - **Valid** → saved, and the user returns to the list with a success message.
   - **Invalid or overlapping** → the user stays on the form with the error shown and their input kept.
4. Deleting always asks for confirmation first.

---

## Data fields

MongoDB stores two collections. Each booking links to one facility by its `_id`. Mongoose also adds `_id`, `createdAt` and `updatedAt` to every document.

### Facility (`facilities`)

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | String | Yes | Unique |
| `type` | String | Yes | Court, Field, Pool, Studio or Room |
| `capacity` | Number | Yes | At least 1 |
| `hourlyRate` | Number | No | 0 or more, default 0 (in PHP) |
| `description` | String | No | Up to 500 characters |
| `isAvailable` | Boolean | Yes | Default `true` |

### Booking (`bookings`)

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `bookingCode` | String | Auto | Generated as `GB-YYYYMMDD-###`, unique |
| `customerName` | String | Yes | 2 to 100 characters |
| `contactNumber` | String | Yes | 11 digits starting with `09` |
| `email` | String | No | Valid email format, saved in lowercase |
| `facility` | ObjectId → Facility | Yes | Must exist and be available |
| `bookingDate` | Date | Yes | Today or later (for new bookings) |
| `startTime` | String | Yes | `HH:mm`, 24-hour |
| `endTime` | String | Yes | `HH:mm`, after `startTime` |
| `numberOfPeople` | Number | Yes | 1 up to the facility's capacity |
| `purpose` | String | No | Training, Game, Event, Class or Other |
| `status` | String | Yes | Pending, Confirmed, Cancelled or Completed; default Pending |
| `notes` | String | No | Up to 500 characters |

---

## API endpoints

Base address: `http://localhost:5000/api`

### Facilities

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/facilities?q=` | List facilities; `q` searches name and type |
| GET | `/facilities/:id` | Get one facility |
| POST | `/facilities` | Create a facility |
| PUT | `/facilities/:id` | Update a facility |
| DELETE | `/facilities/:id` | Delete a facility (blocked if it has upcoming bookings) |

### Bookings

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/bookings?q=&facility=&date=&status=` | List bookings with search and filters |
| GET | `/bookings/:id` | Get one booking, with facility details |
| POST | `/bookings` | Create a booking |
| PUT | `/bookings/:id` | Update a booking |
| DELETE | `/bookings/:id` | Delete a booking |

### Example: create a booking

```http
POST /api/bookings
Content-Type: application/json

{
  "customerName": "Juan Dela Cruz",
  "contactNumber": "09171234567",
  "facility": "<facility _id>",
  "bookingDate": "2026-10-30",
  "startTime": "15:00",
  "endTime": "17:00",
  "numberOfPeople": 10,
  "purpose": "Game"
}
```

### Status codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Invalid data (missing fields, wrong format, broken rule) |
| 404 | Not found |
| 409 | Conflict (overlapping booking, duplicate name, facility in use) |
| 500 | Server error |

Errors are returned as `{ "message": "..." }`.

---

## Booking rules

The server checks every new or edited booking:

| Rule | Example message |
| --- | --- |
| End time must be after start time | *End time must be after start time* |
| No past dates for new bookings | *Booking date cannot be in the past* |
| The facility must exist and be available | *Basketball Court A is not available for booking* |
| People cannot exceed capacity | *Basketball Court A holds at most 20 people* |
| No overlapping bookings on the same facility and date | *Time conflict with booking GB-20261024-002 (17:00-19:00)* |

**How overlap is detected:** two bookings overlap when one starts before the other ends **and** ends after the other starts. Back-to-back bookings (one ending at 17:00, the next starting at 17:00) are allowed. Cancelled bookings free their time slot.

---

## Testing the API

The file `server/test.http` contains ready-made requests for every endpoint, including tests that should fail on purpose.

1. Install the **REST Client** extension (by Huachao Mao) in VS Code.
2. Make sure the backend is running.
3. Open `server/test.http` and click **Send Request** above any request.

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| PowerShell: *"running scripts is disabled on this system"* | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, answer `Y`, and reopen the terminal. Or use Command Prompt instead. |
| `MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running. Start the MongoDB service, or reinstall MongoDB Community with "Install as a Service." |
| `Cannot find module ...server.js` | The terminal is in the wrong folder. Run `cd server` first. |
| The web page says *"Could not reach the server. Is it running?"* | Start the backend with `npm run dev` in the `server` folder. |
| `Error: listen EADDRINUSE :::5000` | Port 5000 is already in use, usually by another copy of the server. Close the other terminal, or change `PORT` in `.env` and in `client/src/api/client.js`. |
| Blank white page in the browser | Press **F12** → **Console** to see the error. Often a file is missing its `export default` line or an import. |
| Styles look broken | Press **Ctrl + Shift + R** to hard refresh. Check `client/src/index.css` for a missing `}`. |
| Font looks different | The Plus Jakarta Sans font loads from Google Fonts and needs internet. Without it, the app uses the system font. |

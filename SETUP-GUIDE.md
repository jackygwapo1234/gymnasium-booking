# Gymnasium Booking — Setup Guide

How to move this project to another computer and run it.
Follow the steps **in order**. Each step has a ✅ check so you know it worked.

---

## Before you start: 3 things to know

1. **Your code** is in the `gymnasium-booking` folder → you copy it.
2. **Your data** (facilities and bookings) is inside MongoDB, **not** in the folder → you export it and import it.
3. **Your tools** (Node.js, MongoDB, Ollama) are installed on the computer → you install them again.

> Copying the folder alone is **not enough**. Do all three.

---

## Part 1: On the OLD computer

### Step 1 — Stop the app

Click each terminal and press `Ctrl + C`.

### Step 2 — Save your data

1. Open **MongoDB Compass**.
2. Click **Connect** (address: `mongodb://localhost:27017`).
3. Click **gymnasium_booking**, then click **facilities**.
4. Click **Export Data** → **Export the full collection** → choose **JSON** → save as `facilities.json`.
5. Go back, click **bookings**, and do the same → save as `bookings.json`.

✅ You now have two files: `facilities.json` and `bookings.json`.

### Step 3 — Delete the `node_modules` folders

Delete these two folders:

- `gymnasium-booking/server/node_modules`
- `gymnasium-booking/client/node_modules`

Don't worry. They are big, and they come back with one command later.

### Step 4 — Zip the project

1. Right-click the `gymnasium-booking` folder.
2. Click **Send to** → **Compressed (zipped) folder**.
3. Copy the zip **and** the two `.json` files to a USB drive (or Google Drive).

✅ Open the zip and check that `server` has a file called `.env`. If it's missing, you'll create it again in Step 9.

---

## Part 2: On the NEW computer — install the tools

Install each one, then do the check.

| Step | Install this | Download from | ✅ Check |
| --- | --- | --- | --- |
| 5 | **Node.js** (choose **LTS**) | nodejs.org | Type `node -v` in PowerShell → shows a version |
| 6 | **MongoDB Community Server** (keep **"Install MongoD as a Service"** checked) | mongodb.com | Open Compass → Connect works |
| 7 | **Ollama** | ollama.com/download | Type `ollama -v` → shows a version |
| 8 | **VS Code** | code.visualstudio.com | It opens |

## Requirements

Install these before setting up the project:

| Software | Version | Download |
| --- | --- | --- |
| Node.js | 18 or newer (LTS recommended) | https://nodejs.org |
| MongoDB Community Server | 6 or newer | https://www.mongodb.com/try/download/community |
| MongoDB Compass (optional) | Any | Comes with MongoDB, or download separately |
| Visual Studio Code (recommended) | Any | https://code.visualstudio.com |

> **Tip:** after installing something, close PowerShell and open a **new** one, so it knows the new commands.

### Step 8b — Download the AI model

Open PowerShell and type:

```
ollama pull llama3.2:3b
```

It's about 2 GB, so wait until it says **success**.

### If PowerShell says "running scripts is disabled"

Type this once, then press `Y`:

```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Part 3: On the NEW computer — set up the project

### Step 9 — Unzip and open

1. Unzip the project on the Desktop.
2. Open VS Code → **File** → **Open Folder** → choose `gymnasium-booking`.
3. Check that `server/.env` exists. If not, create it with this inside:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/gymnasium_booking
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OPEN_TIME=06:00
CLOSE_TIME=22:00
```

### Step 10 — Install the backend

In VS Code, open a terminal (`Ctrl + backtick`) and type:

```
cd server
npm install
```

✅ It ends with something like `added 120 packages`.

### Step 11 — Install the frontend

Click **+** in the terminal panel to open a **second** terminal, then type:

```
cd client
npm install
```

✅ It ends with `added ... packages`.

### Step 12 — Put your data back

1. Open **MongoDB Compass** and click **Connect**.
2. Click **Create database**.
   - Database name: `gymnasium_booking`
   - Collection name: `facilities`
3. Open **facilities** → **Add Data** → **Import JSON or CSV file** → choose `facilities.json` → **Import**.
4. Click the **+** next to `gymnasium_booking` to create another collection named `bookings`.
5. Open **bookings** → **Add Data** → **Import JSON or CSV file** → choose `bookings.json` → **Import**.

> Spell the names **exactly**, all lowercase: `gymnasium_booking`, `facilities`, `bookings`.

✅ Both collections show your documents.

---

## Part 4: Run the app

Do this **every time** you want to use the app.

1. **Open Ollama** from the Start menu (a llama icon appears near the clock).
2. **Terminal 1** (backend):

   ```
   cd server
   npm run dev
   ```

   Wait until you see:

   ```
   MongoDB connected
   Server running on http://localhost:5000
   AI model llama3.2:3b is loaded and ready
   ```

3. **Terminal 2** (frontend):

   ```
   cd client
   npm run dev
   ```

4. Open your browser and go to **http://localhost:5173**

To stop: press `Ctrl + C` in both terminals.

---

## Part 5: Did it work?

- [ ] **Dashboard** shows your bookings and counts
- [ ] **Bookings** shows facility **names** (not "Deleted facility")
- [ ] **Availability** shows the green and red time slots
- [ ] **AI assistant** (on New Booking): click **Example: what's free?** → **Ask AI** → you get an answer

All checked? You're done! 🎉

---

## Something went wrong?

| What you see | What to do |
| --- | --- |
| `'npm' is not recognized` | Install Node.js, then open a **new** terminal |
| "running scripts is disabled" | Run the `Set-ExecutionPolicy` command (Part 2) |
| `MongoDB connection failed` | Install MongoDB Community Server with "Install as a Service" |
| `Cannot find module 'express'` | You forgot Step 10: `cd server` then `npm install` |
| Blank white page | You forgot Step 11: `cd client` then `npm install` |
| `Cannot find module ...server.js` | You're in the wrong folder. Type `cd server` first |
| "Cannot reach Ollama" | Open the Ollama app from the Start menu |
| "The AI model ... is not downloaded" | Type `ollama pull llama3.2:3b` |
| Bookings say "Deleted facility" | You only imported bookings. Import `facilities.json` too |
| The AI is very slow | Close other apps and browser tabs. Still slow? Change `OLLAMA_MODEL` in `.env` to `llama3.2:1b`, then restart the server |

---

## Tip for demo day

Set everything up on the presentation computer **one day before**.
Installing MongoDB and downloading the AI model take time and need internet.

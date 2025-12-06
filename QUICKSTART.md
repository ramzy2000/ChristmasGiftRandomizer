# Quick Start Guide

## Prerequisites
- Node.js 18+ and npm installed

## Setup

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start the backend server** (Terminal 1):
   ```bash
   npm run dev:server
   ```
   Server runs on `http://localhost:3001`

3. **Start the frontend** (Terminal 2):
   ```bash
   npm run dev:client
   ```
   Client runs on `http://localhost:5173`

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## Usage Flow

1. **Create an Exchange:**
   - Enter an exchange name (e.g., "Smith Family 2024")
   - Click "Create Exchange"
   - **Save your Organizer Token** (you'll need this to manage the exchange)
   - **Share the Participant Code** with participants

2. **Add Participants:**
   - Use your Organizer Token to access the dashboard
   - Enter participant names
   - Optionally add excluded names (people they can't be matched with)
   - Click "Add Participant"

3. **Generate Matches:**
   - Once you have at least 2 participants, click "Generate Matches"
   - The system will create valid pairings

4. **View Matches:**
   - Participants can go to the home page
   - Enter their Participant Code and name
   - View who they're matched with!

## Production Build

**Build client:**
```bash
npm run build:client
```

**Build server:**
```bash
npm run build:server
```

**Run production server:**
```bash
cd server
npm start
```

## Troubleshooting

- **Database errors:** The database is created automatically in `server/data/gift-exchange.db`
- **Port conflicts:** Change ports in `server/src/server.ts` and `client/vite.config.ts`
- **Build errors:** Make sure all dependencies are installed with `npm run install:all`


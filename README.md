# Christmas Gift Exchange Randomizer

A modern, full-stack application for creating and managing secret gift exchanges (Secret Santa). Built with React 19, Vite, Node.js, Express, and SQLite.

## Features

- 🎁 **Easy Exchange Creation**: Create gift exchanges with a simple name
- 👥 **Participant Management**: Add participants with optional exclusion rules
- 🎲 **Smart Matching Algorithm**: Graph-based matching algorithm that guarantees valid solutions
- 🔒 **Secure Sharing**: Separate organizer and participant codes for privacy
- 📱 **PWA Support**: Progressive Web App with offline support and push notifications
- 🎨 **Modern UI**: Responsive, mobile-first design
- ✅ **No Even Number Requirement**: Works with any number of participants (2+)

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- PWA (Progressive Web App)

### Backend
- Node.js
- Express
- TypeScript
- SQLite (better-sqlite3)

## Project Structure

```
ChristmasGiftRandomizer/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types
└── old_project/     # Original project (reference)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ChristmasGiftRandomizer
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```
The server will run on `http://localhost:3001`

2. Start the frontend development server (in a new terminal):
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## Usage

### Creating an Exchange

1. Enter an exchange name (e.g., "Smith Family 2024")
2. Click "Create Exchange"
3. Save your **Organizer Token** (keep this secret!)
4. Share the **Participant Code** with participants

### Adding Participants

1. Use your Organizer Token to access the organizer dashboard
2. Enter participant names
3. Optionally add excluded names (people they can't be matched with)
4. Click "Add Participant"

### Generating Matches

1. Once you have at least 2 participants, click "Generate Matches"
2. The system will create valid pairings respecting all exclusion rules
3. Participants can then view their match using the Participant Code

### Viewing Your Match

1. Go to the home page
2. Enter your Participant Code and name
3. View who you're matched with!

## Algorithm

The matching algorithm uses a graph-based approach with backtracking to find valid solutions:

- Models participants and valid matches as a graph
- Uses constraint satisfaction to respect exclusion rules
- Guarantees a solution if one exists
- Handles edge cases gracefully

## API Endpoints

### Exchanges
- `POST /api/exchanges` - Create a new exchange
- `GET /api/exchanges/organizer/:token` - Get exchange by organizer token
- `GET /api/exchanges/participant/:code` - Get exchange by participant code
- `POST /api/exchanges/:token/match` - Generate matches for an exchange

### Participants
- `POST /api/participants/:token` - Add a participant
- `GET /api/participants/match/:code/:name` - Get participant's match
- `DELETE /api/participants/:token/:id` - Delete a participant

## Development

### Building for Production

**Client:**
```bash
cd client
npm run build
```

**Server:**
```bash
cd server
npm run build
npm start
```

### Database

The database is automatically created in `server/data/gift-exchange.db` on first run. The schema is defined in `server/src/database/schema.sql`.

## Future Enhancements

- [ ] Email notifications
- [ ] SMS notifications
- [ ] Multiple exclusion rules per participant
- [ ] Exchange history
- [ ] Export matches to PDF
- [ ] Dark mode toggle
- [ ] Multi-language support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


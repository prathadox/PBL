# Code Collaboration Backend

This is the backend server for the Code Collaboration project, providing real-time code collaboration, chat, and music playlist features.

## Features

- Real-time code collaboration using Socket.IO
- Code execution using Judge0 API
- Real-time chat functionality
- Shared music playlist (if time permits)
- Supabase integration for data persistence

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Judge0 API access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   JUDGE0_URL=your_judge0_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Code Execution
- `POST /api/code/execute`
  - Body: `{ code: string, language: string, input?: string }`
  - Returns: Execution results

### Room Data
- `GET /api/code/rooms/:id/data`
  - Returns: Room data and code snapshots

### Music Playlist
- `GET /api/music/search?query=string`
  - Returns: Search results for music
- `GET /api/music/playlist/:roomId`
  - Returns: Playlist for a specific room

## Socket.IO Events

### Code Collaboration
- `join-room`: Join a collaboration room
- `code-change`: Broadcast code changes
- `initial-code`: Send initial code to new users

### Chat
- `send-message`: Send a chat message
- `receive-message`: Receive chat messages

### Music
- `add-to-playlist`: Add a track to the playlist
- `playlist-updated`: Notify about playlist updates

## Database Schema

### code_snapshots
- id (UUID)
- room_id (UUID)
- code (TEXT)
- language (TEXT)
- updated_at (TIMESTAMP)
- updated_by (UUID)

### messages
- id (UUID)
- room_id (UUID)
- user_id (UUID)
- username (TEXT)
- content (TEXT)
- created_at (TIMESTAMP)

### playlist_items
- id (UUID)
- playlist_id (UUID)
- title (TEXT)
- artist (TEXT)
- url (TEXT)
- added_by (UUID)
- added_at (TIMESTAMP)
- order_position (INTEGER) 
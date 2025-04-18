import { Server } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';

export const setupSocketHandlers = (io: Server, supabase: SupabaseClient) => {
  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // TODO: Implement token verification
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle room joining
    socket.on('join-room', async (roomId: string, userId: string, username: string) => {
      socket.join(roomId);
      
      // Fetch latest code snapshot
      const { data: codeSnapshot } = await supabase
        .from('code_snapshots')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      // Notify room of new user
      socket.to(roomId).emit('user-joined', { userId, username });
      
      // Send latest code to new user
      if (codeSnapshot) {
        socket.emit('initial-code', codeSnapshot.code, codeSnapshot.language);
      }
      
      // Handle code changes
      socket.on('code-change', async (code: string, language: string) => {
        socket.to(roomId).emit('code-change', code, language);
        
        // Save to database periodically (debounced)
        await supabase.from('code_snapshots').upsert({
          room_id: roomId,
          code,
          language,
          updated_at: new Date(),
          updated_by: userId
        });
      });
      
      // Handle chat messages
      socket.on('send-message', async (message: string) => {
        const newMessage = {
          room_id: roomId,
          user_id: userId,
          username,
          content: message,
          created_at: new Date()
        };
        
        await supabase.from('messages').insert(newMessage);
        io.to(roomId).emit('receive-message', newMessage);
      });
      
      // Handle music playlist updates
      socket.on('add-to-playlist', async (track: { title: string; artist: string; url: string }) => {
        const newTrack = {
          playlist_id: roomId,
          title: track.title,
          artist: track.artist,
          url: track.url,
          added_by: userId,
          added_at: new Date()
        };
        
        await supabase.from('playlist_items').insert(newTrack);
        io.to(roomId).emit('playlist-updated', newTrack);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-left', userId);
      });
    });
  });
}; 
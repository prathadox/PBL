import express from 'express';
import axios from 'axios';

const router = express.Router();

// Search for music
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // TODO: Implement YouTube API search
    // This is a placeholder response
    res.json({
      results: [
        {
          title: 'Sample Track',
          artist: 'Sample Artist',
          url: 'https://example.com/track.mp3'
        }
      ]
    });
  } catch (error) {
    console.error('Music search error:', error);
    res.status(500).json({ error: 'Music search failed' });
  }
});

// Get playlist for a room
router.get('/playlist/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    // TODO: Implement playlist retrieval from Supabase
    res.json({ roomId, tracks: [] });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

export default router; 
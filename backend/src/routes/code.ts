import express from 'express';
import axios from 'axios';

const router = express.Router();

// Language ID mapping for Judge0
const languageMap: Record<string, number> = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  // Add more languages as needed
};

// Execute code using Judge0 API
router.post('/execute', async (req, res) => {
  try {
    const { code, language, input } = req.body;
    const languageId = languageMap[language.toLowerCase()];
    
    if (!languageId) {
      return res.status(400).json({ error: 'Unsupported language' });
    }
    
    // Submit to Judge0
    const submission = await axios.post(`${process.env.JUDGE0_URL}/submissions`, {
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: input ? Buffer.from(input).toString('base64') : '',
      wait: true
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Get results
    const token = submission.data.token;
    const result = await axios.get(`${process.env.JUDGE0_URL}/submissions/${token}`);
    
    return res.json({
      stdout: result.data.stdout ? Buffer.from(result.data.stdout, 'base64').toString() : '',
      stderr: result.data.stderr ? Buffer.from(result.data.stderr, 'base64').toString() : '',
      compile_output: result.data.compile_output ? Buffer.from(result.data.compile_output, 'base64').toString() : '',
      time: result.data.time,
      memory: result.data.memory,
      status: result.data.status
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Code execution failed' });
  }
});

// Get room data
router.get('/rooms/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Implement room data retrieval from Supabase
    res.json({ roomId: id });
  } catch (error) {
    console.error('Error fetching room data:', error);
    res.status(500).json({ error: 'Failed to fetch room data' });
  }
});

export default router; 
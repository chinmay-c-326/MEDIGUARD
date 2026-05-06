import Report from '../models/Report.js';
import { generateTriage } from '../services/aiService.js';
import axios from 'axios';

export const processTriage = async (req, res) => {
  const { messages, patientProfile } = req.body;
  try {
    const triageData = await generateTriage(messages, patientProfile);
    const report = await Report.create({ user: req.user.id, triageData, messages });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process triage' });
  }
};

export const chatWithAI = async (req, res) => {
  const { messages, patientProfile } = req.body;
  try {
    const systemPrompt = `You are MediGuard AI. Follow triage rules. Be concise.`;
    const history = messages.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join("\n");
    const fullPrompt = `${systemPrompt}\n\n${history}\nAI:`;

    // Using gemini-flash-lite-latest for high quota/free access
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: fullPrompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    res.status(200).json({ success: true, content: text });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('Gemini Lite Error:', errorMsg);
    res.status(500).json({ success: false, message: `AI Error: ${errorMsg}` });
  }
};

export const listModels = async (req, res) => {
  res.status(200).json({ success: true, message: "Lite Mode Active" });
};

export const getUserReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

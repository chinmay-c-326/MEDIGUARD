import Vital from '../models/Vital.js';
import { analyzeCoughAudio } from '../services/aiService.js';

export const saveVitals = async (req, res) => {
  const { heartRate, bloodPressure, bloodSugar, temperature } = req.body;
  
  try {
    let audioAnalysis = null;
    if (req.file) {
      audioAnalysis = await analyzeCoughAudio(req.file.path);
    }

    const vital = await Vital.create({
      user: req.user.id,
      heartRate,
      bloodPressure,
      bloodSugar,
      temperature,
      audioPath: req.file ? req.file.path : null,
      audioAnalysis
    });

    res.status(201).json({ success: true, data: vital });
  } catch (error) {
    console.error('Vitals Save Error:', error.message);
    res.status(500).json({ success: false, message: `AI Error: ${error.message}` });
  }
};

export const getUserVitals = async (req, res) => {
  try {
    const vitals = await Vital.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vitals' });
  }
};

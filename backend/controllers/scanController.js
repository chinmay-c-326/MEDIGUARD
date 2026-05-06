import Scan from '../models/Scan.js';
import { analyzeSkinScan } from '../services/aiService.js';

export const uploadScan = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  try {
    const analysis = await analyzeSkinScan(req.file.path);
    const scan = await Scan.create({
      user: req.user.id,
      imagePath: req.file.path,
      analysis: {
        label: analysis.label,
        confidence: analysis.confidence,
        action: analysis.action,
        rawResult: analysis,
      },
    });
    res.status(201).json({ success: true, data: scan });
  } catch (error) {
    console.error('Scan Upload Error:', error.message);
    res.status(500).json({ success: false, message: `AI Error: ${error.message}` });
  }
};

export const getUserScans = async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: scans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch scans' });
  }
};

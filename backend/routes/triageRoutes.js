import express from 'express';
import { processTriage, getUserReports, chatWithAI, listModels } from '../controllers/triageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/process', protect, processTriage);
router.post('/chat', protect, chatWithAI);
router.get('/', protect, getUserReports);
router.get('/debug', protect, listModels);

export default router;

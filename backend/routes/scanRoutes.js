import express from 'express';
import { uploadScan, getUserScans } from '../controllers/scanController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/upload', protect, upload.single('scan'), uploadScan);
router.get('/', protect, getUserScans);

export default router;

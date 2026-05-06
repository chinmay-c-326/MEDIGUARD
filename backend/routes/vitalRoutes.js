import express from 'express';
import { saveVitals, getUserVitals } from '../controllers/vitalController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/', protect, upload.single('audio'), saveVitals);
router.get('/', protect, getUserVitals);

export default router;

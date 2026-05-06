import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  analysis: {
    label: String,
    confidence: String,
    action: String,
    rawResult: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;

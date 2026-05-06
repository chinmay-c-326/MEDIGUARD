import mongoose from 'mongoose';

const vitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  heartRate: {
    type: Number,
  },
  respiratoryRate: {
    type: Number,
  },
  audioPath: {
    type: String, // Path to the audio recording if applicable
  },
  analysis: {
    type: String, // AI analysis of the audio/vitals
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Vital = mongoose.model('Vital', vitalSchema);
export default Vital;

import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  triageData: {
    tier: Number,
    label: String,
    topSymptoms: [String],
    explanation: String,
  },
  messages: [{
    role: String,
    content: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Report = mongoose.model('Report', reportSchema);
export default Report;

import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'study', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['voice', 'manual', 'chat'],
    default: 'manual'
  },
  transcription: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
noteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Note = mongoose.model('Note', noteSchema);

export default Note;

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    communicationStyle: {
      type: String,
      enum: ['formal', 'friendly', 'concise'],
      default: 'friendly'
    },
    thematicScope: {
      type: String,
      default: 'general'
    }
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

export default User;

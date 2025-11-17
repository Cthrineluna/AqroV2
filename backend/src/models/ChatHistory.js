// backend/models/ChatHistory.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ChatHistory schema for authenticated mode (future).
 * For guest mode we use AsyncStorage/localStorage only.
 */
const ChatHistorySchema = new Schema({
  userId: { type: String, required: true, index: true },
  messages: [
    {
      from: { type: String, enum: ['user','ai'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);

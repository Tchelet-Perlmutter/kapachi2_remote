const mongoose = require("mongoose");

// message schema
const messageSchema = new mongoose.Schema({
  //from or to would be a user ID
  from: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    // TODO: check if there is a person with that ID with "validate"
    trim: true,
  },
  to: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    // TODO: check if there is a person with that ID with "validate"
    trim: true,
  },
  // Date = miliseconds formated date
  date: {
    type: Number,
    required: [true, "A message should have a date"],
  },
  message: {
    type: String,
    required: [true, "A message should have a 'message' propery"],
    trim: true,
  },
  isLocked: {
    type: Boolean,
    required: [true, "A message should have a 'isLocked' propery"],
  },
  isSent: {
    type: Boolean,
    required: [true, "A message should have a 'isSent' propery"],
  },
  isRead: {
    type: Boolean,
    required: [true, "A message should have a 'isRead' proper"],
  },
  //messageType = "Thanks" or a "Sorry"
  messageType: {
    type: String,
    required: [true, "A message should have a 'message Type'"],
    trim: true,
  },
});

// Message model
const Message = mongoose.model("messages", messageSchema);

module.exports = Message;

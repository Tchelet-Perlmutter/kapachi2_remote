const mongoose = require("mongoose");

// conversation schema.
const conversationSchema = new mongoose.Schema({
  // messages Indexes (IDs)
  messagesIndexesArr: {
    type: Array,
  },
  //The converationalists of the conversation = their IDs
  conversationalistsIndexesArr: {
    type: Array,
    required: [true, "A conversation should have conversationalists"],
  },
});

// Conversation model
const Conversation = mongoose.model("conversations", conversationSchema);

module.exports = Conversation;

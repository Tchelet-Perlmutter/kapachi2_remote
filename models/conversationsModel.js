const mongoose = require("mongoose");
const User = require("./usersModel");
const modelsControllers = require("../controllers/modelsControllers");

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
    validate: {
      validator: async function (conversationalistsIndexesArr) {
        return await modelsControllers.isValidConversationalists(
          conversationalistsIndexesArr
        );
      },
      message:
        "'conversationalistsIndexesArr' property have to contain two valid mongoDB _IDs of other users",
    },
  },
});

// conversationSchema.index(
//   {
//     "test.one": 1,
//     "test.two": 1,
//   },
//   { unique: true }
// );

// Conversation model
const Conversation = mongoose.model("conversations", conversationSchema);

module.exports = Conversation;

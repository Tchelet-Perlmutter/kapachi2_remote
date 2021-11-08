const mongoose = require("mongoose");
const User = require("./usersModel");

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
      validator: async (conversationalistsArr) => {
        if (conversationalistsArr.length > 2) {
          return false;
        }
        for (let i = 0; i <= 1; i++) {
          if ((await isValidId(conversationalistsArr[i])) == false) {
            return false;
          }
        }
        return true;
      },
      message:
        "'conversationalistsIndexesArr' property have to contain two valid mongoDB _IDs of other users",
    },
  },
});

async function isValidId(fromVal) {
  let toReturn = "";
  if (fromVal.length == 24) {
    toReturn = await User.findById(mongoose.Types.ObjectId(fromVal))
      .then((doc) => {
        if (doc == null) {
          console.log(`---> null doc from isValidId: ${doc}`);
          return false;
        } else {
          return true;
        }
      })
      .catch((err) => {
        console.log(`---> ERROR from the validator: ${err}`);
      });
  } else {
    toReturn = false;
  }
  return toReturn;
}

// Conversation model
const Conversation = mongoose.model("conversations", conversationSchema);

module.exports = Conversation;

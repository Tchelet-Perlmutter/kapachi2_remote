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
      validator: async function (conversationalistsIndexesArr) {
        return await isValidConversationalists(conversationalistsIndexesArr);
      },
      message:
        "'conversationalistsIndexesArr' property have to contain two valid mongoDB _IDs of other users",
    },
  },
});

/**
 * Check if the conversationalistsArr is valid: Two different IDs of an existing users
 * @param {*} conversationalconversationalistsArr  Array
 * @returns true if it is valid and false if it is not
 */
async function isValidConversationalists(conversationalconversationalistsArr) {
  if (
    conversationalistsArr.length > 2 ||
    conversationalistsArr[0] == conversationalistsArr[1]
  ) {
    console.log(
      `----> ERROR from isValidConversationalists  function - The conversationalistsArr value contains more then two conversationalists, or two coppied conversationalists. The conversationalistsArr value: ${conversationalistsArr}`
    );
    return false;
  }
  for (let i = 0; i <= 1; i++) {
    if ((await isValidId(conversationalistsArr[i])) == false) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if val is an ID of an existing user
 * @param {*} val string
 * @returns true if val is an ID of an existing user. Otherwise return false
 */
async function isValidId(val) {
  let toReturn = "";
  if (val.length == 24) {
    toReturn = await User.findById(mongoose.Types.ObjectId(val))
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

const mongoose = require("mongoose");
const User = require("./usersModel");

// message schema
const messageSchema = new mongoose.Schema({
  //from or to would be a user ID
  from: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    trim: true,
    validate: {
      validator: function (fromVal) {
        return isValidId(fromVal);
      },
      message: "'from' property have to be a valid mongoose _ID of other user",
    },
  },
  to: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    trim: true,
    validate: {
      validator: function (toVal) {
        return isValidId(toVal);
      },
      message: "'to' property have to be a valid mongoose _ID of other user",
    },
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
    maxlength: 4000,
  },
  isGiftMessage: {
    type: Boolean,
    required: [true, "A message should have a 'isGiftMessage' propery"],
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
    enum: {
      values: ["Thanks", "Sorry"],
      message: "A messageType should be 'Thanks' or 'Sorry'",
    },
  },
});

//FIXME: The function is in conversationsModel module too
async function isValidId(fromVal) {
  let toReturn = "";
  if (fromVal.length == 24) {
    toReturn = await User.findById(mongoose.Types.ObjectId(fromVal))
      .then((doc) => {
        if (doc == null) {
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

// Message model
const Message = mongoose.model("messages", messageSchema);

module.exports = Message;

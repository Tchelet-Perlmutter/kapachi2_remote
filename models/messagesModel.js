const mongoose = require("mongoose");
const modelsControllers = require("../controllers/modelsControllers");
const Group = require("./groupsModel");

// message schema
const messageSchema = new mongoose.Schema({
  //from or to would be a user ID
  from: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    trim: true,
    validate: {
      validator: function (fromVal) {
        return modelsControllers.isValidId(fromVal);
      },
      message: "'from' property have to be a valid mongoose _ID of other user",
    },
  },
  to: {
    type: {},
    required: [true, "A message should have a 'to' propery"],
    trim: true,
    unique: true,
    validate: {
      validator: async function (toVal) {
        const result = await modelsControllers.toValidator(toVal, this);
        return result;
      },
      message:
        "---> ERROR from new document validator - 'to' property is not valid. lastTenGiftedUsersArr property of the sender can not contain the 'to' _id property. Maybe that is the reason",
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
  groupId: {
    type: String,
    trim: true,
    validate: {
      validator: function (groupId) {
        let result = true;
        if (groupId.length == 24) {
          Group.findById(mongoose.Types.ObjectId(groupId)).then((groupDoc) => {
            if (groupDoc == null) {
              console.log(
                `---> ERROR from groupId validator - groupId is not exsist`
              );
              result = false;
            }
          });
        } else {
          console.log(
            `---> ERROR from groupId function - groupId is more or less then 24 characters`
          );
          result = false;
        }
        return result;
      },
    },
  },
});

// Message model
const Message = mongoose.model("messages", messageSchema);

module.exports = Message;

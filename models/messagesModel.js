const mongoose = require("mongoose");
const {
  PhoneNumberPage,
} = require("twilio/lib/rest/trunking/v1/trunk/phoneNumber");
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
    //FIXME:
    type: {},
    required: [true, "A message should have a 'to' propery"],
    trim: true,
    unique: true,
    validate: {
      validator: async function (toVal) {
        const result = await toValidator(toVal, this);
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
});

//FIXME: Combine that isValidPhone function with the one in usersModel module. Its the same
/**
 * Validate international phone numbers based on ITU-T standards.
 * @param {*} phoneNum
 */
function isValidPhone(phoneNum) {
  if (phoneNum.length == 13) {
    if (phoneNum.match(/^\+(?:[0-9] ?){6,14}[0-9]$/)) {
      console.log(`===84`);
      return true;
    } else {
      console.log(
        `---> ERROR from isValidPhone function - the phone property is not vald - it contains unvalid characters`
      );
      return false;
    }
  } else {
    console.log(
      `---> ERROR from isValidPhone function - the phone property is not valid - it contains more or less then 13 characters`
    );
    return false;
  }
}

/**
 * Checks if 'to' value is a valid _id of other user, and if not, if it is an array of a valid new phone number and full name
 * @param {*} toVal
 * @returns
 */
async function toValidator(toVal, theNewMessage) {
  const senderId = mongoose.Types.ObjectId(theNewMessage.from);

  if (isValidId(toVal) == false) {
    const toValKeys = toVal.keys();
    const toValValues = toVal.values();
    //Check if 'to' is an array of valid phone and name of the unassigned user
    if (typeof toVal == Map) {
      //FIXME: toVal is a map or an obj?
      if ((toValKeys[0] == "toPhone") & (toValKeys[1] == "toName")) {
        if (toValValues[0] == isValidPhone(toValValues)) {
          if (toValValues[1].length <= 20) {
            return true;
          } else {
            console.log(
              `---> ERROR from 'toValidator' - 'toName' must be up to 20 characters`
            );
            return false;
          }
        } else {
          return false;
        }
      } else {
        console.log(
          `---> ERROR from 'toValidator' - 'to' of an unsigned user must be in the next Map format: [["toPhone": a valid phone number], ["toName": a uniqe full name]]`
        );
        return false;
      }
    } else {
      console.log(
        `---> ERROR from 'toValidator' - 'to' of an unsigned user must be a Map, and it is not. The Map format should be in the next format: [["toPhone": a valid phone number], ["toName": a uniqe full name]]`
      );
      return false;
    }
  } else if ((await isIdNotInSenderLastGiftedArr(toVal, senderId)) == false) {
    return false;
  } else {
    return true;
  }
}

/**
 * Check if the eddressy is one of the lastTenGiftedUsersArr of the sender
 * @param {*} toVal mongo _ID of the addressy
 */
async function isIdNotInSenderLastGiftedArr(toVal, senderId) {
  try {
    let result = await User.findById(senderId).then((doc) => {
      for (let i = 0; i < 10; i++) {
        if (toVal == doc.lastTenGiftedUsersArr[i]) {
          return false;
        }
      }
      return true;
    });

    return result;
  } catch (error) {
    console.log(
      `----> ERROR from isIdInSenderLastGiftedArr func at messagesModel. 'toVal': ${toVal}. 'senderId': ${senderId}: ${error}`
    );
  }
}

//FIXME: The function is in conversationsModel module too
/**
 *
 * @param {*} fromVal
 * @returns
 */
async function isValidId(val) {
  let toReturn = "";
  if (val.length == 24) {
    toReturn = await User.findById(mongoose.Types.ObjectId(val))
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

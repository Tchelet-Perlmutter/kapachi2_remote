const mongoose = require("mongoose");
const modelsControllers = require("../Controllers/modelsControllers");

//user schema
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, "A User must have a phone number"],
    unique: true,
    trim: true,
    validate: {
      validator: function (phoneNum) {
        return modelsControllers.isValidPhone(phoneNum);
      },
    },
  },
  //Conversation's array = Conversation's indexes in the db
  conversationsArr: {
    type: Array,
  },
  password: {
    type: String,
    uniqe: true,
    minlength: [8, "Password property must be 8 to 14 characters"],
    maxlength: [14, "Password property must be 8 to 14 characters"],
  },
  name: {
    type: String,
    maxlength: [20, "name property must up to 20 characters"],
  },
  userName: {
    type: String,
    uniqe: true,
    maxlength: [20, "UserName property must up to 20 characters"],
  },
  keysQ: {
    type: Number,
  },
  messagesHeChanedQ: {
    type: Number,
  },
  // User rank - between 0 to 5
  userRank: {
    type: Number,
    min: 0,
    max: 5,
  },
  //Status - Max 150 characters
  status: {
    type: String,
    maxlength: [150, "Status property must be up to 150 characters"],
    trim: true,
  },
  lastTenGiftedUsersArr: {
    type: Array,
    maxlength: 10,
  },
  savedGroupsIdArr: {
    type: Array,
    validate: {
      validator: function (savedGroupsIdArr) {
        return modelsControllers.isValidGroups(savedGroupsIdArr);
      },
      message:
        "savedGroupsIdArr must contain valid mongoDB _ids of other groups",
    },
  },
});

/**
 * Checks if the phoneNum is in the next format: +XXXXXXXXXXXX, with numbers and + sign only, and not exsists in other user document
 * @param {*} phoneNum
 */
// function isValidAndNewPhone(phoneNum) {
//   if (phoneNum.length == 13) {
//     User.find({ phone: phoneNum })
//       .then((doc) => {
//         if (doc == null) {
//           return isValidPhone(phoneNum);
//         }
//       })
//       .catch((error) => {
//         console.log(`---> ERROR from isValidPhone function: ${error}`);
//       });
//   }
// }

// User model
const User = mongoose.model("users", userSchema);

module.exports = User;

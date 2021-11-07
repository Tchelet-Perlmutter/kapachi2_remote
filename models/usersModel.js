mongoose = require("mongoose");

//user schema
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, "A User must have a phone number"],
    unique: true,
    trim: true,
    minlength: [13, "Phone property must be exactly 13 characters"],
    maxlength: [13, "Phone property must be exactly 13 characters"],
  },
  //Conversation's array = Conversation's indexes in the db
  conversationsArr: {
    type: Array,
  },
  password: {
    type: String,
    unique: true,
    minlength: [8, "Password property must be 8 to 14 characters"],
    maxlength: [14, "Password property must be 8 to 14 characters"],
  },
  name: {
    type: String,
    unique: true,
    maxlength: [20, "MaxLength property must up to 20 characters"],
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
    maxLength: 150,
    trim: true,
  },
});

// User model
const User = mongoose.model("users", userSchema);

module.exports = User;

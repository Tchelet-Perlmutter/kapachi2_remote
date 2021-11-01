mongoose = require("mongoose");

//user schema
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, "A User must have a phone number"],
    unique: true,
    //TODO: Add validation
    trim: true,
  },
  //Conversation's array = Conversation's indexes in the db
  conversationsArr: {
    type: Array,
  },
  password: {
    type: Number, // ??? When I write type Numbers, I don't need a validator for checking if he puted only numbers?
    unique: true,
  },
  name: {
    type: String,
    unique: true,
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

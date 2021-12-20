const mongoose = require("mongoose");
const modelsControllers = require("../Controllers/modelsControllers");

// group schema.
const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: [true, "A group should have a name"],
    maxlength: [20, "name property must up to 20 characters"],
  },
  membersIdArr: {
    type: Array,
    required: [true, "A group should have membersIdArr"],
    maxLength: [250, "name property must up to 20 characters"],
    validate: {
      validator: async function (membersIdArr) {
        return await modelsControllers.isValidMembersIdArr(membersIdArr);
      },
      message:
        "'membersIdArr' property have to contain valid mongoDB _IDs of other users",
    },
  },
  membersWhoSentMessageArr: {
    type: Array,
    required: [true, "A group should have membersWhoSentMessageArr"],
  },
});

// Group model
const Group = mongoose.model("groups", groupSchema);

module.exports = Group;

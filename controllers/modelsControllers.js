const mongoose = require("mongoose");
const Group = require("../models/groupsModel");
const User = require("../models/usersModel");
const Conversation = require("../models/conversationsModel");
const Message = require("../models/messagesModel");

/**
 * Check if the conversationalistsIndexesArr is valid: Two different IDs of an existing users
 * @param {*} conversationalistsIndexesArr  Array
 * @returns true if it is valid and false if it is not
 */
exports.isValidConversationalists = async function (
  conversationalistsIndexesArr
) {
  if (
    conversationalistsIndexesArr.length > 2 ||
    conversationalistsIndexesArr[0] == conversationalistsIndexesArr[1]
  ) {
    console.log(
      `----> ERROR from isValidConversationalists  function - The conversationalistsIndexesArr value contains more then two conversationalists, or two coppied conversationalists. The conversationalistsIndexesArr value: ${conversationalistsIndexesArr}`
    );
    return false;
  }
  for (let i = 0; i <= 1; i++) {
    if ((await isValidId(conversationalistsIndexesArr[i])) == false) {
      return false;
    }
  }
  if (
    (await isNewConversationalistsIndexes(conversationalistsIndexesArr)) ==
    false
  ) {
    return false;
  }

  return true;
};

async function isNewConversationalistsIndexes(conversationalistsIndexesArray) {
  const isNew = await Conversation.findOne({
    $and: [
      {
        conversationalistsIndexesArr: conversationalistsIndexesArray[0],
      },
      {
        conversationalistsIndexesArr: conversationalistsIndexesArray[1],
      },
    ],
  }).then((doc) => {
    if (doc != null) {
      console.log(
        `----> ERROR from isNewConversationalistsIndexes function - There is allready a conversation with those two conversationalists: ${conversationalistsIndexesArray}. That conversation: ${JSON.stringify(
          doc
        )}`
      );
      return false;
    } else {
      return true;
    }
  });
  return isNew;
}

/**
 * Checks if 'to' value is a valid _id of other user, and if not, if it is an array of a valid new phone number and full name
 * @param {*} toVal
 * @returns
 */
exports.toValidator = async function (toVal, theNewMessage) {
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
};

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
      `----> ERROR from isIdNotInSenderLastGiftedArr func at messagesModel. 'toVal': ${toVal}. 'senderId': ${senderId}: ${error}`
    );
  }
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

/**
 * Validate international phone numbers based on ITU-T standards.
 * @param {*} phoneNum
 */
function isValidPhone(phoneNum) {
  if (phoneNum.length == 13) {
    if (phoneNum.match(/^\+(?:[0-9] ?){6,14}[0-9]$/)) {
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
 * @param {Array of _id Strings} savedGroupsIdArr
 * @returns true if all of the ids in savedGroupsIdArr are valid _ids of exsisting groups
 */
function isValidGroups(savedGroupsIdArr) {
  let result = true;
  savedGroupsIdArr.forEach((groupId) => {
    if (groupId.length == 24) {
      Group.findById(mongoose.Types.ObjectId(groupId)).then((groupDoc) => {
        if (groupDoc == null) {
          console.log(
            `---> ERROR from isValidGroups function - savedGroupsIdArr contain an Id which is not exsist`
          );
          result = false;
        }
      });
    } else {
      console.log(
        `---> ERROR from isValidGroups function - savedGroupsIdArr contain an Id which is more or less then 24 characters`
      );
      result = false;
    }
  });
  return result;
}

/**
 * Async func
 * @param {Array of _id Strings} membersIdArr
 * @returns promise with true if all the members in the array are valid and existing _ids of users. Otherwise - false.
 */
async function isValidMembersIdArr(membersIdArr) {
  let result = true;
  if (membersIdArr.length <= 250) {
    membersIdArr.forEach((memberId) => {
      console.log(`===40 JSON.stringify(User): ${JSON.stringify(User)}`);
      console.log(`===41 Group: ${Group}`);
      User.findById(memberId).then((doc) => {
        if (doc == null) {
          console.log(
            `----> ERROR from isValidMembersIdArr function: The memberId ${memberId} of membersIdArr not exists`
          );
          result = false;
        }
      });
    });
  } else {
    console.log(
      `----> ERROR from isValidMembersIdArr function: The membersIdArr contains more then 250 members`
    );
    resule = false;
  }
  return result;
}

exports.isValidMembersIdArr = isValidMembersIdArr;
exports.isValidGroups = isValidGroups;
exports.isValidPhone = isValidPhone;
exports.isValidId = isValidId;
exports.isIdNotInSenderLastGiftedArr = isIdNotInSenderLastGiftedArr;
exports.isNewConversationalistsIndexes = isNewConversationalistsIndexes;

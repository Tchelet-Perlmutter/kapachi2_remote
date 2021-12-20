const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Message = require("../models/messagesModel");
const Conversation = require("../models/conversationsModel");
const Group = require("../models/groupsModel");

const fewRoutesControllers = require("./fewRoutesControllers");

/**
 * Async func that GET (Print and return) the document with the id param of theCollectionModel param
 * @returns {Promise} The document
 * @param {*} id String of an _id
 * @param {*} res
 * @param {*} theCollectionModel String of a collection model name
 * @param {*} funcCalledFrom String of a the function name that called the getOne by id function
 */
exports.getOneById = async function (
  id,
  res,
  theCollectionModel,
  funcCalledFrom
) {
  let document = await theCollectionModel
    .findById(id)
    .then((doc) => {
      console.log(`----> Yay! the document with id ${id}: ${doc}`);
      return doc;
    })
    .catch((err) => {
      console.log(
        `----> ERROR from getOneById - the document with id ${id} of ${theCollectionModel} collection. The function was called from ${funcCalledFrom} function. ${err}`
      );
      res.send(`${err}`);
    });
  return document;
};

/**
 * Async func that Delete ( & Print and return) the document with the id param of theCollectionModel param
 * @returns {Promise} The document
 * @param {*} id String of an _id
 * @param {*} res
 * @param {*} theCollectionModel String of a collection model name
 * @param {*} funcCalledFrom String of a the function name that called the deleteOne by id function
 */
exports.deleteOneById = async function (
  id,
  res,
  theCollectionModel,
  funcCalledFrom
) {
  document = theCollectionModel
    .findByIdAndDelete(id)
    .then((doc) => {
      // Delete the document id from it's array in other collection
      fewRoutesControllers.deleteIndexFromArray(doc, theCollectionModel);
      console.log(`----> Yay! The document with id ${doc.id} was deleted`);
      return doc;
    })
    .catch((err) => {
      console.log(
        `----> ERROR from deleteOneById function - The document id: ${id}. The function was called from: ${funcCalledFrom} function. ${err}.`
      );
      res.send(`${err}`);
    });
  return document;
};

/**
 * An async function that update the document with the content of the update param.
 * @param {*} id The id of the doc we want to update
 * @param {*} update The JSON object with the update info
 * @param {*} res In order to allow a response
 * @param {*} funcCalledFrom String of the name of the function that called that function.
 * @return {Promise} with the updated doc
 */
exports.patchOneById = async function (
  id,
  update,
  isResEnd,
  res,
  funcCalledFrom,
  theCollectionModel
) {
  const updateFirstKey = Object.entries(update)[0][0];
  let updateSecondKey = Object.keys(Object.entries(update)[0][1]);
  let updatedDoc = "";

  if (updateFirstKey == "keysQ" || updateSecondKey == "lastTenGiftedUsersArr") {
    theCollectionModel = User;
  }

  id = mongoose.Types.ObjectId(id);
  // Document creation
  document = await theCollectionModel
    .findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
    .then((doc) => {
      console.log(
        `----> Yay! The update - ${JSON.stringify(
          update
        )} was added to the document with id ${id}: ${doc}`
      );
      if (isResEnd) {
        res.send("Done"); //FIXME: The res is undefined here
      }

      return doc;
    })
    .catch((err) => {
      console.log(
        `----> ERROR from patchOneById function - didn't update the ${collection} document with id ${id} with the update ${JSON.stringify(
          update
        )}. The function was called from the function - ${funcCalledFrom} : ${err}`
      );
      //FIXME:res.send(`${err}`);
    });
  return document;
};

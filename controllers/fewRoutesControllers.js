const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Message = require("../models/messagesModel");
const Conversation = require("../models/conversationsModel");
const Group = require("../models/groupsModel");

const byPropertyQueryRouteControllers = require("./byPropertyQueryRouteControllers");
const byIdRouteControllers = require("./byIdRouteControllers");
const baseRouteControllers = require("./baseRouteControllers");

/**
 * Takes the newDocument and add it's _id to the property (of other collection's document) that holds the id of that type of documents
 * @param //{Document} newDocument
 */
exports.deleteIndexFromArray = function (newDocument, collection) {
  try {
    if (collection == "messages") {
      Conversation.findOneAndUpdate(
        // Filter
        {
          //Finding the conversation that the message belongs to.The $elemMatch operator matches documents that contain an array field with at least one element that matches all the specified query criteria.
          $and: [
            { conversationalistsIndexesArr: { $eq: newDocument.from } },
            { conversationalistsIndexesArr: { $eq: newDocument.to } },
          ],
        },
        //Update -> Delete
        {
          //delete the message id from it's messagesIndexesArr
          $pull: { messagesIndexesArr: newDocument._id },
        },
        // Options
        {
          new: true,
        }
      )
        .then((doc) => {
          console.log(
            `----> Yay! The ID ${newDocument.id} of colection ${collection} was deleted from the next document's relevant array property: ${doc}`
          );
        })
        .catch((err) => {
          console.log(
            `----> ERROR from deleteIndexFromArray function when collection = messages. the error: ${err}`
          );
        });
    } else if (collection == "conversations") {
      //Finding the two users who are the conversationalists of that conversation and push conversation id to it's conversationsArr
      //FIXME: First and Second users downhere are the sa,e and need to be one function
      //First user
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[0],
        { $pull: { conversationsArr: newDocument._id } },
        { new: true }
      )
        .then((doc) => {
          console.log(
            `----> Yay! The ID ${newDocument._id} of conversations collection was deleted from the next user document's conversationsArr property: ${doc}`
          );
        })
        .catch((err) => {
          console.log(
            `----> ERROR from deleteIndexFromArray function when collection = conversations. First user the error: ${err}`
          );
        });
      //Seccond users
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[1],
        { $pull: { conversationsArr: newDocument._id } },
        { new: true }
      )
        .then((doc) => {
          console.log(
            `----> Yay! The ID ${newDocument.id} of conversations collection was deleted from the next user document's conversationsArr property: ${doc}`
          );
        })
        .catch((err) => {
          console.log(
            `----> ERROR from deleteIndexFromArray function when collection = conversations. Second user the error: ${err}`
          );
        });
    }
  } catch (err) {
    console.log(`-----> ERROR with function "deleteIndexFromArray": ${err}`);
  }
};

/**
 * @param {propertyQuery} req.query
 * @returns {propertyQuery} propertyQuery after modified
 * Converting key values which are _ids, to an objectID type so that it could be searchable in the find() function
 */
exports.adjustQueryIdsArrays = function (propertyQuery) {
  //console.log(`propertyQuery: ${propertyQuery}`);
  Object.keys(propertyQuery).forEach((key) => {
    if (
      (key == "conversationsArr") |
      "conversationalistsIndexesArr" |
      "messagesIndexesArr"
    ) {
      const keyValue = propertyQuery[key];
      const objedVal = mongoose.Types.ObjectId(keyValue);
      propertyQuery.conversationsArr = objedVal;
    }
  });
  return propertyQuery;
};

/**
 * @return {*} the value of the requested property of the document with the docId param
 * @param {*} docId
 * @param {*} reqProperty Name of requested property
 * @param {*} collectionModel the collection model name of the docId
 * @returns
 */
exports.extractPropertyVal = async function (
  docId,
  reqProperty,
  collectionModel
) {
  try {
    docId = mongoose.Types.ObjectId(docId);

    let reqPropertyVal = "";

    await User.findById(docId).then((doc) => {
      reqPropertyVal = doc[reqProperty];
    });

    return reqPropertyVal;
  } catch (err) {
    console.log(`---> extractPropertyVal error: ${err}`);
  }
};

/**
 * async function that in case of idCollectionModel param which is "n" it will get/delete/update the document with the id param, and in case of idCollectionModel param which is a collection model name, it will get/delete/update all the documents from the type of the collection param, of the document with the id param which is from the idCollectionModel param.
 * @param {String} getDeleteOrUpdate "get"/"delete"/"update"
 * @param {Object} req
 * @param {Object} res
 */
exports.getPatchDeleteByIdOrPropertyQuery = async function (
  getDeleteOrUpdate,
  req,
  res,
  byWhat,
  collectionModel
) {
  let bywhatCollectionModel = "";
  let bywhatVal = "";
  let getOneByBywhat = "";
  let deleteOneByBywhat = "";
  let updateOneByBywhat = "";
  if (byWhat == "id") {
    bywhatCollectionModel = req.params.idCollectionModel;
    bywhatVal = mongoose.Types.ObjectId(req.params.id);
    getOneByBywhat = byIdRouteControllers.getOneById;
    deleteOneByBywhat = byIdRouteControllers.deleteOneById;
    patchOneByBywhat = byIdRouteControllers.patchOneById;
  } else if ((byWhat = "propertyQuery")) {
    bywhatCollectionModel = req.params.propertyQueryCollectionModel;
    bywhatVal = req.query;
    getOneByBywhat = byPropertyQueryRouteControllers.getOneByPropertyQuery;
    deleteOneByBywhat =
      byPropertyQueryRouteControllers.deleteOneByPropertyQuery;
    patchOneByBywhat = byPropertyQueryRouteControllers.patchOneByPropertyQuery;
  }

  //The one document with the ID param
  if (bywhatCollectionModel == "n") {
    if (getDeleteOrUpdate == "get") {
      // Document's get query
      getOneByBywhat(
        bywhatVal,
        res,
        collectionModel,
        "getPatchDeleteByIdOrPropertyQuery - First call of getOnwById"
      );
    } else if (getDeleteOrUpdate == "update") {
      //Update by ID
      let update = req.body;
      patchOneByBywhat(
        bywhatVal,
        update,
        false,
        res,
        "getPatchDeleteByPropertyQuery - First call of patchOneById",
        collectionModel
      );
      //Delete by ID
    } else if (getDeleteOrUpdate == "delete") {
      deleteOneByBywhat(
        bywhatVal,
        res,
        collectionModel,
        "'getPatchDeleteByIdOrPropertyQuery' function - First call of deleteOneById"
      );
    }
    res.end("Done");
    //else -> The idCollectionModel param is a collection name
  } else {
    //TODO: check the value of idCollectionModel before the eval

    //Finding the specific document with the ID param, of the idCollectionModel type, that we want to get/delete/update all of it's "children's documents" of the collectionModel type

    const doc = await eval(bywhatCollectionModel).findOne(bywhatVal);

    if (bywhatCollectionModel == "User") {
      //Get/Patch/Delete all the messages of a specific user
      if (collectionModel == Message) {
        console.log(
          `----> YAY! Here are all the messages of the user with the ${byWhat}: ${
            byWhat == "id" ? bywhatVal : JSON.stringify(bywhatVal)
          } that you wanted to ${getDeleteOrUpdate}:`
        );

        doc.conversationsArr.forEach((conId) => {
          Conversation.findById(mongoose.Types.ObjectId(conId))
            .then((conDoc) => {
              conDoc.messagesIndexesArr.forEach((mesId) => {
                if (getDeleteOrUpdate == "get") {
                  byIdRouteControllers.getOneById(
                    mesId,
                    res,
                    collectionModel,
                    "getPatchDeleteByPropertyQuery - Second call of patchOneById"
                  );
                } else if (getDeleteOrUpdate == "delete") {
                  byIdRouteControllers.deleteOneById(
                    mesId,
                    res,
                    collectionModel,
                    "'getPatchDeleteByIdOrPropertyQuery' function - Second call of deleteOneById"
                  );
                } else if (getDeleteOrUpdate == "update") {
                  let update = req.body;
                  byIdRouteControllers.patchOneById(
                    mesId,
                    update,
                    false,
                    res,
                    "getPatchDeleteByIdOrPropertyQuery - Second call of patchOneById",
                    collectionModel
                  );
                }
              });
            })
            .catch((err) => {
              console.log(
                `----> ERROR from "getPatchDeleteByIdOrPropertyQuery" function - ${getDeleteOrUpdate} all messages of a user by ${byWhat} - problem with finding the conversation with id ${conId} of user: ${JSON.stringify(
                  doc
                )}. The error: ${err}`
              );
              res.end(err);
            });
        });
        res.end("Done");
      }
      //Get/Patch/Delete all the conversations of a specific user
      else if (collectionModel == Conversation) {
        console.log(
          `----> YAY! Here are all the conversations of the user with the ${byWhat}: ${
            byWhat == "id" ? bywhatVal : JSON.stringify(bywhatVal)
          } that you wanted to ${getDeleteOrUpdate}:`
        );
        doc.conversationsArr.forEach((conId) => {
          if (getDeleteOrUpdate == "get") {
            byIdRouteControllers.getOneById(
              conId,
              res,
              collectionModel,
              "getPatchDeleteByPropertyQuery - Third call of patchOneById"
            );
          } else if (getDeleteOrUpdate == "delete") {
            byIdRouteControllers.deleteOneById(
              conId,
              res,
              collectionModel,
              "'getPatchDeleteByIdOrPropertyQuery' function - Third call of deleteOneById"
            );
          } else if (getDeleteOrUpdate == "update") {
            let update = req.body;
            byIdRouteControllers.patchOneById(
              conId,
              update,
              false,
              res,
              "getPatchDeleteByIdOrPropertyQuery - Third call of patchOneById",
              collectionModel
            );
          }
        });
        res.end("Done");
      }
    } else if (bywhatCollectionModel == "Conversation") {
      //Get all the messages of a specific conversation
      if (collectionModel == Message) {
        console.log(
          `----> YAY! Here are all the messages of the conversation with the ${byWhat}: ${
            byWhat == "id" ? bywhatVal : JSON.stringify(bywhatVal)
          } that you wanted to ${getDeleteOrUpdate}:`
        );

        doc.messagesIndexesArr.forEach((mesId) => {
          if (getDeleteOrUpdate == "get") {
            byIdRouteControllers.getOneById(
              mesId,
              res,
              collectionModel,
              "getPatchDeleteByPropertyQuery - Fourth call of patchOneById"
            );
          } else if (getDeleteOrUpdate == "delete") {
            byIdRouteControllers.deleteOneById(
              mesId,
              res,
              collectionModel,
              "'getPatchDeleteByIdOrPropertyQuery' function - Fourth call of deleteOneById"
            );
          } else if (getDeleteOrUpdate == "update") {
            let id = req.params.id;
            let update = req.body;
            byIdRouteControllers.patchOneById(
              mesId,
              update,
              false,
              res,
              "getPatchDeleteByIdOrPropertyQuery - Fourth call of patchOneById"
            );
          }
        });
      }
      res.end("Done");
    } else {
      console.log(
        `${
          byWhat == "id"
            ? "/id/:idCollectionModel/:id"
            : "/propertyQuery/:propertyQueryCollectionModel"
        } - idCollectionModel param must be 'User' or 'Conversation'`
      );
    }
  }
};

/**
* More elegant version of "deleteIndexFromArray" function.
Find all of the documents (from 'collectionToDeleteFrom' collection)with the id in their arrayPropertyName and pulling id from that array property
 * @param {*} id String of a valid _id
 * @param {*} collectionToDeleteFrom String of a collection model
 * @param {*} arrayPropertyName String of an array property
 */
// async function deleteIdFromArrayPropertys(
//   id,
//   collectionToDeleteFrom,
//   arrayPropertyName
// ) {
//   //I dont use here fineOneAndUpdate() function because if the id is of a conversation, therer are two users to delte the conversation from
//   await collectionToDeleteFrom
//     .find({ arrayPropertyName: id })
//     .then((documents) => {
//       documents.forEach((doc) => {
//         doc.arrayPropertyName.splice(id, 1);
//         console.log(
//           `----> Yay! The id ${id} was deleted from ${arrayPropertyName} property of the next ${collectionToDeleteFrom} document: ${JSON.stringify(
//             doc
//           )}`
//         );
//       });
//     })
//     .catch((err) => {
//       console.log(
//         `----> ERROR from 'deleteIdFromArrayPropertys' function. id: ${id}, collectionToDeleteFrom: ${collectionToDeleteFrom}, arrayPropertyName: ${arrayPropertyName}.The error: ${err}`
//       );
//     });
// }

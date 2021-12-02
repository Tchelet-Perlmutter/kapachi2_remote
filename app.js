const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const twilio = require("twilio");

const User = require("./models/usersModel");
const Message = require("./models/messagesModel");
const Conversation = require("./models/conversationsModel");

const app = express();
const port = 3000;

// Connecting config.env file to the env variable by connecting dotenv package to the config.env module
dotenv.config({ path: "./config.env" });

// Body parse - Middleware that add the body to the request
app.use(express.json());

// Copying the DB URI from config.env module
const DB = process.env.DATABASE;

// Connecting Mongoose to the Express app
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log(" ----> DB connection seccessful"))
  .catch((err) => {
    console.log(`----> Mongoose-connect's Promise Rejected because of ${err}`);
  });

/////// ROUTES /////////

const router1 = express.Router();
let collection = " ";
let collectionModel = " ";
let id = " ";

// Asigning the collection name in to a variable & upercasing the first char of the collection + cutting the last letter, in order to turn it to the collection's model's name
app.use("/kapachi2/v1/:collection", (req, res, next) => {
  collection = req.params.collection;
  collectionModel = eval(
    (collection.charAt(0).toUpperCase() + collection.slice(1)).slice(0, -1)
  );
  next();
});

app.use("/kapachi2/v1/:collection", router1);

// "/" route
router1
  .route("/")

  .post((req, res) => {
    postDoc(req.body, collectionModel, true, res);
  })
  // GET all the documents of the collection
  .get((req, res) => {
    // Document's getting query
    documents = collectionModel
      .find()
      .then((doc) => {
        console.log(
          `----> Yay! All the documents of ${collection} collection: ${doc}`
        );
        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with getting all the documents of ${collection}: ${err}`
        );
        res.send(`${err}`);
      });
  })
  // Delete all the collection's documents
  .delete((req, res) => {
    // Document's delliting query
    documents = collectionModel
      .deleteMany()
      .then(() => {
        console.log(
          `----> Yay! All the documents of ${collection} collection was deleted`
        );
        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with deliting all the documents of ${collection}: ${err}`
        );
        res.send(`${err}`);
      });
  });

// "/id/:idCollectionModel/:id" route
router1
  .route("/id/:idCollectionModel/:id")
  // Patch - Update a document
  .patch((req, res) => {
    let id = req.params.id;
    let update = req.body;
    patchById(id, update, true, res);
  })
  // GET document by id.
  // the collection param determines the type of the required documents. The idCollectionModel param determines the type of the ID that we require the documets of. If the idCollectionModel is "n", it means that the ID param is the ID of the required document. Otherwise, the route will return all of the collection param documents, of the document with the ID param, and the idCollectionModel param will tell us the collection of that ID param.
  //For example: collection = messages, idCollectionModel = User, id = someID. --> The route will return all the messages of the user with the ID param
  // ??? How to query for documents which have an array paroperty with a combination of a few values, *no metter the value's order*?
  .get((req, res) => {
    id = req.params.id;

    //The one document with the ID param
    if (req.params.idCollectionModel == "n") {
      // Document's get query
      documents = collectionModel
        .findById(id)
        .then((doc) => {
          console.log(
            `----> Yay! the document with id ${id} of ${collection} collection: ${doc}`
          );
          res.send("Done");
        })
        .catch((err) => {
          console.log(
            `----> ERROR with getting the document with id ${id} of ${collection}: ${err}`
          );
          res.send(`${err}`);
        });
    } else {
      let idCollectionModel = req.params.idCollectionModel;

      //TODO: check the value of idCollectionModel before the eval
      //Finding the specific document with the ID param, of the idCollectionModel type, that we want to get all of it's "children's documents" of the collectionModel type
      eval(idCollectionModel)
        .findById(mongoose.Types.ObjectId(id))
        .then((doc) => {
          if (idCollectionModel == "User") {
            //Get all the messages of a specific user
            if (collectionModel == Message) {
              console.log(
                `----> YAY! Here are all the messages of the user with the ID: ${id}:`
              );

              doc.conversationsArr.forEach((conId) => {
                Conversation.findById(mongoose.Types.ObjectId(conId)).then(
                  (conDoc) => {
                    conDoc.messagesIndexesArr.forEach((mesId) => {
                      Message.findById(mongoose.Types.ObjectId(mesId)).then(
                        (mesDoc) => {
                          console.log(mesDoc);
                        }
                      );
                    });
                  }
                );
              });
              res.end("Done");
            }
            //Get all the conversations of a specific user
            else if (collectionModel == Conversation) {
              console.log(
                `----> YAY! Here are all the conversations of the user with the ID: ${id}:`
              );
              doc.conversationsArr.forEach((conId) => {
                Conversation.findById(mongoose.Types.ObjectId(conId)).then(
                  (conversation) => {
                    console.log(conversation);
                  }
                );
              });
              res.end("Done");
            }
          } else if (idCollectionModel == "Conversation") {
            //Get all the messages of a specific conversation
            if (collectionModel == Message) {
              Conversation.findById(mongoose.Types.ObjectId(id)).then(
                (conDoc) => {
                  conDoc.messagesIndexesArr.forEach((mesId) => {
                    Message.findById(mongoose.Types.ObjectId(mesId)).then(
                      (mesDoc) => {
                        console.log(mesDoc);
                      }
                    );
                  });
                }
              );
              res.end("Done");
            }
          } else {
            console.log(
              "---> ERROR from route '/id/:idCollectionModel/:id' - idCollectionModel param must be 'User' or 'Conversation'"
            );
          }
        })
        .catch((err) => {
          console.log(
            `---> ERROR from route '/id/:idCollectionModel/:id' - Could not find a document with id ${id} which you want to find it's related ${idCollectionModel} documents: ${err}`
          );
        });
    }
  })
  // Delete document by id
  .delete((req, res) => {
    id = req.params.id;

    // Document's delliting query
    document = collectionModel
      .findByIdAndDelete(id)
      .then((doc) => {
        // Delete the document id from it's array in other collection
        deleteIndexFromArray(doc);
        console.log(
          `----> Yay! The document with id ${doc.id} of ${collection} collection was deleted`
        );
        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with deliting the document with id ${id} of ${collection}: ${err}`
        );
        res.send(`${err}`);
      });
  });

// "/propertyQuery" route
// The format of req.qury in the URI is - propertyName[condition or inner property (optional)]=val. Mongoose convert it to a query object: {"propertyName": {"condition or inner property": val}}.
//In order to make spaces in the value in the URI, we should use + sign instead a space.
//Inside the handler functions, 'adjustQueryConditions' is adding $ sign before every condition.
//In order to query the documents which contain a specific value in one of their array propertys, all that is needed is to write the name of the array property, then = sign and then the value that we want the array to contain
//In order to query that but with multiple values we want the array to contain, that would be the format: arrayPropertyName[]=val1&arrayPropertyName[]=val2&arrayPropertyName[]=val3
router1
  .route("/propertyQuery")
  //GET document by property
  .get((req, res) => {
    let propertyQuery = req.query;
    let conditionVal = "";

    propertyQuery = adjustQueryConditions(propertyQuery);
    propertyQuery = adjustQueryIdsArrays(propertyQuery);

    // Document's get query
    documents = collectionModel
      .find(propertyQuery)
      .then((doc) => {
        console.log(
          `----> Yay! Here are the documents that fit the query ${JSON.stringify(
            propertyQuery
          )} of ${collection} collection: ${doc}`
        );
        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with getting the documents that feet the property query: ${propertyQuery} of ${collection}: ${err}`
        );
        res.send(`${err}`);
      });
  })
  // Delete document by property query
  .delete((req, res) => {
    propertyQuery = req.query;

    propertyQuery = adjustQueryConditions(propertyQuery);
    propertyQuery = adjustQueryIdsArrays(propertyQuery);

    // Document's delliting query
    document = collectionModel
      .deleteMany(propertyQuery)
      .then((doc) => {
        console.log(
          `----> Yay! The documents that feet the propertyQuery ${JSON.stringify(
            propertyQuery
          )} of ${collection} collection was deleted: ${JSON.stringify(doc)}`
        );
        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with deliting the document that feet the propertyQuery ${propertyQuery} of ${collection}: ${err}`
        );
        res.send(`${err}`);
      });
  })
  .patch((req, res) => {
    propertyQuery = req.query;
    const update = req.body;

    propertyQuery = adjustQueryConditions(propertyQuery);
    propertyQuery = adjustQueryIdsArrays(propertyQuery);

    //FIXME:
    console.log(`propertyQuery: ${propertyQuery} of ${collection} collection`);
    // Document creation
    document = collectionModel
      .findOneAndUpdate(propertyQuery, update, {
        new: true,
        runValidators: true,
      })
      .then((doc) => {
        console.log(
          `----> Yay! The update - ${JSON.stringify(
            update
          )} was added to a ${collection} document that feet the propertyQuery ${JSON.stringify(
            propertyQuery
          )} of ${collection}: ${doc}`
        );
        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with updating a ${collection} document that feet the propertyQuery ${propertyQuery}: ${err}`
        );
        res.send(`${err}`);
      });
  });

////////// CONTROLERS ///////////

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

/**
 * Adding a new key to the sender of the message
 * @param {*} newMessage The new message that entitels the sender another key
 * @param {*} res
 */
async function addKeyToSender(newMessage, res) {
  const senderId = mongoose.Types.ObjectId(newMessage.from);
  let updatedKeyNum = "";
  await User.findById(senderId)
    .then((doc) => {
      updatedKeyNum = doc.keysQ + 1;
    })
    .catch((err) => {
      console.log(
        `---> ERROR from addKeyToSender function - in findBYId func: ${err.message}`
      );
    });
  const update = { keysQ: updatedKeyNum };

  patchById(senderId, update, false, res);
}

/**
 * The function is replacing the keys that are in the update param, to the values in the update param.
 * @param {*} id The id of the doc we want to update
 * @param {*} update The JSON object with the update info
 * @param {*} res In order to allow a response
 */
async function patchById(id, update, isResEnd, res) {
  let theCollectionModel = collectionModel;
  let theCollectionName = collection;
  const updateFirstKey = Object.entries(update)[0][0];
  let updateSecondKey = Object.keys(Object.entries(update)[0][1]);
  let updatedDoc = "";

  if (updateFirstKey == "keysQ" || updateSecondKey == "lastTenGiftedUsersArr") {
    theCollectionModel = User;
    theCollectionName = "users";
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
        )} was added to ${theCollectionName} document with id ${id}: ${doc}`
      );
      if (isResEnd) {
        res.send("Done"); //FIXME: The res is undefined here
      }

      return doc;
    })
    .catch((err) => {
      console.log(
        `----> ERROR from patchById function - didn't update the ${collection} document with id ${id} with the update ${JSON.stringify(
          update
        )} : ${err}`
      );
      //FIXME:res.send(`${err}`);
    });
  return document;
}

/**
 * @return {*} the value of the requested property of the document with the docId param
 * @param {*} docId
 * @param {*} reqProperty Name of requested property
 * @param {*} collectionModel the collection model name of the docId
 * @returns
 */
async function extractPropertyVal(docId, reqProperty, collectionModel) {
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
}

/**
 * Sends an SMS to the person that got the new message
 * @param {*} SMSMessage = The body of the message will be sent in the SMS
 * @param {*} to = phone nember
 * @param {*} accountSid = Your Account SID from www.twilio.com/console
 * @param {*} authToken = Your Aut token from www.twilio.com/console
 */
async function youGotMessageSMS(reqBody) {
  try {
    const messageType = reqBody.messageType;
    const startOfMessage = reqBody.message.substring(0, 80);
    const seeFullMessageURL = "Some URL";

    //Finding the name and phone numers of the sender and the addressy by their _id property

    let addressyName = "";
    let addressyPhone = "";
    let senderName = "";
    let senderPhone = "";
    let docAddressyId = reqBody.to;
    let docSenderId = reqBody.from;

    // Names:

    senderName = await extractPropertyVal(docSenderId, "name", "User");

    addressyName = await extractPropertyVal(docAddressyId, "name", "User");

    // Phones:

    addressyPhone = await extractPropertyVal(docAddressyId, "phone", "User");

    let SMSMessage = `${startOfMessage}... ${addressyName}, ${senderName} sent you a ${messageType} message Threw our platform - "Kapachi". To Read his full message, enter: ${seeFullMessageURL}`;

    const accountSid = proccess.env.ACCOUNT_SID;
    const authToken = proccess.env.AUTH_TOKEN;

    //////
    const client = new twilio(accountSid, authToken);

    client.messages
      .create({
        body: SMSMessage,
        to: addressyPhone, // Text this number
        from: "+13344589744", // From a valid Twilio number
      })
      .then((message) => console.log(message.sid));
  } catch (err) {
    console.log(`---> Error from function "youGotMesageSMS": ${err}`);
  }
}

/**
 * @param {propertyQuery} req.query
 * @returns {propertyQuery} propertyQuery after modified
 * Converting key values which are _ids, to an objectID type so that it could be searchable in the find() function
 */
function adjustQueryIdsArrays(propertyQuery) {
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
}

/**
 * @param {propertyQuery} req.query
 * @returns {propertyQuery} propertyQuery after modified
 * adding "$" sign to the condition part of the query so that it would be searchable in the find() function
 */
function adjustQueryConditions(propertyQuery) {
  Object.values(propertyQuery).forEach((fieldVal) => {
    if (typeof fieldVal === "object") {
      Object.keys(fieldVal).forEach((queryCondition) => {
        fixedQueryCondition = `$${queryCondition}`;
        conditionVal = propertyQuery[queryCondition];

        fieldVal[fixedQueryCondition] = fieldVal[queryCondition];
        delete fieldVal[queryCondition];
      });
    }
  });
  return propertyQuery;
}

/**
 *  Create new document with the 'newDocContent' of 'theCollectionModel' collection. if the addressy is unassigned. If the addressy is assigned but the sender does'nt have a conversation with him yet (it is their first message), postDoc create the new conversation.
 * @param {*} newDocContent JSON of the new document. 
 - In case of message to an unassigned addressy, 'to' would be in the next format: [["toPhone", "validPhone"], ["toName", "name"]]. 
 * @param {*} theCollectionModel model object of the new document collection
 * @param {*} isResEnd boollean answers if we want postDoc to res.end and finish the medlewears sicle, or not yet.
 * @param {*} res
 */
async function postDoc(newDocContent, theCollectionModel, isResEnd, res) {
  try {
    // POST a document - Creating a new document of the collection and save it into the db

    theCollectionModel = eval(theCollectionModel);

    document = await new theCollectionModel(newDocContent)
      .save()
      .then(async (doc) => {
        console.log(`----> Yay! The new document: ${doc}`);

        //Send an SMS to the addressy about the new message he got and add one key to the sender and adding the addressy ID to the lastTenGiftedUsersArr array property of the sender
        if ((theCollectionModel == Message) & (doc.isGiftMessage == true)) {
          let senderId = mongoose.Types.ObjectId(doc.from);
          let addressyId = "";
          if (typeof newDocContent.to == "string") {
            addressyId = mongoose.Types.ObjectId(newDocContent.to);
          } else {
            //Creating a new User document of the unsigned adressy which is not in the DB yet
            let mapToProperty = new Map(doc.to);

            let newUnassignedUserContent = {
              phone: mapToProperty.get("toPhone"),
              conversationsArr: [],
              name: mapToProperty.get("toName"),
              password: mapToProperty.get("toPhone"),
              userName: mapToProperty.get("toName"),
              keysQ: 0,
              messagesHeChanedQ: 0,
              userRank: 0,
              status: "I am a loved soul",
              lastTenGiftedUsersArr: [],
            };

            let newUnassignedUser = await postDoc(
              newUnassignedUserContent,
              User,
              false,
              res
            );

            addressyId = newUnassignedUser._id;
            addressyId = String(newUnassignedUser._id);

            //Creating new conversation document of the sender and the new unassigned user we just created. The postDoc will push the new conversation id to its conversationalits relevant arrays
            const newConversationContent = {
              messagesIndexesArr: [doc._id],
              conversationalistsIndexesArr: [doc.from, addressyId],
            };

            await postDoc(newConversationContent, Conversation, false, res);

            //Changing the 'to' value of the new message, to be the id of the new unassigned user and not the original Map
            const toUpdated = { to: addressyId };
            doc = await patchById(doc._id, toUpdated, false, res);
          }

          const update = {
            $push: {
              lastTenGiftedUsersArr: addressyId,
            },
          };

          //Adding the adressy _id to the lastTenGiftedArr property of the sender
          await patchById(senderId, update, false, res);

          addKeyToSender(doc);

          youGotMessageSMS(doc);
        }

        //This 'if' is for aluminate duplication in the new message ID in the messagesIndexesArr property of the conversation, when it is a unassigned addressy, because I added it's ID to the array when I created the new conversation before.
        if (typeof newDocContent.to != "object") {
          //If the conversationalists don't have a conversation document yet, it will be created threw that addIndexToArray function
          await addIndexToArray(doc, theCollectionModel, res);
        }

        if (isResEnd) {
          res.send("Done");
        } else {
          return doc;
        }
      })
      .catch((err) => {
        console.log(
          `----> ERROR with some part of the proccess of postDoc function. The doc content: ${JSON.stringify(
            newDocContent
          )} : ${err}`
        );
        res.send(`${err}`);
      });

    return document;
  } catch (err) {
    console.log(`----> ERROR from postDoc function: ${err}`);
  }
}

/**
 * Takes the newDocument and add it's _id to the property (of other collection's document) that holds the id of that type of documents
 * @param //{Document} newDocument
 */
function addIndexToArray(newDocument, theCollectionModel, res) {
  try {
    if (theCollectionModel == Message) {
      Conversation.findOneAndUpdate(
        // Filter
        {
          //Finding the conversation that the message belongs to.The $elemMatch operator matches documents that contain an array field with at least one element that matches all the specified query criteria.

          $and: [
            { conversationalistsIndexesArr: { $eq: newDocument.from } },
            { conversationalistsIndexesArr: { $eq: newDocument.to } },
          ],
        },
        //Update
        {
          //push the message id to it's messagesIndexesArr
          $push: { messagesIndexesArr: newDocument._id },
        },
        // Options
        {
          new: true,
        }
      )
        .then((doc) => {
          if (doc == null) {
            let newConversationContent = {
              messagesIndexesArr: [newDocument._id],
              conversationalistsIndexesArr: [newDocument.from, newDocument.to],
            };
            postDoc(newConversationContent, Conversation, true, res);
            return;
          }

          console.log(
            `----> Yay! The ID ${newDocument._id} of messages colection  was added to the next messagesIndexesArr property of a conversations document : ${doc}`
          );
        })
        .catch((err) => {
          console.log(
            `----> ERROR from addIndexToArray function when collection = messages: ${err}`
          );
        });
    } else if (theCollectionModel == Conversation) {
      //Finding the two users who are the conversationalists of that conversation and push conversation id to it's conversationsArr
      //FIXME: First and Second users downhere are the sa,e and need to be one function
      //First user - 'from' user
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[0],
        { $push: { conversationsArr: newDocument._id } },
        { new: true }
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument.id} of conversations collection was added to the next  conversationsArr property of a user document: ${doc}`
        );
      });
      //Seccond users - 'to' user
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[1],
        { $push: { conversationsArr: newDocument._id } },
        { new: true }
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument.id} of conversations collection was added to the next user document's conversationsArr property: ${doc}`
        );
      });
    }
  } catch (err) {
    console.log(
      `-----> ERROR with function "addIndexToArray" when collection = conversations: ${err}`
    );
  }
}

/**
 * Takes the newDocument and add it's _id to the property (of other collection's document) that holds the id of that type of documents
 * @param //{Document} newDocument
 */
function deleteIndexFromArray(newDocument) {
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
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument.id} of colection ${collection} was deleted from the next document's relevant array property: ${doc}`
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
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument._id} of conversations collection was deleted from the next user document's conversationsArr property: ${doc}`
        );
      });
      //Seccond users
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[1],
        { $pull: { conversationsArr: newDocument._id } },
        { new: true }
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument.id} of conversations collection was deleted from the next user document's conversationsArr property: ${doc}`
        );
      });
    }
  } catch (err) {
    console.log(`-----> ERROR with function "deleteIndexFromArray": ${err}`);
  }
}

////////// SERVER LISTENING //////////

// Making the server listen on app port
app.listen(port, () => {
  console.log(`----> Example app listening at http://localhost:${port}`);
});

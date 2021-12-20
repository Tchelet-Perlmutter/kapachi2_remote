const twilio = require("twilio");
const { DocumentList } = require("twilio/lib/rest/sync/v1/service/document");

const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Message = require("../models/messagesModel");
const Conversation = require("../models/conversationsModel");
const Group = require("../models/groupsModel");

const fewRoutesControllers = require("./fewRoutesControllers");
const byIdRoutesControllers = require("./byIdRouteControllers");

/**
 * Takes the newDocument and add it's _id to the property (of other collection's document) that holds the id of that type of documents
 * @param {Document object} newDocument
 * @param {model object} theCollectionModel
 * @param {response object}
 */
async function addIndexToArray(newDocument, theCollectionModel, res) {
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
      )
        .then((doc) => {
          console.log(
            `----> Yay! The ID ${newDocument.id} of conversations collection was added to the next  conversationsArr property of a user document: ${doc}`
          );
        })
        .catch((err) => {
          console.log(
            `----> ERROR from addIndexToArray function when collection = Conversation. First user. the error: ${err}`
          );
        });
      //Seccond users - 'to' user
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[1],
        { $push: { conversationsArr: newDocument._id } },
        { new: true }
      )
        .then((doc) => {
          console.log(
            `----> Yay! The ID ${newDocument.id} of conversations collection was added to the next user document's conversationsArr property: ${doc}`
          );
        })
        .catch((err) => {
          console.log(
            `----> ERROR from addIndexToArray function when collection = Conversation. First user. the error: ${err}`
          );
        });
    }
  } catch (err) {
    console.log(`-----> ERROR with function "addIndexToArray": ${err}`);
  }
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
            doc = await byIdRoutesControllers.patchOneById(
              doc._id,
              toUpdated,
              false,
              res
            );
          }

          const update = {
            $push: {
              lastTenGiftedUsersArr: addressyId,
            },
          };

          //Adding the adressy _id to the lastTenGiftedArr property of the sender
          await byIdRoutesControllers.patchOneById(
            senderId,
            update,
            false,
            res
          );

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
          `----> ERROR with some part of the process of postDoc function. The doc content: ${JSON.stringify(
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

    senderName = await fewRoutesControllers.extractPropertyVal(
      docSenderId,
      "name",
      "User"
    );

    addressyName = await fewRoutesControllers.extractPropertyVal(
      docAddressyId,
      "name",
      "User"
    );

    // Phones:

    addressyPhone = await fewRoutesControllers.extractPropertyVal(
      docAddressyId,
      "phone",
      "User"
    );

    let SMSMessage = `${startOfMessage}... ${addressyName}, ${senderName} sent you a ${messageType} message Threw our platform - "Kapachi". To Read his full message, enter: ${seeFullMessageURL}`;

    const accountSid = process.env.ACCOUNT_SID;
    const authToken = process.env.AUTH_TOKEN;

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

  byIdRoutesControllers.patchOneById(
    senderId,
    update,
    false,
    res,
    "addKeyToSender"
  );
}

exports.getAllDocuments = function (req, res, collectionModel) {
  documents = collectionModel
    .find()
    .then((doc) => {
      console.log(`----> Yay! All the documents of the collection: ${doc}`);
      res.send("Done");
    })
    .catch((err) => {
      console.log(
        `----> ERROR with getting all the documents you asked for: ${err}`
      );
      res.send(`${err}`);
    });
};

exports.deleteAllDocuments = function (req, res, collectionModel) {
  documents = collectionModel
    .deleteMany()
    .then(() => {
      console.log(
        `----> Yay! All the documents you askes for collection was deleted`
      );
      res.send("Done");
    })
    .catch((err) => {
      console.log(
        `----> ERROR with deliting all the documents you askes for: ${err}`
      );
      res.send(`${err}`);
    });
};

exports.postDoc = postDoc;

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

// Asigning the collection name in to a variable & upercasing the first char of the collection + cutting the last letter, in order to turn it to the collection's model's name. ??? Without the evan function the collectionModel's type would be String and not a function

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
  // POST a document - Creating a new document of the collection and save it into the db
  .post((req, res) => {
    // Document creation
    document = new collectionModel(req.body)
      .save()
      .then((doc) => {
        console.log(`----> Yay! The new ${collection} document: ${doc}`);

        //Send an SMS to the addressy about the new message he got
        if (collectionModel == Message) {
          youGotMessageSMS(req.body);
        }

        addIndexToArray(doc);

        addKeyToSender(doc);

        res.send("Done");
      })
      .catch((err) => {
        console.log(
          `----> ERROR with adding a new ${collection} document: ${err}`
        );
        res.send(`${err}`);
      });
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

// "/id/:id" route
router1
  .route("/id/:id")
  // Patch - Update a document
  .patch((req, res) => {
    let id = req.params.id;
    let update = req.body;
    patchById(id, update, res);
  })
  // GET document by id
  .get((req, res) => {
    id = req.params.id;
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

    console.log(
      `typeof propertyQuery: ${typeof propertyQuery.conversationsArr}`
    );
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

    // Document creation
    document = collectionModel
      .findOneAndUpdate(propertyQuery, update, {
        new: true,
        runValidators: true,
      })
      .then((doc) => {
        console.log(
          `----> Yay! The updated ${collection} document that feet the propertyQuery ${JSON.stringify(
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
 * Adding a new key to the sender of the message
 * @param {*} newMessage The new message that entitels the sender another key
 * @param {*} res
 */
async function addKeyToSender(newMessage, res) {
  const senderId = mongoose.Types.ObjectId(newMessage.from);
  let updatedKeyNum = "";
  await User.findById("613ba907ebcfca14e4705541")
    .then((doc) => {
      updatedKeyNum = doc.keysQ + 1;
    })
    .catch((err) => {
      console.log(
        `---> ERROR from addKeyToSender function - in findBYId func: ${err.message}`
      );
    });
  const update = { keysQ: updatedKeyNum };

  patchById(senderId, update, res);
}

/**
 * The function is replacing the keys that are in the update param, to the values in the update param.
 * @param {*} id The id of the doc we want to update
 * @param {*} update The JSON object with the update info
 * @param {*} res In order to allow a response
 */
async function patchById(id, update, res) {
  id = mongoose.Types.ObjectId(id);
  // Document creation
  document = User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .then((doc) => {
      console.log(
        `----> Yay! The updated ${collection} document with id ${id}: ${doc}`
      );
      res.send("Done");
    })
    .catch((err) => {
      console.log(
        `----> ERROR with updating a ${collection} document with id ${id}: ${err}`
      );
      res.send(`${err}`);
    });
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
    if ((key == "conversationsArr") | "conversationalistsArr" | "messagesArr") {
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
 * Takes the newDocument and add it's _id to the property (of other collection's document) that holds the id of that type of documents
 * @param //{Document} newDocument
 */
function addIndexToArray(newDocument) {
  try {
    if (collection == "messages") {
      Conversation.findOneAndUpdate(
        // Filter
        {
          //Finding the conversation that the message belongs to.The $elemMatch operator matches documents that contain an array field with at least one element that matches all the specified query criteria.
          conversationalistsIndexesArr: {
            $elemMatch: { $eq: newDocument.from, $eq: newDocument.to },
          },
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
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument.id} of messages colection  was added to the next messagesArr property of a conversations document : ${doc}`
        );
      });
    } else if (collection == "conversations") {
      //Finding the two users who are the conversationalists of that conversation and push conversation id to it's conversationsArr
      //FIXME: First and Second users downhere are the sa,e and need to be one function
      //First user
      User.findByIdAndUpdate(
        newDocument.conversationalistsIndexesArr[0],
        { $push: { conversationsArr: newDocument._id } },
        { new: true }
      ).then((doc) => {
        console.log(
          `----> Yay! The ID ${newDocument.id} of conversations collection was added to the next  conversationsArr property of a user document: ${doc}`
        );
      });
      //Seccond users
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
    console.log(`-----> ERROR with function "addIndexToArray": ${err}`);
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
          conversationalistsIndexesArr: {
            $elemMatch: { $eq: newDocument.from, $eq: newDocument.to },
          },
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
          `----> Yay! The ID ${newDocument.id} of conversations collection was deleted from the next user document's conversationsArr property: ${doc}`
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

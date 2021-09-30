const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();
const port = 3000;
let messageDocument;

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

//////// Schemas ////////

// message schema
const messageSchema = new mongoose.Schema({
  //from or to would be a user ID
  from: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    // TODO: check if there is a person with that ID with "validate"
    trim: true,
  },
  to: {
    type: String,
    required: [true, "A message should have a 'from' propery"],
    // TODO: check if there is a person with that ID with "validate"
    trim: true,
  },
  // Date = miliseconds formated date
  date: {
    type: Number,
    required: [true, "A message should have a date"],
  },
  message: {
    type: String,
    required: [true, "A message should have a 'message' propery"],
    trim: true,
  },
  isLocked: {
    type: Boolean,
    required: [true, "A message should have a 'isLocked' propery"],
  },
  isSent: {
    type: Boolean,
    required: [true, "A message should have a 'isSent' propery"],
  },
  isRead: {
    type: Boolean,
    required: [true, "A message should have a 'isRead' proper"],
  },
  //messageType = "Thanks" or a "Sorry"
  messageType: {
    type: String,
    required: [true, "A message should have a 'message Type'"],
    trim: true,
  },
});

// conversation schema.
const conversationSchema = new mongoose.Schema({
  // messages Indexes (IDs)
  messagesIndexesArr: {
    type: Array,
  },
  //The converationalists of the conversation = their IDs
  conversationalistsIndexesArr: {
    type: Array,
    required: [true, "A conversation should have conversationalists"],
  },
});

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
  userName: {
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

/////// MODELS ///////

// Message model
const Message = mongoose.model("messages", messageSchema);

// Conversation model
const Conversation = mongoose.model("conversations", conversationSchema);

// User model
const User = mongoose.model("users", userSchema);

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
        addIndexToArray(doc);
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
    id = req.params.id;
    const update = req.body;
    // Document creation
    document = collectionModel
      .findByIdAndUpdate(id, update, {
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
    // Delete the document id from it's array in other collection

    // Document's delliting query
    document = collectionModel
      .findByIdAndDelete(id)
      .then((doc) => {
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
// GET document by id
// .get((req, res) => {
//   id = req.params.id;
//   // Document's get query
//   documents = collectionModel
//     .findById(id)
//     .then((doc) => {
//       console.log(
//         `----> Yay! the document with id ${id} of ${collection} collection: ${doc}`
//       );
//       res.send("Done");
//     })
//     .catch((err) => {
//       console.log(
//         `----> ERROR with getting the document with id ${id} of ${collection}: ${err}`
//       );
//       res.send(`${err}`);
//     });
// })
// // Delete document by id
// .delete((req, res) => {
//   id = req.params.id;
//   // Document's delliting query
//   document = collectionModel
//     .findByIdAndDelete(id)
//     .then(() => {
//       console.log(
//         `----> Yay! The document with id ${id} of ${collection} collection was deleted`
//       );
//       res.send("Done");
//     })
//     .catch((err) => {
//       console.log(
//         `----> ERROR with deliting the document with id ${id} of ${collection}: ${err}`
//       );
//       res.send(`${err}`);
//     });
// });

////////// CONTROLERS ///////////

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

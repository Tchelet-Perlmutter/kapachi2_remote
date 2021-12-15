const express = require("express");
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("./models/usersModel");
const Message = require("./models/messagesModel");
const Conversation = require("./models/conversationsModel");

const baseRouteControllers = require("./controllers/baseRouteControllers");
const byIdRouteControllers = require("./controllers/byIdRouteControllers");
const byPropertyQueryRouteControllers = require("./controllers/byPropertyQueryRouteControllers");
const fewRoutesControllers = require("./controllers/fewRoutesControllers");

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
    baseRouteControllers.postDoc(req.body, collectionModel, true, res);
  })
  // GET all the documents of the collection
  .get((req, res) => {
    baseRouteControllers.getAllDocuments(req, res, collectionModel);
  })
  // Delete all the collection's documents
  .delete((req, res) => {
    baseRouteControllers.deleteAllDocuments(req, res, collectionModel);
  });

// the collection param determines the type of the required documents. The idCollectionModel param determines the type of the ID that we require the documets of. If the idCollectionModel is "n", it means that the ID param is the ID of the required document. Otherwise, the route will return all of the collection param documents, of the document with the ID param, and the idCollectionModel param will tell us the collection of that ID param.
//For example: collection = messages, idCollectionModel = User, id = someID. --> The route will return all the messages of the user with the ID param
// ??? How to query for documents which have an array paroperty with a combination of a few values, *no metter the value's order*?
// "/id/:idCollectionModel/:id" route
router1
  .route("/id/:idCollectionModel/:id")
  // Patch - Update a document
  .patch((req, res) => {
    fewRoutesControllers.getPatchDeleteByIdOrPropertyQuery(
      "update",
      req,
      res,
      "id",
      collectionModel
    );
  })
  .get((req, res) => {
    fewRoutesControllers.getPatchDeleteByIdOrPropertyQuery(
      "get",
      req,
      res,
      "id",
      collectionModel
    );
  })
  // Delete document by id
  .delete((req, res) => {
    fewRoutesControllers.getPatchDeleteByIdOrPropertyQuery(
      "delete",
      req,
      res,
      "id",
      collectionModel
    );
  });

// "/propertyQuery" route
// The format of req.qury in the URI is - propertyName[condition or inner property (optional)]=val. Mongoose convert it to a query object: {"propertyName": {"condition or inner property": val}}.
//In order to make spaces in the value in the URI, we should use + sign instead a space.
//Inside the handler functions, 'adjustQueryConditions' is adding $ sign before every condition.
//In order to query the documents which contain a specific value in one of their array propertys, all that is needed is to write the name of the array property, then = sign and then the value that we want the array to contain
//In order to query that but with multiple values we want the array to contain, that would be the format: arrayPropertyName[]=val1&arrayPropertyName[]=val2&arrayPropertyName[]=val3
router1
  .route("/propertyQuery/:propertyQueryCollectionModel")
  //GET document by property
  .get((req, res) => {
    fewRoutesControllers.getPatchDeleteByIdOrPropertyQuery(
      "get",
      req,
      res,
      "propertyQuery",
      collectionModel
    );
  })
  // Delete document by property query
  .delete((req, res) => {
    fewRoutesControllers.getPatchDeleteByIdOrPropertyQuery(
      "delete",
      req,
      res,
      "propertyQuery",
      collectionModel
    );
  })
  .patch((req, res) => {
    fewRoutesControllers.getPatchDeleteByIdOrPropertyQuery(
      "update",
      req,
      res,
      "propertyQuery",
      collectionModel
    );
  });

////////// SERVER LISTENING //////////

// Making the server listen on app port
app.listen(port, () => {
  console.log(`----> Example app listening at http://localhost:${port}`);
});

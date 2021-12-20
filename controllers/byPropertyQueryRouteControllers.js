const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Message = require("../models/messagesModel");
const Conversation = require("../models/conversationsModel");
const Group = require("../models/groupsModel");

const fewRoutesControllers = require("./fewRoutesControllers");

/**
 * @param {propertyQuery} req.query
 * @returns {propertyQuery} propertyQuery after modified
 * adding "$" sign to the condition part of the query so that it would be searchable in the find() function
 */
exports.adjustQueryConditions = function (propertyQuery) {
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
};

exports.getOneByPropertyQuery = async function (
  propertyQuery,
  res,
  theCollectionModel,
  funcCalledFrom
) {
  let conditionVal = "";

  propertyQuery = fewRoutesControllers.adjustQueryConditions(propertyQuery);
  propertyQuery = fewRoutesControllers.adjustQueryIdsArrays(propertyQuery);

  // Document's get query
  documents = theCollectionModel
    .find(propertyQuery)
    .then((doc) => {
      console.log(
        `----> Yay! Here are the documents that fit the query ${JSON.stringify(
          propertyQuery
        )}: ${doc}`
      );
    })
    .catch((err) => {
      console.log(
        `----> ERROR from getOneByPropertyQuery function, that was called from ${funcCalledFrom} function. Problem with getting the documents that feet the property query: ${propertyQuery}: ${err}`
      );
      res.send(`${err}`);
    });
};

exports.deleteOneByPropertyQuery = async function (
  propertyQuery,
  res,
  theCollectionModel,
  funcCalledFrom
) {
  propertyQuery = req.query;

  propertyQuery = fewRoutesControllers.adjustQueryConditions(propertyQuery);
  propertyQuery = fewRoutesControllers.adjustQueryIdsArrays(propertyQuery);

  // Document's delliting query
  document = theCollectionModel
    .deleteMany(propertyQuery)
    .then((doc) => {
      console.log(
        `----> Yay! The documents that feet the propertyQuery ${JSON.stringify(
          propertyQuery
        )} of ${collection} collection was deleted: ${JSON.stringify(doc)}`
      );
    })
    .catch((err) => {
      console.log(
        `----> ERROR from deleteOneByPropertyQuery function, that was called from ${funcCalledFrom} function. Problem with deliting the document that feet the propertyQuery ${propertyQuery} of ${collection}: ${err}`
      );
      res.send(`${err}`);
    });
};

exports.patchOneByPropertyQuery = async function (
  propertyQuery,
  update,
  isResEnd,
  res,
  funcCalledFrom,
  theCollectionModel
) {
  propertyQuery = fewRoutesControllers.adjustQueryConditions(propertyQuery);
  propertyQuery = fewRoutesControllers.adjustQueryIdsArrays(propertyQuery);

  //FIXME:
  console.log(`propertyQuery: ${propertyQuery} of ${collection} collection`);
  // Document creation
  document = theCollectionModel
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
    })
    .catch((err) => {
      console.log(
        `----> ERROR with updating a ${collection} document that feet the propertyQuery ${propertyQuery}. The function was called from the function - ${funcCalledFrom}: ${err}`
      );
      res.send(`${err}`);
    });
};

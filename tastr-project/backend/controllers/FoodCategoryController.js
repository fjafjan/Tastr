const { CreateCategory } = require("../DatabaseUtility")
const { FoodCategoryData } = require("../Models")

exports.addCategory = async(req, res) => {
  const { categoryId: categoryId, foodNames: foodNames } = req.body
  console.log("Creating new category with ", categoryId, foodNames)
  const result = await CreateCategory(categoryId, foodNames)
  if (result) {
    res.sendStatus(200) // Ok!
  } else {
    console.error("Failed to create new category ", categoryId, foodNames)
  }
}

exports.getAliases = async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting aliases for category ", categoryId)

  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
    if (entry) {
      const idToAliasDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.id] = item.alias
        return acc
      }, {});
      console.log("Returning", idToAliasDictionary)
      res.json(idToAliasDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to get foods for ${categoryId}`, error)
  }
}

exports.getNames = async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting food names for category ", categoryId)

  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
    if (entry) {
      const idToNamesDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.id] = item.name
        return acc
      }, {});
      console.log("Returning", idToNamesDictionary)
      res.json(idToNamesDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to get foods for ${categoryId}`, error)
  }
}

exports.getMmr = async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting MMR for category", categoryId)
  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
    if (entry) {
      const foodItemsDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.name] = item.MMR
        return acc;
      }, {});

      console.log("Returning", foodItemsDictionary)
      res.json(foodItemsDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to find MMR for ${categoryId}`, error)
  }
}
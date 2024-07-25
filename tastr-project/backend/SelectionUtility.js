

// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

function meanMapValues(map) {
  var total = 0
  var array = Object.values(map)
  for(var i = 0; i < array.length; i++) {
    total += array[i]
  }
  return total / array.length
}

function hasNotTasted(tastedMap, foodId) {
  if (!(foodId in tastedMap)) {
    return true
  }
  return tastedMap[foodId] <= meanMapValues(tastedMap);
}

function GenerateMatchups(foodIds, judges) {
  let keys = foodIds.slice() // Copy array
  let assignedJudges = judges.slice(); // Copy array
  let matchups = {}
  while (assignedJudges.length > 0) {
      keys = foodIds.slice();

      for (let i = 0; i < 10; i++) {
          shuffleArray(keys);
          for (let judge of assignedJudges) {
              if (keys.length >= 2) {
                  if (hasNotTasted(judge.tasted, keys[0]) && hasNotTasted(judge.tasted, keys[1])) {
                      console.log(`${keys[0]}-${keys[1]} Good matchup for ${judge.userId}, has tasted: ${Object.values(judge.tasted)}`);
                      matchups[judge.userId] = { itemA: keys[0], itemB: keys[1] };
                      keys.splice(keys.indexOf(keys[0]), 1);
                      keys.splice(keys.indexOf(keys[0]), 1); // Remove the next key
                      assignedJudges.splice(assignedJudges.indexOf(judge), 1);
                  }
              } else {
                // We have chosen most of the foods, so we need to return it to the pool.
                keys = foodIds.slice()
                console.log("Returning all foods to the pool")
              }
          }
      }

      for (let i = 0; i < 10; i++) {
          shuffleArray(keys);
          for (let judge of assignedJudges) {
              if (keys.length >= 2) {
                  if (hasNotTasted(judge.tasted, keys[0]) || hasNotTasted(judge.tasted, keys[1])) {
                      console.log(`${keys[0]}-${keys[1]} Decent matchup for ${judge.userId}, has tasted: ${Object.values(judge.tasted)}`);
                      matchups[judge.userId] = { itemA: keys[0], itemB: keys[1] };
                      keys.splice(keys.indexOf(keys[0]), 1);
                      keys.splice(keys.indexOf(keys[0]), 1); // Remove the next key
                      assignedJudges.splice(assignedJudges.indexOf(judge), 1);
                  }
              }
          }
      }

      // Assign any remaining pastries
      while (keys.length >= 2 && assignedJudges.length > 0) {
          shuffleArray(keys);
          for (let judge of assignedJudges) {
              if (keys.length >= 2) {
                  console.log(`${keys[0]}-${keys[1]} Bad matchup for ${judge.userId}, has tasted: ${Object.values(judge.tasted)}`);
                  matchups[judge.userId] = { itemA: keys[0], itemB: keys[1] };
                  keys.splice(keys.indexOf(keys[0]), 1);
                  keys.splice(keys.indexOf(keys[0]), 1); // Remove the next key
                  assignedJudges.splice(assignedJudges.indexOf(judge), 1);
              }
          }
      }
  }

  return matchups;
}

// Example usage
const pastries = ["Pastry1", "Pastry2", "Pastry3"]

const judges = [
  {userId: "Judge1", tasted: {"Pastry1" : 1, "Pastry2" : 1, "Pastry3": 1}},
  {userId: "Judge2", tasted: {"Pastry1" : 0, "Pastry2" : 1, "Pastry3": 1}},
  {userId: "Judge3", tasted: {"Pastry1" : 0, "Pastry2" : 1, "Pastry3": 1}},
  // Add more judges as needed
];



// console.log("Found matchups:", GenerateMatchups(pastries, judges));

// This is pretty wonky at the moment so we will need to do some refactoring.
module.exports = { GenerateMatchups }
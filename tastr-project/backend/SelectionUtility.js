

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

// Example classes for Judge and Pastry
class Judge {
  constructor(name, tastedMap) {
      this.name = name;
      this.tastedMap = tastedMap;
  }

  // Determines if the judge wants to taste this food.
  hasNotTasted(foodId) {
      if (!(foodId in this.tastedMap)) {
        return true
      }
      return this.tastedMap[foodId] <= meanMapValues(this.tastedMap);
  }
}

function GenerateMatchups(foodIds, judges) {
  let keys = foodIds.slice() // Copy array
  let assignedJudges = judges.slice(); // Copy array
  let matchups = "Matchups next round: \n";

  while (assignedJudges.length > 0) {
      keys = foodIds.slice();

      for (let i = 0; i < 10; i++) {
          shuffleArray(keys);
          for (let judge of assignedJudges) {
              if (keys.length >= 2) {
                  if (judge.hasNotTasted(keys[0]) && judge.hasNotTasted(keys[1])) {
                      console.log(`${keys[0]}-${keys[1]} Good matchup for ${judge.name}, has tasted: ${Object.values(judge.tastedMap)}`);
                      matchups += `${keys[0]}-${keys[1]} : ${judge.name}\n`;
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
                  if (judge.hasNotTasted(keys[0]) || judge.hasNotTasted(keys[1])) {
                      console.log(`${keys[0]}-${keys[1]} Decent matchup for ${judge.name}, has tasted: ${Object.values(judge.tastedMap)}`);
                      matchups += `${keys[0]}-${keys[1]} : ${judge.name}\n`;
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
                  console.log(`${keys[0]}-${keys[1]} Bad matchup for ${judge.name}, has tasted: ${Object.values(judge.tastedMap)}`);
                  matchups += `${keys[0]}-${keys[1]} : ${judge.name}\n`;
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
  new Judge("Judge1", {"Pastry1" : 1, "Pastry2" : 1, "Pastry3": 1}),
  new Judge("Judge2", {"Pastry1" : 0, "Pastry2" : 1, "Pastry3": 1}),
  new Judge("Judge3", {"Pastry1" : 0, "Pastry2" : 1, "Pastry3": 1}),
  // Add more judges as needed
];



console.log(GenerateMatchups(pastries, judges));

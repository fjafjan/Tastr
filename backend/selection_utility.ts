// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

// Type for the tasted map (foodId -> number of times tasted)
type TastedMap = Record<string, number>;

// Type for a judge's tasting history
export interface Judge {
  userId: string;
  tasted: TastedMap;
}

// Type for a matchup (two food items)
interface Matchup {
  itemA: string;
  itemB: string;
}

// Utility function to compute the mean of the map values
function meanMapValues(map: TastedMap): number {
  const values = Object.values(map);
  const total = values.reduce((sum, val) => sum + val, 0);
  return total / values.length;
}

// Checks if a food item has been tasted less or equal to the mean
function hasNotTasted(tastedMap: TastedMap, foodId: string): boolean {
  return (
    !(foodId in tastedMap) || tastedMap[foodId] <= meanMapValues(tastedMap)
  );
}

// Function to generate matchups based on food IDs and judges' history
function GenerateMatchups(
  foodIds: string[],
  judges: Judge[]
): Record<string, Matchup> {
  let keys = foodIds.slice(); // Copy array
  const assignedJudges = judges.slice(); // Copy array
  const matchups: Record<string, Matchup> = {}; // Map userId to their matchup

  while (assignedJudges.length > 0) {
    keys = foodIds.slice();

    for (let i = 0; i < 10; i++) {
      shuffleArray(keys);
      for (const judge of assignedJudges) {
        if (keys.length >= 2) {
          if (
            hasNotTasted(judge.tasted, keys[0]) &&
            hasNotTasted(judge.tasted, keys[1])
          ) {
            console.log(
              `${keys[0]}-${keys[1]} Good matchup for ${
                judge.userId
              }, has tasted: ${Object.values(judge.tasted)}`
            );
            matchups[judge.userId] = { itemA: keys[0], itemB: keys[1] };
            keys.splice(keys.indexOf(keys[0]), 1);
            keys.splice(keys.indexOf(keys[0]), 1); // Remove the next key
            assignedJudges.splice(assignedJudges.indexOf(judge), 1);
          }
        } else {
          // Return foods to the pool when there aren't enough remaining
          keys = foodIds.slice();
          console.log("Returning all foods to the pool");
        }
      }
    }

    for (let i = 0; i < 10; i++) {
      shuffleArray(keys);
      for (const judge of assignedJudges) {
        if (keys.length >= 2) {
          if (
            hasNotTasted(judge.tasted, keys[0]) ||
            hasNotTasted(judge.tasted, keys[1])
          ) {
            console.log(
              `${keys[0]}-${keys[1]} Decent matchup for ${
                judge.userId
              }, has tasted: ${Object.values(judge.tasted)}`
            );
            matchups[judge.userId] = { itemA: keys[0], itemB: keys[1] };
            keys.splice(keys.indexOf(keys[0]), 1);
            keys.splice(keys.indexOf(keys[0]), 1); // Remove the next key
            assignedJudges.splice(assignedJudges.indexOf(judge), 1);
          }
        }
      }
    }

    // Assign remaining pastries
    while (keys.length >= 2 && assignedJudges.length > 0) {
      shuffleArray(keys);
      for (const judge of assignedJudges) {
        if (keys.length >= 2) {
          console.log(
            `${keys[0]}-${keys[1]} Bad matchup for ${
              judge.userId
            }, has tasted: ${Object.values(judge.tasted)}`
          );
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

export { GenerateMatchups };


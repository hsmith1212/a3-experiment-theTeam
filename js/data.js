/**
 * Return two random integers 5 times strictly between 1 and 100 (i.e. 2..99) with different proportions
 * Each call returns an array [n1, n2]. Values are guaranteed to be different.
 *
 * Example: const [a,b] = generateTwoRandomNumbers();
 */

console.log(generateTrails(10)); // test generating 5 pairs of numbers


function generateTwoRandomNumbers() {
  const lower = 2;
  const upper = 99;

  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const n1 = randomNum(lower, upper);
  // ensure the second number is not equal to the first
  let n2 = randomNum(lower, upper);
  while (n2 === n1) {
    n2 = randomNum(lower, upper);
  }
  return [n1, n2];
}

//Generates a specified number of trails, each with a random length and random values that are not the same
function generateTrails(numTrails) {
    trailData = [];
    for (let i = 0; i < numTrails; i++) {
        const randNumTemp = generateTwoRandomNumbers();
        for (let j = 0; j < trailData.length; j++) {
            if (trailData[j][0] === randNumTemp[0] && trailData[j][1] === randNumTemp[1]) {
                // If the generated pair is the same as an existing pair, generate a new one
                randNumTemp = generateTwoRandomNumbers();
                j = -1; // Restart the loop to check the new pair against all existing pairs
            }
        }
        trailData.push(randNumTemp);
    }
    return trailData; 
}

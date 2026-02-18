/**
 * Exposes window.DataGen.generateTrialData(n)
 * Return two random integers 5 times strictly between 1 and 100 (i.e. 2..99) with different proportions
 * Each call returns an array of 5 random values. Values are guaranteed to be different.
 * The second and third values in the array will always be the ones marked
 */

console.log(generateTrials(10)[0]); // test generating 10 trials, and checking first trial's numbers

function generateFiveRandomNumbers() {
  const lower = 2;
  const upper = 99;

  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // generate 5 unique numbers
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(randomNum(lower, upper));
  }

  // convert to array
  const arr = Array.from(nums);

  // ensure second and third values are different by at least 5
  while (Math.abs(arr[1] - arr[2]) < 5) {
    arr[2] = randomNum(lower, upper);
  }

  return arr;
}

//Generates a specified number of trails, each with a length of 5 and random values that are not the same
function generateTrials(numTrials) {
  trialData = [];
  for (let i = 0; i < numTrials; i++) {
    const randNumTemp = generateFiveRandomNumbers();
    for (let j = 0; j < trialData.length; j++) {
      if (trialData[j][0] === randNumTemp[0] && trialData[j][1] === randNumTemp[1]) {
        // If the generated trial is the same as an existing trial, generate a new one
        randNumTemp = generateFiveRandomNumbers();
        j = -1; // Restart the loop to check the new trial against existing trials
      }
    }
    trialData.push(randNumTemp);
  }
  return trialData;
}

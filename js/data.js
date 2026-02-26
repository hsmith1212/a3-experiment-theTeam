/**
 * Exposes window.DataGen.generateTrialData(n)
 * Return two random integers 5 times strictly between 1 and 100 (i.e. 2..99) with different proportions
 * Each call returns an array of 5 random values. Values are guaranteed to be different.
 * The second and third values in the array will always be the ones marked
 */


function generateFiveRandomNumbers() {
  const lower = 2;
  const upper = 99;

  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const nums = new Set();
  while (nums.size < 5) {
    nums.add(randomNum(lower, upper));
  }
  return Array.from(nums);
}

window.DataGen = {
  /**
   * generates specified number of trials, each with length of 5 and random values that are not the same
   * 
   */
  generateTrialData:function(n) {
    const values = generateFiveRandomNumbers();
    const marked = [1,2];

    const valueA = values[marked[0]];
    const valueB = values[marked[1]];
    const smaller = Math.min(valueA, valueB);
    const larger = Math.max(valueA, valueB);
    const truePercentage = Math.round((smaller/larger) * 100);

    return{
      values: values,
      marked: marked,
      truePercentage : truePercentage
    };
  }  
};

console.log('data.js Test trial:', window.DataGen.generateTrialData(5));

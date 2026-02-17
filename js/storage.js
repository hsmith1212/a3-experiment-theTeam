let results = JSON.parse(localStorage.getItem("experimentResults")) || [];

function storeTrialResult(participantID, trial, actual, reported, error) {
  const trialResult = {
    participantID: participantID,
    colorType: trial.colorType,
    actualPercent: actual,
    reportedPercent: reported,
    error: error,
    timestamp: new Date().toISOString()
  };

  results.push(trialResult);

  localStorage.setItem("experimentResults", JSON.stringify(results));
}

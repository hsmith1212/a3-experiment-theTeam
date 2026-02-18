// This file will calculate the grade for each experiment (the "cm-error") which is only the abs(reportedPercent - True percent)

function calculateGrade(reportedPercent, truePercent) {
    const cmError = Math.log2(Math.abs(reportedPercent - truePercent) + 1/8);
    return cmError;
} 

window.Grader = {
    score: function(trialData, response) {
        const truePercent = trialData.truePercentage;
        const reportedPercent = response;

        const rawError = Math.abs(reportedPercent - truePercent);
        
        let log2Error = calculateGrade(reportedPercent, truePercent);

        if (rawError === 0) {
            log2Error = 0;
        }

        return {
            rawError: rawError,
            log2Error: log2Error
        };
        

    }
};

if (typeof console!== 'undefined') {
    console.log('[grading.js] loaded successfully')
}


// This file will calculate the grade for each experiment (the "cm-error") which is only the abs(reportedPercent - True percent)

function calculateGrade(reportedPercent, truePercent) {
    const cmError = Math.log2(Math.abs(reportedPercent - truePercent) + 1/8);
    return cmError
} 


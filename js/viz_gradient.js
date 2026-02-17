// numbers is an array with five values, one for each of the five bars.
// the second and third values in the array will always be the ones marked
// aka the ones the participant is asked to compare
function graphGradient(numbers){
    const colorScale = d3.scaleLinear()
        .domain([0, 100])
        .range(["yellow", "green"]);

    graph(numbers, {fill: d => colorScale(d), stroke: "none"}, colorScale);
};


//here for testing=
// graphGradient(generateTrials(1)[0]);
// numbers is an array with five values, one for each of the five bars.
// the second and third values in the array will always be the ones marked
// aka the ones the participant is asked to compare
function graphGradient(numbers, container){
    const colorScale = d3.scaleLinear()
        .domain([0, 100])
        .range(["yellow", "green"]);

    graph(numbers, {fill: d => colorScale(d), stroke: "none"}, colorScale, container);
};

//here for testing=
// graphGradient(generateTrials(1)[0]);

window.VizGradient = {
    render: function(container, trialData) {
        this.clear(container);

        const values = trialData.values;

        graphGradient(values, container);
    },

    clear: function(container) {
        container.innerHTML = '';
    }
};

if (typeof console !== 'undefined') {
    console.log('[viz_graident.js] loaded successfully');
}
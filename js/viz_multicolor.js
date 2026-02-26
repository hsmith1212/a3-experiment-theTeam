// numbers is an array with five values, one for each of the five bars.
// the second and third values in the array will always be the ones marked
// aka the ones the participant is asked to compare

function graphMultiColor(numbers, container){
    // picking five colors so all five bars will be different
    // reference for color names: https://www.w3schools.com/colors/colors_names.asp 
    const fiveColors = ["red", "peru", "purple", "lightgreen", "blue"];
    // randomize the order of the colors each time so we are comparing colors generally changing,
    // not the specific colors
    // learned how to randomize order here: https://coureywong.medium.com/how-to-shuffle-an-array-of-items-in-javascript-39b9efe4b567 
    fiveColors.sort(() => Math.random() - 0.5);
    graph(numbers, {fill: (value, i) => fiveColors[i]}, null, container)
}

//graphMultiColor([34, 17, 68, 90, 41]);

window.VizMulticolor = {
    render: function(container, trialData) {
        this.clear(container);
        const values = trialData.values;
        graphMultiColor(values, container);
    },

    clear: function(container) {
        container.innerHTML = '';
    }
};

if (typeof console != 'undefined') {
    console.log('[viz_multiclor.js loaded successfully');
}

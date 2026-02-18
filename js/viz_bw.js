// numbers is an array with five values, one for each of the five bars.
// the second and third values in the array will always be the ones marked
// aka the ones the participant is asked to compare
function graphBW(numbers, container){
    graph(numbers,{fill: "white", stroke: "black"}, null, container);
};

//here for testing for now
// graphBW([45, 13, 98, 72, 34]);

window.VizBW = {
    render: function(container, trialData) {
        this.clear(container);
        const values = trialData.values;
        graphBW(values, container);
    },

    clear: function(container){
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
};

if (typeof console !== 'undefined'){
    console.log('[viz_bw.js] Loaded sucessfully');
}
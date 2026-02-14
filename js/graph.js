// numbers is an array with five values, one for each of the five bars.
// bar style determines the fill and stroke of the bars
// color scale is an optional argument that will be used for the gradient graphs
//      in order to include a legend
function graph(numbers, barStyle, colorScale = null){
    const height = 300;
    const width = 300;
    const margin = 40;
    const barWidth = 30;

    //the height scale. numbers will be values between 0 and 100
    const yScale = d3.scaleLinear()
        .domain([0,100])
        .range([height - margin, margin]);

    //might have to edit if changes
    const svg = d3.select("#container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    //adding left axis
    svg.append("g")
        .attr("transform", `translate(${margin},0)`)
        .call(d3.axisLeft(yScale).tickValues([0, 100]));
    
    //adding bottom line
    svg.append("line")
        .attr("x1", margin)
        .attr("x2", width)
        .attr("y1", height - margin)
        .attr("y2", height - margin)
        .attr("stroke", "black")
        .attr("stroke-width", "1");
    
    //adding a bar for each value in number
    numbers.forEach((value, i) => {
        svg.append("rect")
            .attr("x", (margin * 2) + (i * barWidth))
            .attr("y", yScale(value))
            .attr("width", barWidth)
            .attr("height", (height - margin) - yScale(value))
            .attr("fill", typeof barStyle.fill === "function" ? barStyle.fill(value, i) : barStyle.fill)
            .attr("stroke", barStyle.stroke || "none");
    });

    //marking the second and third bars
    [1, 2].forEach(i => {
        svg.append("circle")
            .attr("cx", (margin * 2) + (i * barWidth) + (barWidth / 2))
            .attr("cy", height - margin / 2)
            .attr("r", margin / 6)
            .attr("fill", "black");
    });

    // add color legend for gradient
    // referenced https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient/ 
    if (colorScale){
        const legendX = width - margin;
        const legendY = margin;
        const legendHeight = 100;
        const legendWidth = 12;

        //Append a defs (for definition) element to your SVG
        var defs = svg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        var linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        //Set the color for the start (0%)
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(100)); 

        //Set the color for the end (100%)
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(0)); 

        svg.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("x", legendX)
            .attr("y", legendY)
            .style("fill", "url(#linear-gradient)");

        //adding an axis from 0 to 100 to go along with the legend
        const legendScale = d3.scaleLinear()
            .domain([0,100])
            .range([legendHeight,0]);

        svg.append("g")
            .attr("transform", `translate(${legendX + legendWidth}, ${legendY})`)
            .call(d3.axisRight(legendScale).tickValues([0, 100]));
    }
};
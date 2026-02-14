// numbers is an array with five values, one for each of the five bars.
// the second and third values in the array will always be the ones marked
// aka the ones the participant is asked to compare
function graphBW(numbers){
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
            .attr("fill", "white")
            .attr("stroke", "black");
    });

    //marking the second and third bars
    //second bar
    svg.append("circle")
        .attr("cx", (margin * 2) + (1 * barWidth) + (barWidth/2))
        .attr("cy", height - margin/2)
        .attr("r", margin/6) //will leave some space
        .attr("fill", "black");

    //third bar
    svg.append("circle")
        .attr("cx", (margin * 2) + (2 * barWidth) + (barWidth/2))
        .attr("cy", height - margin/2)
        .attr("r", margin/6) //will leave some space
        .attr("fill", "black");
};

//here for testing for now
graphBW([45, 13, 98, 72, 34]);
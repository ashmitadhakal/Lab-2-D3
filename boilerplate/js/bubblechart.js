// Javascript file by Ashmita, 2024

var dataArray = [10, 20, 30, 40, 50];
//create format generator
var format = d3.format(",");

var cityPop = [
    { 
        city: 'Madison',
        population: 233209
    },
    {
        city: 'Milwaukee',
        population: 594833
    },
    {
        city: 'Green Bay',
        population: 104057
    },
    {
        city: 'Superior',
        population: 27244
    }
];
//execute script when the window is loaded
window.onload = function(){
    var container = d3.select("body") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body
        .attr("width", 950) //assign the width
        .attr("height", 500) //assign the height
        .attr("class", "container") //always assign a class (as the block name) for styling and future selection
        .style("background-color","rgba(0,0,0,0.2");

    var innerRect = container.append("rect")        //put the rectangle in svg
        .datum(430)                 //a single value is datum
        .attr("width",function(d){
            return d*2; //width is 400*2
            })         
        .attr("height",function(d){
            return d;   //height is 400
            })   
        .attr("class","innerRect")      //class name
        .attr("x",50)                   //position from left on the x (horizontal) axis
        .attr("y",50)                   //position from top on the y (vertical) axis
        .style("fill","#FFFFFF");        //fill color     
    var minPop = d3.min(cityPop,function(d){        //get minimum value
        return d.population;
        });

    var maxPop = d3.max(cityPop, function(d){       //get maximum population value
        return d.population;
        });

    var y = d3.scaleLinear()
        .range([450, 50])
        .domain([
            0,
            700000
        ]);

    var x = d3.scaleLinear() //create the scale
        .range([90, 810]) //output min and max
        .domain([0, 3]); //input min and max
    console.log(x);

    //color generator
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop, 
            maxPop
        ]);
   
    var circles = container.selectAll(".circles") //create an empty selection
        .data(cityPop) //feed in an array
        .enter() //one of the great mysteries of the universe :D
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply a class name to all circles
        .attr("id",function(d){
            return d.city;
        })
        .attr("r", function(d){ //circle radius
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
            
        })
        .attr("cx", function(d, i){
            //use the scale generator with the index to place each circle horizontally
            return x(i);
        })
        .attr("cy", function(d){
            //subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
            return y(d.population);
        })
        .style("fill", function(d,i){       //add fill color as per the generated colors
            return color(d.population);
        })
        .style("stroke","#000");              // stroke color is black
    
    var yAxis = d3.axisLeft(y);             //y-axis generator

     //create axis g element and add axis
     var axis = container.append("g")
     .attr("class", "axis")
     .attr("transform", "translate(50, 0)")
     .call(yAxis);

     var title = container.append("text")       //adding title to the chart
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations of Wisconsin");

    var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            //vertical position centered on each circle
            return y(d.population) + 5;
        });

    //first line of the labels
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x",function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city
        });
    //second line of label
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .attr("dy","20")        //vertical offset
        .text(function(d){
            return "Pop. " + format(d.population); //format generator to format numbers
        });
}
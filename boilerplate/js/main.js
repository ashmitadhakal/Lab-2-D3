// Javascript file by Ashmita, 2024

(function () {
  //pseudo-global variable
  var attrArray = [
    "Grade1",
    "Grade2",
    "Grade3",
    "Grade4",
    "Grade5",
    "Grade6",
    "Grade7",
    "Grade8",
    "Grade9",
    "Grade10",
    "Grade11",
    "Grade12",
  ];
  var expressed = attrArray[11]; //initial attribute
  
  //chart frame dimensions
  var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 40,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  //create a scale to size bars proportionally to frame and for axis
  var yScale = d3.scaleLinear()
    .range([463, 0]).domain([0, 6000]);

  //begin script when window loads
  window.onload = setMap();

  //set uo chloropleth map
  function setMap() {
    //map frame dimensions
    var width = window.innerWidth * 0.45,
      height = 473;

    //create new svg container for map
    var map = d3
      .select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    //create Albers equal area conic projection centered on Nepal
    var projection = d3
      .geoAlbers()
      .center([1.1, 27.8])
      .rotate([-84.2, -0.4, 0])
      .parallels([26.8, 29.88])
      .scale(7000)
      .translate([width / 2.1, height / 2]);
    var path = d3.geoPath().projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [
      d3.csv("data/enrollment.csv"),
      d3.json("data/Districts.topojson"),
      d3.json("data/province.topojson"),
    ];
    Promise.all(promises).then(callback);

    function callback(data) {
      //variable holding data from promises
       globalThis.csvData = data[0];

      //place graticule in map
      setGraticule(map, path);

      var nepalDistricts = data[1],
        basemap = data[2];

      //translate TOPOJSON to JSON
      var nepalDistricts = topojson.feature(
          nepalDistricts,
          nepalDistricts.objects.Districts
        ).features,
        basemap = topojson.feature(basemap, basemap.objects.province);

      //add basemap to map
      var nepalProvince = map
        .append("path")
        .datum(basemap)
        .attr("class", "countries")
        .attr("d", path);

      //join csv data to GeoJson enumeration units
      nepalDistricts = joinData(nepalDistricts, csvData);

      //create the color scale
      var colorScale = makeColorScale(csvData);
        
      //add enumeration units to the map
      setEnumerationUnits(nepalDistricts, map, path, colorScale);
      setChart(csvData, colorScale);
      createDropdown(csvData);
      var mapTitle = map
      .append("text")
      .attr("x", 160)
      .attr("y", 60)
      .attr("class", "mapTitle")
      .text(
        "Number of Students Enrollments in " +
          attrArray[11] +
          " in Central Region of Nepal"
      );
    }
  }

  function setGraticule(map, path) {
    var graticule = d3.geoGraticule().step([3, 3]);

    //create graticule background
    var gratBackground = map
      .append("path")
      .datum(graticule.outline())
      .attr("class", "gratBackground")
      .attr("d", path);

    var gratLines = map
      .selectAll(".gratLines")
      .data(graticule.lines())
      .enter()
      .append("path")
      .attr("class", "gratLines")
      .attr("d", path);
  }

  function joinData(nepalDistricts, csvData) {
    //loop through CSV to assign each set of the scv attribute values to geojson region
    for (var i = 0; i < csvData.length; i++) {
      var csvRegion = csvData[i]; //the current region
      var csvKey = csvRegion.DISTRICT; //the csv primary key

      //loop through geojson region to find the correct region
      for (var j = 0; j < nepalDistricts.length; j++) {
        var geojsonProps = nepalDistricts[j].properties; //the current region geojson properties
        var geojsonKey = geojsonProps.DISTRICT; //the gepjson properties primary key

        //where primary keys match. transfer csv data to gepjson properties object
        if (geojsonKey == csvKey) {
          //assign all attributes and values
          attrArray.forEach(function (attr) {
            var val = csvRegion[attr]; //get csv attribute value
            geojsonProps[attr] = val; //assign attribute and value to geojson properties
          });
        }
      }
    }
    return nepalDistricts;
    }
    function setEnumerationUnits(nepalDistricts, map, path, colorScale) {
      //draw front layer
      var regions = map
        .selectAll(".regions")
        .data(nepalDistricts)
        .enter()
        .append("path")
        .attr("class", function (d) {
          return "regions " + d.properties.DISTRICT;
          })
        .attr("d", path)
        .style("fill", function (d) {
          var value = d.properties[expressed];
          if (value) {
            return colorScale(d.properties[expressed]);
          } else {
            return "#ccc";
          }
        })
        .on("mouseover", function (event, d) {
          highlight(d.properties);
        })
        .on("mouseout", function (event, d) {
          dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
      
      //add style descriptor to each path
      var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    }
    //function to create color scale generator
    function makeColorScale(data) {
      var colorClasses = [
        "#feedde",
        "#fdd0a2",
        "#fdae6b",
        "#fd8d3c",
        "#f16913",
        "#d94801",
        "#8c2d04",
      ];

      //create color scale generator (natural breaks)
      var colorScale = d3.scaleThreshold().range(colorClasses);

      //build array of all values of the expressed attribute
      var domainArray = [];
      for (var i = 0; i < data.length; i++) {
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
      }

      //cluster data using ckmeans clustering algorithm to create natural breaks
      var clusters = ss.ckmeans(domainArray, 5);

      //reset domain array to cluster minimums
      domainArray = clusters.map(function (d) {
        return d3.min(d);
      });

      //remove first value from domain array to create class breakpoints
      domainArray.shift();

      //assign array of last 4 cluster minimums as domain
      colorScale.domain(domainArray);

      return colorScale;
    }

    //function to create a coordinated bar chart
    function setChart(csvData, colorScale) {
      //create a second svg element to hold the bar chart
      var chart = d3
        .select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

      //create a rectangle for chart background fill
      var chartBackground = chart
        .append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

      //set bars for each district
      var bars = chart
        .selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function (a, b) {
          return b[expressed] - a[expressed];
        })
        .attr("class", function (d) {
          return "bar " + d.DISTRICT;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", function(event, d){
          highlight(d);
        })
        .on("mouseout", function(event, d){
          dehighlight(d);
        })
        .on("mousemove", moveLabel);;

        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

      //create a text element for the chart title
      var chartTitle = chart
        .append("text")
        .attr("x", 110)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text(
          "Number of enrollments in " +
            attrArray[3] +
            " in central region of Nepal"
        );
      //create vertical axis generator
      var yAxis = d3.axisLeft().scale(yScale).ticks(10);

      //place axis
      var axis = chart
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

      //create frame for chart border
      var chartFrame = chart
        .append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

        updateChart(bars,csvData.length, colorScale);
      //add style descriptor to each rect
      var desc = bars.append("desc")
                      .text('{"stroke": "none", "stroke-width": "0px"}');

    }
    //function to create a dropdown menu for attribute selection
    function createDropdown(csvData) {
      //add select element
      var dropdown = d3
        .select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function () {
          changeAttribute(this.value, csvData);
        });

      //add initial option
      var titleOption = dropdown
        .append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

      //add attribute name options
      var attrOptions = dropdown
        .selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function (d) {
          return d;
        })
        .text(function (d) {
          return d;
        });
    }

    //dropdown change event handler
    function changeAttribute(attribute, csvData) {

      // Update the expressed attribute
      expressed = attribute;

      // Recreate the color scale
      var colorScale = makeColorScale(csvData);
      //initialize mix and max value of expressed attribute
      var maxValue = -9999
		  var minValue = 9999

      //recolor enumeration units
      var regions = d3.
        selectAll(".regions").
        transition().duration(1000).
        style("fill", function (d) {
          var value = parseFloat(d.properties[expressed]);
          if (!isNaN(value)) {
            if (value > maxValue)
              maxValue = value;
            if (value < minValue)
              minValue = value
            if (value) {
              return colorScale(value);
            } else {
              return "#ccc";
            }
          }
      });
      //adjust the yScale, based on min and max value
      yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, maxValue * 1.1]);

      //apply update yScale to y axis
      var yAxis = d3.axisLeft()
        .scale(yScale);
      //update the y axis 
      var axis = d3.select(".axis")
        .transition()
        .duration(1000)
        .call(yAxis);

      //Sort, resize, and recolor bars
      //set bars for each district
      var bars = d3.selectAll(".bar")
        .sort(function (a, b) {
          return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d,i){
          return i*20
        })
        updateChart(bars, csvData.length, colorScale);
        updateLegend(colorScale)
    };
    function updateChart(bars, n, colorScale){
      bars.attr("x", function (d, i) {
        return i * (chartInnerWidth / n) + leftPadding;
      })
        //size/resize bars
        .attr("height", function (d, i) {
          return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function (d, i) {
          return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function (d) {
          var value = d[expressed];
          if (value) {
            return colorScale(value);
          } else {
            return "#ccc";
          }
        });
      var chartTitle = d3.select(".chartTitle")
        .text("Number of enrollment of students in " + expressed + " in each districts");
    }

    //function to highlight enumeration units and bars
    function highlight(props){
      //change stroke
      var selected = d3.selectAll("."+ props.DISTRICT)
          .style("stroke", "blue")
          .style("stroke-width", "2");
      
      setLabel(props);
    };
    //function to reset the element style on mouseout
    function dehighlight(props){
      var selected = d3.selectAll("." + props.DISTRICT)
          .style("stroke", function(){
              return getStyle(this, "stroke")
          })
          .style("stroke-width", function(){
              return getStyle(this, "stroke-width")
          });

      function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
      };
      d3.select(".infolabel")
        .remove();
    };
    function setLabel(props){
      //label content
      var labelAttribute = "<h1>" + props[expressed] +
          "</h1><b>" + expressed + "</b>";

      //create info label div
      var infolabel = d3.select("body")
          .append("div")
          .attr("class", "infolabel")
          .attr("id", props.DISTRICT + "_label")
          .html(labelAttribute); 

      var regionName = infolabel.append("div")
          .attr("class", "labelname")
          .html(props.DISTRICT + " District");
    };
      //function to move info label with mouse
    function moveLabel(){
      //get width of label
      var labelWidth = d3.select(".infolabel")
                          .node()
                          .getBoundingClientRect()
                          .width;

      //use coordinates of mousemove event to set label coordinates
      var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

      //horizontal label coordinate, testing for overflow
      var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
      //vertical label coordinate, testing for overflow
      var y = event.clientY < 75 ? y2 : y1; 

      d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
      };
  
})();

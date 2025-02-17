//#############################################################################
//#             				 		                                      #
//#             		   			GLOBAL CODE 	                          #
//#             				       			                              #
//#############################################################################

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$ OBJECT DEFINITIONS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//$$$$$$$$$$$$$$$$$$$$$$$$$$ BETTER LATE THAN NOTHING $$$$$$$$$$$$$$$$$$$$$$$$$

//Constructor for course object
function Course(universityName, collegeName, courseName, courseAreaCode) {
	this.universityName = universityName;
	this.courseName = courseName;
	this.courseAreaCode = courseAreaCode;
	if (collegeName == null) {
		this.collegeName = universityName
	} else {
		this.collegeName = collegeName;
	}
	//Equals function to compare Courses
	this.equals = function(object) {
			var equalUniversity = this.universityName === object.universityName;
			var equalCollege = this.collegeName === object.collegeName;
			var equalCourseName = this.courseName == object.courseName;
			return equalUniversity && equalCollege && equalCourseName;
		}
		//Get an unique id for the course
	this.getId = function() {
		return this.universityName.hashCode() + this.collegeName.hashCode() + this.courseName.hashCode();
	}
}

//Constructor for area object
function CourseArea(areaName, areaCode, areaColor) {
	this.code = areaCode;
	this.name = areaName;
	this.color = areaColor;
}

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$ GLOBAL VARIABLES $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//YEA WE KNOW IT SUCKS GLOBAL VARIABLES GIVE A BREAK...

/* Register events to use in inter-view communication:
	selectCourse event - Select a specific course
	selectUniversity event - Select an university/college
	selectUniversityScatter event - Select an university/college in the scatter
	selectArea event - Select an area
*/
var dispatch = d3.dispatch("selectCourse", "selectCourseScatter", "selectUniversity",
	"selectArea", "selectUniversityScatter", "mouseOverCourse", "clearMatrix");

//Global Colors to the data representation
var colors = d3.schemeCategory10;
var rootDataColor = d3.rgb(colors[0]).brighter(0.3);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$ GLOBAL FUNCTIONS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$	

var breadcrumbDim = {
	w: 195,
	h: 30,
	s: 3,
	t: 10
};

/*Simple function to hash a string into a integer
  Used to create simple ids */
String.prototype.hashCode = function() {
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

//Return the abreviation of string to use in the breadcrumb
function getBreadcrumbString(string) {
	var res = "";
	var tokens = string.split(" ");
	var cleanTokens = [];
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i][0] != null && tokens[i][0].match(/[A-Z]|É|-/)) {
			cleanTokens.push(tokens[i]);
		}
	}

	for (var i = 0; i < cleanTokens.length; i++) {
		if (cleanTokens[i].length > 12) {
			cleanTokens[i] = cleanTokens[i].substring(0, 11) + ".";
		}

		if (cleanTokens.length <= 2) {
			res += cleanTokens[i] + " ";
		} else if (cleanTokens.length == 3) {
			res += cleanTokens[i].substring(0, 6) + ". ";
		} else if (cleanTokens.length == 4) {
			res += cleanTokens[i].substring(0, 4) + ". ";
		} else {
			res += cleanTokens[i].substring(0, 4) + ". ";
			if (i == 3) {
				break;
			}
		}
	}
	return res;
}

//Draw/update breadcrumbs
function drawBreadcrumbs(svg, nodeArray, dataKey, colorObject, onBreadcrumbClick, breadcrumbDimensions) {
	//Dimensions of breadcrumb
	var breadcrumbDim = breadcrumbDimensions;

	//Return a string with all the points of a breadcrumb item. 
	function breadcrumbPoints(datum, index) {
		var points = [];
		points.push("0,0");
		points.push(breadcrumbDim.w + ",0");
		points.push(breadcrumbDim.w + breadcrumbDim.t + "," + (breadcrumbDim.h / 2));
		points.push(breadcrumbDim.w + "," + breadcrumbDim.h);
		points.push("0," + breadcrumbDim.h);
		if (index > 0) {
			points.push(breadcrumbDim.t + "," + (breadcrumbDim.h / 2));
		}
		return points.join(" ");
	}

	var g = svg.selectAll("g")
		.data(nodeArray, function(d) {
			return d[dataKey];
		});

	var entering = g.enter()
		.append("g")
		.attr("transform", function(d, i) {
			return "translate(" + i * (breadcrumbDim.w + breadcrumbDim.s) + ", 0)";
		});

	entering.append("title")
		.text(function(d) {
			return d[dataKey];
		});

	entering.append("polygon")
		.on("click", onBreadcrumbClick)
		.transition().duration(750)
		.attr("points", breadcrumbPoints)
		.attr("class", "breadcrumbItem")
		.style("fill", function(d) {
			return colorObject.getColor(d[dataKey]);
		});

	entering.append("text")
		.on("click", onBreadcrumbClick)
		.attr("x", (breadcrumbDim.w + breadcrumbDim.t) / 2 + 3)
		.attr("y", breadcrumbDim.h / 2)
		.attr("dy", "0.35em")
		.attr("text-anchor", "middle")
		.attr("class", "breadcrumbItem")
		.text(function(d) {
			return getBreadcrumbString(d[dataKey]);
		});

	g.exit().transition().duration(750).remove()
}

//Draw a context menu according with the parameters
function drawContextMenu(svg, x, y, containerWidth, containerHeight, menuItems, clickCallback) {
	var menuItemHeight = 25;
	var menuItemWidth = 210;
	//Remove the current menu if we open it in other place	
	d3.select('.context-menu').remove();
	// Draw the menu
	svg.append('g').attr('class', 'context-menu')
		.selectAll('tmp')
		.data(menuItems).enter()
		.append('g')
		.attr('class', 'menu-entry')
		.on("click", clickCallback);

	//See if the menu isn't cropped in the container
	if (x + menuItemWidth > containerWidth) {
		x = x - menuItemWidth;
	}
	if (y + (menuItems.length * menuItemHeight) > containerHeight) {
		y = y - (menuItems.length * menuItemHeight);
	}

	//Draw the context menu
	d3.selectAll('.menu-entry')
		.append('rect')
		.attr('x', x)
		.attr('y', function(d, i) {
			return y + (i * menuItemHeight);
		})
		.attr('width', menuItemWidth)
		.attr('height', menuItemHeight);

	d3.selectAll(".menu-entry")
		.append("text")
		.text(function(d) {
			return d;
		})
		.attr("class", "menu-entry text")
		.attr("x", x)
		.attr("y", function(d, i) {
			return y + (i * menuItemHeight);
		})
		.attr("dy", menuItemHeight - 5 / 2)
		.attr("dx", 5);

	// Other interactions remove the menu ex:Clicking elsewhere!!
	d3.select("body")
		.on("click", function() {
			d3.select(".context-menu").remove();
		});
}

//#############################################################################
//#             				 		                                      #
//#             		   UNIVERSITY AND COURSES VIEW                        #
//#             				       			                              #
//#############################################################################

//######################## Auxiliary functions ################################

// Get the string to the course degree from the acronym
function getCourseDegreeStringDescription(degreeAcronym) {
	switch (degreeAcronym) {
		case "L1":
			return "Graduation";
		case "L":
			return "Graduation";
		case "B":
			return "Bachelor's";
		case "M":
			return "Master's";
		case "D":
			return "PhD";
	}
	return "Not Listed";
}

//Get a short string from university/college/course to use in matrix
function getShotStringUniCollCourse(string) {
	var res = "";
	var tokens = string.split(" ");
	var cleanTokens = [];
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i][0] != null && tokens[i][0].match(/[A-Z]|É|-/)) {
			cleanTokens.push(tokens[i]);
		}
	}
	for (var i = 0; i < cleanTokens.length; i++) {
		if (cleanTokens[i].length > 12) {
			cleanTokens[i] = cleanTokens[i].substring(0, 8) + ".";
		}

		if (cleanTokens.length <= 2) {
			res += cleanTokens[i] + " ";
		} else if (cleanTokens.length == 3) {
			res += cleanTokens[i] + " ";
		} else if (cleanTokens.length == 4) {
			res += cleanTokens[i].substring(0, 5) + ". ";
		} else if (cleanTokens.length == 5) {
			res += cleanTokens[i].substring(0, 4) + ". ";
		} else {
			if (i == 5) {
				break;
			}
			res += cleanTokens[i].substring(0, 3) + ". ";
		}
	}
	return res;
}

// Get the string to use in the tooltip of the circle
function getBertinMatrixCircleTooltip(datum, course) {
	var res = "";
	if (course) {
		res += "Degree Level: " + getCourseDegreeStringDescription(datum.Grau) + "\n";
	}
	res += "Unemployment %: " + datum.PercentagemDesemprego.toFixed(2) + "%";
	res += "\nTotal Unemployeds: " + datum.TotalDesempregados;
	res += "\nTotal Graduates: " + datum.TotalDiplomados;
	return res;
}

//######################## Visualization Functions #########################

var fullPublicCourseDataset; //All the public courses dataset
var fullPrivateCourseDataset; //All the private courses dataset

var universityVisObj = new Object();

var breadCrumbColorObject = new Object();
breadCrumbColorObject.getColor = function(dataKey) {
	return rootDataColor;
};

// Load all the course data!
d3.json("CoursesPublic.json", function(publicCoursesData) {
	d3.json("CoursesPrivate.json", function(privateCoursesData) {
		fullPrivateCourseDataset = {
			"key": "Ensino Privado",
			"values": privateCoursesData
		};
	});
	fullPublicCourseDataset = {
		"key": "Public Courses",
		"values": publicCoursesData
	};
	generateUniversityVis(); //Generate the matrix Visualisation
});

//Receive event when a course is mouseover in other view
dispatch.on("mouseOverCourse.matrix", function mouseOverCourseMatrixCallback(overCourse, dummy) {
	if (overCourse != null) {
		if (universityVisObj.currentCollIndex == 0) {
			d3.selectAll("[id='" + overCourse.universityName + "']").classed("matrixLine", false).classed("matrixLine-hover", true);
		} else if (universityVisObj.currentCollIndex == 1) {
			d3.selectAll("[id='" + overCourse.collegeName + "']").classed("matrixLine", false).classed("matrixLine-hover", true);
		} else if (universityVisObj.currentCollIndex == 2) {
			d3.selectAll("[id='" + overCourse.courseName + "']").classed("matrixLine", false).classed("matrixLine-hover", true);
		}
	} else {
		d3.selectAll(".matrixLine-hover").classed("matrixLine-hover", false).classed("matrixLine", true);
	}
});

//Receive event to clear the matrix
dispatch.on("clearMatrix", function() {
	universityVisObj.previousCollections = [universityVisObj.previousCollections[0]];
	universityVisObj.currentCollIndex = 0;
	updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
});

//Receive event from a course selected in scatter plot
dispatch.on("selectCourseScatter", function(course, dummy) {
	var publicCourseDataset = fullPublicCourseDataset.values;
	for (var u = 0; u < publicCourseDataset.length; u++) {
		if (publicCourseDataset[u].key === course.universityName) {
			for (var c = 0; c < publicCourseDataset[u].values.length; c++) {
				if (publicCourseDataset[u].values[c].key === course.collegeName) {
					for (var co = 0; co < publicCourseDataset[u].values[c].values.length; co++) {
						if (publicCourseDataset[u].values[c].values[co].key === course.courseName) {
							course.data = publicCourseDataset[u].values[c].values[co].data;
							dispatch.call("selectCourse", course, course);
							return;
						}
					}
				}
			}
		}
	}
});

//Receive event a university/college was selected in other view
dispatch.on("selectUniversityScatter", function(selected, dummy) {
	//Reset the university/college current selecttion
	universityVisObj.previousCollections = [fullPublicCourseDataset];
	universityVisObj.currentCollIndex = 0;
	for (var i = 0; i < universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.length; i++) {
		if (universityVisObj.previousCollections[universityVisObj.currentCollIndex].values[i].key === selected[0]) {
			var universitySelectedCollection = new Object();
			universitySelectedCollection.key = selected[0];
			universitySelectedCollection.values = universityVisObj.previousCollections[universityVisObj.currentCollIndex].values[i].values;
			universityVisObj.previousCollections.push(universitySelectedCollection);
			universityVisObj.currentCollIndex++;
			for (var k = 0; k < universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.length; k++) {
				if (universityVisObj.previousCollections[universityVisObj.currentCollIndex].values[k].key === selected[1]) {
					var collegeSelectedCollection = new Object();
					collegeSelectedCollection.key = selected[1];
					collegeSelectedCollection.values = universityVisObj.previousCollections[universityVisObj.currentCollIndex].values[k].values;
					universityVisObj.previousCollections.push(collegeSelectedCollection);
					universityVisObj.currentCollIndex++;
					updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
					return;
				}
			}
		}
	}
});

/*######################## Breadcrumb Functions ##########################*/

function matrixBreadcrumbClick(d, i) {
	var removeCount = universityVisObj.previousCollections.length - (i + 1);
	for (var k = 0; k < removeCount; k++) {
		universityVisObj.previousCollections.pop();
		universityVisObj.currentCollIndex--;
	}
	updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
}

/*######################### Context Menu Functions ########################*/

var menuItems = ["Back", "Private Courses", "Sort Unemployment Ascending", "Sort Unemployment Descending",
	"Sort Alphabetical [A-Z]", "Sort Alphabetical [Z-A]"
];

function clickBertinMatrixContextMenu() { //Context menu click actions
	if (d3.select(this).select("text").text() === "Sort Unemployment Ascending") {
		universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
			return d1.MediaDesemprego - d2.MediaDesemprego;
		});
	} else if (d3.select(this).select("text").text() === "Sort Unemployment Descending") {
		universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
			return d2.MediaDesemprego - d1.MediaDesemprego;
		});
	} else if (d3.select(this).select("text").text() === "Sort Alphabetical [Z-A]") {
		universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
			return d2.key.toLowerCase().localeCompare(d1.key);
		});
	} else if (d3.select(this).select("text").text() === "Sort Alphabetical [A-Z]") {
		universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
			return d1.key.toLowerCase().localeCompare(d2.key);
		});
	} else if (d3.select(this).select("text").text() === "Public Courses" ||
		d3.select(this).select("text").text() === "Private Courses") {
		if (universityVisObj.publicUniversities) {
			universityVisObj.publicUniversities = false;
			menuItems[1] = "Public Courses";
			universityVisObj.previousCollections = [fullPrivateCourseDataset];
			universityVisObj.currentCollIndex = 0;
		} else {
			universityVisObj.publicUniversities = true;
			menuItems[1] = "Private Courses";
			universityVisObj.previousCollections = [fullPublicCourseDataset];
			universityVisObj.currentCollIndex = 0;
		}
	} else {
		if (universityVisObj.currentCollIndex > 0) {
			universityVisObj.previousCollections.pop();
			universityVisObj.currentCollIndex--;
		} else {
			return;
		}
	}
	updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
}

//Update the bertin matrix y-axis label according to the quantity of data presented.
function updateBertinMatrixYaxisLabel(collectionHeight) {
	var labelWidth = 90;
	var label = "";
	if (universityVisObj.currentCollIndex == 0) {
		label = "Universities";
	} else if (universityVisObj.currentCollIndex == 1) {
		label = "Colleges";
	} else if (universityVisObj.currentCollIndex == 2) {
		label = "Courses";
	}
	var x;
	if (collectionHeight > 120) {
		x = -(collectionHeight + labelWidth) / 2;
	} else {
		x = -100;
	}

	universityVisObj.svg.select(".yaxisLabelMatrix")
		.transition()
		.duration(1000)
		.attr("y", 20)
		.attr("x", x)
		.attr("transform", "rotate(-90)")
		.text(label);
}

//Call to update university (Bertin Matrix) visualization with new data
function updateUniversityVisualization(universityVisObj, newCollection) {
	var minimumHeight = 900;
	var currentMatrixLineHeight = universityVisObj.matrixLineHeight;
	if (universityVisObj.currentCollIndex != 0 && newCollection.length < 32) {
		currentMatrixLineHeight = 33;
	}
	var newCollectionHeight = newCollection.length * currentMatrixLineHeight;
	universityVisObj.height = (newCollectionHeight < minimumHeight) ? minimumHeight : newCollectionHeight + 10;

	universityVisObj.yaxis.scale().domain(newCollection.map(function(d) {
			return d.key;
		}))
		.range([universityVisObj.paddingObj.top, newCollectionHeight]);
	universityVisObj.svg.attr("height", universityVisObj.height);

	var transition = d3.transition().duration(1000);

	//Select all the matrix data lines and remove them
	universityVisObj.svg.selectAll("g.data").remove();

	//Add new Data
	var groupLine = universityVisObj.svg
		.selectAll("g.data")
		.data(newCollection).enter().append("g")
		.attr("class", "data")
		.attr("y", function(d) {
			return universityVisObj.yaxis.scale()(d.key);
		})
		.on("mouseover", function(d) {
			if (universityVisObj.currentCollIndex == 2) {
				var courseUniversity = universityVisObj.previousCollections[1].key;
				var courseCollege = universityVisObj.previousCollections[2].key;
				var mouseOveredCourse = new Course(courseUniversity, courseCollege, d.key, d.CodigoArea);
				dispatch.call("mouseOverCourse", mouseOveredCourse, mouseOveredCourse);
			} else {
				if (universityVisObj.currentCollIndex == 0) {
					d3.selectAll("[id='" + d.key + "']").classed("matrixLine", false).classed("matrixLine-hover", true);
				} else if (universityVisObj.currentCollIndex == 1) {
					d3.selectAll("[id='" + d.key + "']").classed("matrixLine", false).classed("matrixLine-hover", true);
				}
			}
		})
		.on("mouseout", function(d) {
			dispatch.call("mouseOverCourse", null, null);
		})
		.on("click", function(d) {
			var currentCollection = universityVisObj.previousCollections[universityVisObj.currentCollIndex];
			var newCollection;

			if (universityVisObj.currentCollIndex < 2) {
				for (var i = 0; i < currentCollection.values.length; i++) {
					if (currentCollection.values[i].key === d.key) {
						newCollection = currentCollection.values[i].values;
						break;
					}
				}
				newCollection.sort(function(d1, d2) {
					return d2.MediaDesemprego - d1.MediaDesemprego;
				});
				universityVisObj.currentCollIndex++;
				universityVisObj.previousCollections.push({
					"key": d.key,
					"values": newCollection
				});

				updateUniversityVisualization(universityVisObj, newCollection);
			} else {
				for (var i = 0; i < currentCollection.values.length; i++) {
					if (currentCollection.values[i].key === d.key) {
						var universityName = universityVisObj.previousCollections[1].key;
						var collegeName = currentCollection.key;
						var courseName = currentCollection.values[i].NomeCurso;
						var courseAreaCode = currentCollection.values[i].CodigoArea;
						var selectedCourse = new Course(universityName, collegeName, courseName, courseAreaCode);
						selectedCourse.data = currentCollection.values[i].data;
						dispatch.call("selectCourse", selectedCourse, selectedCourse);
						break;
					}
				}
			}
		});

	groupLine.append("rect")
		.attr("class", "matrixLine")
		.attr("id", function(d) {
			return d.key;
		})
		.attr("x", universityVisObj.paddingObj.left)
		.attr("y", function(d) {
			return universityVisObj.yaxis.scale()(d.key) - (currentMatrixLineHeight / 2);
		})
		.attr("width", universityVisObj.width - universityVisObj.paddingObj.right)
		.attr("height", currentMatrixLineHeight);

	groupLine.selectAll("circle")
		.data(function(d) {
			return d.data;
		}).enter()
		.append("circle")
		.on("contextmenu", function() {
			d3.event.preventDefault();
			drawContextMenu(universityVisObj.svg, d3.mouse(this)[0], d3.mouse(this)[1],
				universityVisObj.width, universityVisObj.height, menuItems, clickBertinMatrixContextMenu);
		})
		.transition(transition)
		.attr("class","matrixDot")
		.attr("r", function(dy) {
			return Math.sqrt(universityVisObj.circleScale(dy.PercentagemDesemprego));
		})
		.attr("cy", function(dy) {
			return universityVisObj.yaxis.scale()(dy.key);
		})
		.attr("cx", function(dy) {
			return universityVisObj.xaxis.scale()(dy.Ano);
		})
		.attr("fill", function(d) {
			var color = rootDataColor;
			if (universityVisObj.currentCollIndex == 2) {
				color = d3.select("#AreaCode" + d.CodigoArea).attr("fill");
			}
			return color;
		});

	universityVisObj.svg
		.selectAll("g.data")
		.selectAll("circle")
		.append("title").text(function(dy) {
			return getBertinMatrixCircleTooltip(dy, universityVisObj.currentCollIndex == 2);
		});

	//Update yaxis labels due to new elements
	universityVisObj.svg.selectAll(".yaxis").transition().duration(1000).call(universityVisObj.yaxis);
	universityVisObj.svg.select(".yaxis").selectAll(".tick").append("title").text(function(d) {
		return d;
	});

	var currentSelection = [universityVisObj.previousCollections[universityVisObj.currentCollIndex].key];
	if (universityVisObj.currentCollIndex == 2) {
		currentSelection.push(universityVisObj.previousCollections[universityVisObj.currentCollIndex - 1].key);
	}
	// Alert other views that a university/college was selected
	dispatch.call("selectUniversity", currentSelection, currentSelection);

	drawBreadcrumbs(d3.select("#universityBreadcrumb").select("svg"),
		universityVisObj.previousCollections, "key", breadCrumbColorObject, matrixBreadcrumbClick, breadcrumbDim);

	updateBertinMatrixYaxisLabel(newCollectionHeight);
}

// Code related to University Visualization creation (Bertin Matrix)
function generateUniversityVis() {
	var paddingObj = {
		"top": 40,
		"bottom": 20,
		"left": 225,
		"right": 20
	}
	var matrixLineHeight = 23;
	var width = 575;
	var breadcrumbWidth = 600,
		breadcrumbHeight = 30;
	var height = fullPublicCourseDataset.values.length * matrixLineHeight;
	var maximumCircleRadius = 140;
	var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

	//Create matrix visualization space
	var svg = d3.select("#universityVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.on("contextmenu", function() {
			d3.event.preventDefault();
			drawContextMenu(svg, d3.mouse(this)[0], d3.mouse(this)[1], universityVisObj.width, universityVisObj.height, menuItems, clickBertinMatrixContextMenu);
		});

	//Creat breadcrumb space
	d3.select("#universityBreadcrumb").append("svg")
		.attr("width", breadcrumbWidth)
		.attr("height", breadcrumbHeight);

	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0, 100]).range([0, maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([paddingObj.left + paddingObj.right, width - paddingObj.right]);
	var yscale = d3.scalePoint().domain(fullPublicCourseDataset.values.map(function(d) {
		return d.key;
	})).range([paddingObj.top, height - paddingObj.bottom]);

	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) {
		return getShotStringUniCollCourse(d);
	});

	//Add yaxis label
	svg.append("text").attr("class", "axisLabel yaxisLabelMatrix");
	//Add axis
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + paddingObj.top / 2 + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + paddingObj.left + ",0)").call(yaxis);
	svg.select(".yaxis").selectAll(".tick").append("title").text(function(d) {
		return d;
	});

	universityVisObj.width = width;
	universityVisObj.height = height;
	universityVisObj.publicUniversities = true;
	universityVisObj.matrixLineHeight = matrixLineHeight;
	universityVisObj.paddingObj = paddingObj;
	universityVisObj.svg = svg;
	universityVisObj.circleScale = circleScale;
	universityVisObj.xaxis = xaxis;
	universityVisObj.yaxis = yaxis;
	universityVisObj.previousCollections = [fullPublicCourseDataset];
	universityVisObj.currentCollIndex = 0;

	//Enter/update the data in visualization
	updateUniversityVisualization(universityVisObj, fullPublicCourseDataset.values);
}

//#############################################################################
//#             				 		                                      #
//#             			  SUNBURST AREA VIEW                              #
//#             				       			                              #
//#############################################################################

/*###################### SUNBURST BREADCRUMB FUNCTIONS ######################*/

var sunburstBreadcrumbDim = {
	w: 153,
	h: 30,
	s: 3,
	t: 10
};

/*########################### SUNBURST FUNCTIONS ############################*/

//All the data to visualize sunburst [2007-2015]
var areasData = new Array(9);

loadAreasData();

// Load all the data from files to memory and draw the first year
function loadAreasData() {
	var loadDataQueue = d3.queue();
	for (var year = 2007; year <= 2015; year++) {
		loadDataQueue.defer(function(year, callback) {
			d3.json("Areas" + year + ".json", function(data) {
				areasData[year - 2007] = data;
				if (year == 2015) {
					drawSunburst(areasData[year - 2007]);
					genSlider();
				}
			});
		}, year);
	}
	loadDataQueue.awaitAll(function() {});
}

function sunburstAreaToolTip(datum) {
	if (datum.data.CNAEFNome == "All")
		return "Total Unemployeds: " + datum.value;
	var res = "Area: " + datum.data.CNAEFNome;
	res += "\nUnemployment %: " + datum.data.PercentagemDesemprego.toFixed(2) + " %";
	res += "\nTotal Unemployeds: " + datum.data.TotalDesempregados;
	res += "\nTotal Graduates: " + datum.data.TotalDiplomados;
	return res;
}

function getColorToArea(areaName, areaCode) {
	if (areaName === "All") {
		return rootDataColor;
	} else {
		var colorIndex = Math.floor(areaCode / 100);
		var code = areaCode.toString();
		colorIndex += (colorIndex >= 3) ? 1 : 0; // used to skip red 													
		if (code[1] == "0") {
			return d3.rgb(colors[colorIndex])
		} else if (code[2] == "0") {
			return d3.rgb(colors[colorIndex]).brighter(0.5);
		} else {
			return d3.rgb(colors[colorIndex]).brighter(1);
		}
	}
}

//level = clicked level
function shortenArea(t, level) {
	if (!t.includes(" "))
		return t;
	var limite = 0;
	limite = (level == 0) ? 10 : limite;
	limite = (level == 1) ? 10 : limite;
	limite = (level == 2) ? 15 : limite;
	limite = (level == 3) ? 35 : limite;

	var list = t.split(" ");
	var result = "";
	for (var i = 0; i < list.length; i++) {
		if (result.length + list[i].length > limite) {
			if (i == 0) {
				result = list[i].substring(0, limite - 5) + ". ...";
				return result;
			}
			result += "...";
			return result;
		}
		result += " " + list[i];
	}

	return result;
}

function levelArea(a) {
	if (a == 0) {
		return 0;
	}
	var a_ = a.toString();
	if (a_.substring(1, 3) == "00")
		return 1;
	if (a_[2] == "0")
		return 2;

	return 3;

}

var labelsVisibility = true;

function changeLabels() {
	if (labelsVisibility) {
		d3.selectAll(".sunburstLabel").style("display", "none");
		d3.selectAll(".labelsText").text("Show labels");
		labelsVisibility = false;
	} else {
		d3.selectAll(".sunburstLabel").style("display", "inline");
		d3.selectAll(".labelsText").text("Hide labels");
		labelsVisibility = true;
	}

}

function drawSunburst(data) {
	var width = 610,
		height = 610,
		radius = (Math.min(width, height) / 2) - 10;

	var formatNumber = d3.format(",d");

	var x = d3.scaleLinear()
		.range([0, 2 * Math.PI]);

	var y = d3.scaleLinear()
		.range([0, radius]);

	var partition = d3.partition();

	var arc = d3.arc()
		.startAngle(function(d) {
			return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
		})
		.endAngle(function(d) {
			return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
		})
		.innerRadius(function(d) {
			return Math.max(0, y(d.y0));
		})
		.outerRadius(function(d) {
			return Math.max(0, y(d.y1));
		});


	var svg = d3.select("#areaVis").append("svg")
		.attr("id", "sunburst")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

	data = d3.hierarchy(data);
	data.sum(function(d) {
		if (d.children != null)
			return 0;
		else
			return d.TotalDesempregados;
	});

	var path = svg.selectAll("path")
		.data(partition(data).descendants())
		.enter().append("g");

	path.append("title").text(sunburstAreaToolTip);

	path.append("path")
		.attr("d", arc)
		.attr("class", "sunburst")
		.attr("id", function(d) {
			return "AreaCode" + d.data.CNAEF;
		})
		.attr("fill", function(d) {
			return getColorToArea(d.data.CNAEFNome, d.data.CNAEF);
		})
		.on("click", click);

	var text = path.append("text")
		.attr("transform", function(d) {
			return "rotate(" + computeTextRotation(d) + ")";
		})
		.attr("x", function(d) {
			return y(d.y0);
		})
		.attr("class", "sunburstLabel")
		.attr("dx", "6") // margin
		.attr("dy", ".35em") // vertical-align
		.text(function(d) {
			return shortenArea(d.data.CNAEFNome, 0);
		})
		.style("visibility", function(d) {
			return nextArea(d.data.CNAEF, 0) ? "visible" : "hidden";
		})
		.on("click", click);

	//Add the space for areaBreadcrumb
	d3.select("#areaBreadcrumb")
		.append("svg")
		.attr("height", 30)
		.attr("width", 630);

	//Draw the breadcrumbs
	drawBreadcrumbs(d3.select("#areaBreadcrumb").select("svg"), [{
			"currentAreaName": "All",
			"CNAEF": 0
		}], "currentAreaName", breadCrumbColorObject,
		sunburstBreadcrumbClick, sunburstBreadcrumbDim);

	//Receive event from overing a course in other views
	dispatch.on("mouseOverCourse.sunburst", function(course, dummy) {
		if (course != null) {
			var actualColor = d3.select("#AreaCode" + course.courseAreaCode).attr("fill");
			var overedColor = d3.rgb(actualColor).darker(1.25);
			d3.select("#AreaCode" + course.courseAreaCode).attr("fill", overedColor).classed("sunburstAreaOvered", true);
		} else {
			d3.select("#areaVis")
				.select("svg")
				.selectAll(".sunburstAreaOvered")
				.attr("fill", function(d) {
					return getColorToArea(d.data.CNAEFNome, d.data.CNAEF);
				})
				.classed("sunburstAreaOvered", false);
		}
	});

	//Receive event from view change where an area was selected
	dispatch.on("selectArea.sunburst", function(area, dummy) {
		var d = d3.select("#AreaCode" + area.code).datum();
		path.select(".sunburstLabel").transition().style("visibility", "hidden");


		//Obtain the information and update suburst breadcrumbs
		var currentData = d;
		var areasTrail = [];
		var breadcrumbColor = new Object();
		breadcrumbColor.getColor = function(dataKey) {
			return this[dataKey];
		};
		while (currentData != null) {
			breadcrumbColor[currentData.data.CNAEFNome] = d3.select("#AreaCode" + currentData.data.CNAEF).attr("fill");
			areasTrail.unshift({
				"currentAreaName": currentData.data.CNAEFNome,
				"CNAEF": currentData.data.CNAEF
			});
			currentData = currentData.parent;
		}
		drawBreadcrumbs(d3.select("#areaBreadcrumb").select("svg"),
			areasTrail, "currentAreaName", breadcrumbColor, sunburstBreadcrumbClick, sunburstBreadcrumbDim)

		//Update the suburst visualization
		svg.transition()
			.duration(750)
			.tween("scale", function() {
				var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
					yd = d3.interpolate(y.domain(), [d.y0, 1]),
					yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
				return function(t) {
					x.domain(xd(t));
					y.domain(yd(t)).range(yr(t));
				};
			})
			.selectAll("path")
			.attrTween("d", function(d) {
				return function() {
					return arc(d);
				};
			})
			.on("end", function(e, i) {
				var clicked = d.data.CNAEF;
				if ((nextArea(e.data.CNAEF, d.data.CNAEF) && d.data.CNAEFNome == "All") || (subArea(e.data.CNAEF, d.data.CNAEF) && d.data.CNAEFNome != "All")) {
					var arcText = d3.select(this.parentNode).select("text");
					arcText.transition().duration(750)
						.style("visibility", "visible")
						.attr("transform", function() {
							return "rotate(" + computeTextRotation(e) + ")"
						})
						.attr("x", function(d) {
							return y(d.y0);
						})
						.text(function(d) {
							return shortenArea(d.data.CNAEFNome, levelArea(clicked));
						});
				}
			});
	});

	var showLabelsContainer = d3.select("#areaVis").select("svg").append("g");

	showLabelsContainer.append("rect")
		.attr("width", 80)
		.attr("height", 20)
		.attr("x", 480)
		.attr("y", 570)
		.attr("fill", rootDataColor);

	showLabelsContainer.append("text")
		.text("Hide labels")
		.attr("class", "labelsText")
		.attr("x", 483)
		.attr("y", 585)
		.on("click", changeLabels);

	function sunburstBreadcrumbClick(datum) {
		var area = new CourseArea(datum.currentAreaName, datum.CNAEF, d3.select("#AreaCode" + datum.CNAEF).attr("fill"));
		dispatch.call("selectArea", area, area);
	}

	function click(d) {
		var area = new CourseArea(d.data.CNAEFNome, d.data.CNAEF, d3.select("#AreaCode" + d.data.CNAEF).attr("fill"));
		dispatch.call("selectArea", area, area);
	}

	d3.select(self.frameElement).style("height", height + "px");

	function computeTextRotation(d) {
		var thetaDeg = (180 / Math.PI * (arc.startAngle()(d) + arc.endAngle()(d)) / 2 - 90);
		return thetaDeg;
	}

}

function genSlider() {
	var Width = 600;
	var svg = d3.select("#areaSlider").append("svg").attr("width", Width);
	var margin = {
			right: 50,
			left: 50,
			top: 15
		},
		width = Width - margin.left - margin.right;

	var x = d3.scaleLinear()
		.domain([2007, 2015])
		.range([0, width])
		.clamp(true);

	var slider = svg.append("g")
		.attr("class", "slider")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	//on/off labels

	slider.append("line")
		.attr("class", "track")
		.attr("x1", x.range()[0])
		.attr("x2", x.range()[1])
		.select(function() {
			return this.parentNode.appendChild(this.cloneNode(true));
		})
		.attr("class", "track-inset")
		.select(function() {
			return this.parentNode.appendChild(this.cloneNode(true));
		})
		.attr("class", "track-overlay")
		.call(d3.drag()
			.on("start.interrupt", function() {
				slider.interrupt();
			})
			.on("end drag", function() {
				dragEnd();
			})
			.on("start drag", function() {
				drag();
			}));

	slider.insert("g", ".track-overlay")
		.attr("class", "tick")
		.attr("transform", "translate(0," + 18 + ")")
		.selectAll("text")
		.data(x.ticks(10))
		.enter().append("text")
		.attr("x", x)
		.attr("text-anchor", "middle")
		.text(function(d) {
			return d
		});

	var handle = slider.insert("circle", ".track-overlay")
		.attr("class", "handle")
		.attr("r", 9);

	function drag() {
		handle.attr("cx", x(x.invert(d3.event.x)));
		//handle.attr("class",".track-overlay-grabbing");
	}

	function dragEnd() {
		handle.attr("cx", x(x.invert(value(d3.event.x, width))));
		d3.select("#sunburst").remove(); //Remove Sunburst
		d3.select("#areaBreadcrumb").select("svg").remove(); //Remove breadcrumb
		drawSunburst(areasData[year(d3.event.x, width) - 2007]); //Load data and draw sunburst
	}
	handle.attr("cx", x(x.invert(9999)));
	d3.select("#sunburst").remove(); //Remove Sunburst
	d3.select("#areaBreadcrumb").select("svg").remove(); //Remove breadcrumb
	drawSunburst(areasData[8]);
}

function value(x, w) {
	var s = w / 8;
	var h = s / 2;
	if (x < h)
		return 0;
	if (x >= h && x < s + h)
		return s;
	if (x >= 2 * s - h && x < 2 * s + h)
		return 2 * s;
	if (x >= 3 * s - h && x < 3 * s + h)
		return 3 * s;
	if (x >= 4 * s - h && x < 4 * s + h)
		return 4 * s;
	if (x >= 5 * s - h && x < 5 * s + h)
		return 5 * s;
	if (x >= 6 * s - h && x < 6 * s + h)
		return 6 * s;
	if (x >= 7 * s - h && x < 7 * s + h)
		return 7 * s;
	if (x >= 8 * s - h)
		return 8 * s;

}

function year(x, w) {
	var s = w / 8;
	var h = s / 2;
	if (x < h)
		return 2007;
	if (x >= h && x < s + h)
		return 2008;
	if (x >= 2 * s - h && x < 2 * s + h)
		return 2009;
	if (x >= 3 * s - h && x < 3 * s + h)
		return 2010;
	if (x >= 4 * s - h && x < 4 * s + h)
		return 2011;
	if (x >= 5 * s - h && x < 5 * s + h)
		return 2012;
	if (x >= 6 * s - h && x < 6 * s + h)
		return 2013;
	if (x >= 7 * s - h && x < 7 * s + h)
		return 2014;
	if (x >= 8 * s - h)
		return 2015;

}

//#############################################################################
//#             				 		                                      #
//#             		   COURSE LINE CHART VIEW                             #
//#             				       			                              #
//#############################################################################

function digestCourseNames(courseName){
	var res = "";
	var tokens = courseName.split(" ");
	var cleanTokens = [];
	for(var i = 0; i < tokens.length; i++) {
		if (tokens[i][0] != null && tokens[i][0].match(/[A-Z]|É|-/)) {
			cleanTokens.push(tokens[i]);
		}
	}
	
	var tokensLength = (cleanTokens.length < 4) ? cleanTokens.length : 4;
	if (tokensLength == 4) {
		tokensLength++;
		cleanTokens[4] = "...";
	}

	for (var i = 0; i < tokensLength; i++) {
		res += cleanTokens[i] + " ";
	}
	return res;
}

var lineChartObj = new Object();
lineChartObj.currentCourses = new Array();
lineChartObj.addCourse = function(course) {
	this.currentCourses.push(course);
};
lineChartObj.removeCourse = function(course) {
	for (var i = 0; i < this.currentCourses.length; i++) {
		if (this.currentCourses[i].equals(course)) {
			this.currentCourses.splice(i, 1);
			return;
		}
	}
};
lineChartObj.emptyCourses = function() {
	return this.currentCourses.length == 0;
};
lineChartObj.fullCourses = function() {
	return this.currentCourses.length == 5;
};

generateLineChartVis();

//Receive event from selecting a course in other views
dispatch.on("selectCourse", function(d) {
	if (lineChartObj.currentCourses.length < 5) {
		for (var i = 0; i < lineChartObj.currentCourses.length; i++) {
			if (lineChartObj.currentCourses[i].equals(d)) { //Course already selected
				return;
			}
		}
		lineChartObj.addCourse(d);
		for (var i = 0; i < lineChartObj.currentCourses.length; i++){
			d3.select("#lineChartVis").select("svg").select("#LineId" + lineChartObj.currentCourses[i].getId()).remove();
			updateLineChartVis(lineChartObj.currentCourses[i]);
		}
	} else {
		var warning = d3.select("#lineFullWarning")
			.attr("visibility", "visible");

		warning.transition()
			.duration(1000)
			.delay(2000)
			.attr("visibility", "hidden");
	}
});

//Receive event from other views a course was mouse overed
dispatch.on("mouseOverCourse.lineChart", function(selected, dummy) {
	if (selected != null) {
		var id = "LineId" + selected.getId();
		d3.select("#lineChartVis").select("svg")
			.select("#" + id)
			.classed("line", false).classed("line-hover", true);
	} else {
		d3.select("#lineChartVis").select("svg")
			.select(".line-hover")
			.classed("line", true).classed("line-hover", false);
	}
});

//Draw a label to advise the user about the line chart state
function drawEmptyLineChartLabel(on) {
	if (on) {
		d3.select("#lineChartWarning").attr("visibility", "visible");
	} else {
		d3.select("#lineChartWarning").attr("visibility", "hidden");
	}
}

//Draw the menu for courses selected in line chart 
function drawCurrentCoursesMenu() {
	var menuItemDistance = 5;
	var menuItemWidth = 350;
	var menuItemHeight = 40;
	var menuItemStartY = 20;
	var menuItemX = 955;
	var imageSize = 20;
	var data = lineChartObj.currentCourses;

	d3.select("#lineChartVis").select("svg")
		.select("g.lineChartCurrentCourses").remove();

	var currentCoursesContainer = d3.select("#lineChartVis")
		.select("svg")
		.append("g")
		.classed("lineChartCurrentCourses", true);

	var currentCoursesContainerItems = currentCoursesContainer
		.selectAll("g")
		.data(lineChartObj.currentCourses)
		.enter()
		.append("g")
		.classed("lineChartCourseMenuItem", true)
		.on("mouseover", function(d) {
			dispatch.call("mouseOverCourse", d, d);
		})
		.on("mouseout", function(d) {
			dispatch.call("mouseOverCourse", null, null);
		})
		.on("click", function(d) {
			lineChartObj.removeCourse(d);
			d3.select("#lineChartVis").select("svg").select("#LineId" + d.getId()).remove();
			for (var i = 0; i < lineChartObj.currentCourses.length; i++){
				d3.select("#lineChartVis").select("svg").select("#LineId" + lineChartObj.currentCourses[i].getId()).remove();
				updateLineChartVis(lineChartObj.currentCourses[i]);
			}
			drawCurrentCoursesMenu();
			if (lineChartObj.emptyCourses()) {
				drawEmptyLineChartLabel(true);
			}
			dispatch.call("mouseOverCourse", null, null);
		});

	currentCoursesContainerItems.append("title")
		.text(function(d) {
			var res = "University: " + d.universityName;
			res += "\nCollege: " + d.collegeName;
			res += "\nCourse: " + d.courseName;
			return res;
		});

	currentCoursesContainerItems.append("rect")
		.attr("y", function(d, i) {
			return menuItemStartY + ((menuItemHeight + menuItemDistance) * i);
		})
		.attr("x", menuItemX)
		.attr("width", menuItemWidth)
		.attr("height", menuItemHeight)
		.attr("fill", function(d) {
			return getColorToArea("dummy", d.courseAreaCode);
		});

	currentCoursesContainerItems.append("text")
		.attr("y", function(d, i) {
			return menuItemStartY + ((menuItemHeight + menuItemDistance) * i) + menuItemHeight / 2 + 4;
		})
		.attr("x", menuItemX + 5)
		.text(function(d) {
			return digestCourseNames(d.courseName);
		});

	currentCoursesContainerItems.append("image")
		.attr("y", function(d, i) {
			return menuItemStartY + ((menuItemHeight + menuItemDistance) * i) + menuItemHeight / 4;
		})
		.attr("x", menuItemX + 270)
		.attr("width", imageSize)
		.attr("height", imageSize)
		.attr("xlink:href", "deleteCross.png");
}

//Update the line chart visualization with new data
function updateLineChartVis(collection) {
	drawEmptyLineChartLabel(false);
	var line = d3.line()
		.x(function(d) {
			return lineChartObj.xscale(d.Ano);
		})
		.y(function(d) {
			return lineChartObj.yscale(d.PercentagemDesemprego);
		});
	var ymax = 0;
	for(var i = 0; i < lineChartObj.currentCourses.length; i++) {
		for(var k = 0; k < lineChartObj.currentCourses[i].data.length; k++) {
			ymax = (lineChartObj.currentCourses[i].data[k].PercentagemDesemprego > ymax) ? lineChartObj.currentCourses[i].data[k].PercentagemDesemprego : ymax;
		}
	}
	
	lineChartObj.yscale.domain([ymax,0]);
	var yaxis = d3.axisLeft().scale(lineChartObj.yscale);
	d3.select("#lineChartVis").select("svg").select(".yaxis").attr("transform", "translate(" + 40 + ",0)").call(yaxis);

	//Add/update with the new data
	d3.select("#lineChartVis").select("svg")
		.append("path")
		.datum(collection.data)
		.attr("class", "line")
		.attr("d", line)
		.attr("stroke", function(d) {
			return getColorToArea("dummy",d[0].CodigoArea);
		})
		.attr("id", function(d) {
			var course = new Course(d[0].NomeUniversidade, d[0].NomeFaculdade, d[0].key, d[0].CodigoArea);
			return "LineId" + course.getId();
		})
		.on("mouseover", function(d) {
			var mouseOveredCourse = new Course(d[0].NomeUniversidade, d[0].NomeFaculdade, d[0].key, d[0].CodigoArea);
			dispatch.call("mouseOverCourse", mouseOveredCourse, mouseOveredCourse);
		})
		.on("mouseout", function(d) {
			dispatch.call("mouseOverCourse", null, null);
		})
		.append("title").text(function(d) {
			var res = "";
			res += "University: " + d[0].NomeUniversidade;
			res += "\nCollege: " + d[0].NomeFaculdade;
			res += "\nCourse: " + d[0].key;
			return res;
		});

	drawCurrentCoursesMenu();
}

//Generate the Line Chart Visualization
function generateLineChartVis() {
	var height = 280;
	var width = 1250;
	var padding = {
		"top": 5,
		"bottom": 20,
		"left": 40,
		"right": 300
	};

	var svg = d3.select("#lineChartVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scaleLinear().domain([2007, 2015]).range([padding.left, width - padding.right]);
	var yscale = d3.scaleLinear().domain([100, 0]).range([padding.top, height - padding.bottom]);

	var xaxis = d3.axisBottom().tickFormat(d3.format("0000")).scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding.bottom) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding.left + ",0)").call(yaxis);

	lineChartObj.xscale = xscale;
	lineChartObj.yscale = yscale;
	lineChartObj.width = width;
	lineChartObj.height = height;
	lineChartObj.empty = true;

	//Draw the empty line chart warning label
	svg.append("text")
		.attr("id", "lineChartWarning")
		.attr("x", ((width - padding.right) - 450) / 2)
		.attr("y", height / 2)
		.text("Select multiple courses in the table or scatter to compare here (Up to 5)");

	drawEmptyLineChartLabel(true);

	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", -(height + 80) / 2)
		.attr("y", 12)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");

	svg.append("image")
		.attr("id", "lineFullWarning")
		.attr("y", -60)
		.attr("x", 50)
		.attr("width", 500)
		.attr("height", 200)
		.attr("xlink:href", "lineFullWarning.png")
		.attr("visibility", "hidden");
}

//#############################################################################
//#             				 		                                      #
//#                      COURSE SCATTER PLOT CHART VIEW                       #
//#             				       			                              #
//#############################################################################

/* Get a short string of the area name to draw */
function getAreaNameDigest(string) {
	var res = "";
	var cleanTokens = string.split(" ");

	var tokensLength = (cleanTokens.length < 7) ? cleanTokens.length : 6;
	if (tokensLength == 6) {
		tokensLength++;
		cleanTokens[6] = "...";
	}

	for (var i = 0; i < tokensLength; i++) {
		res += cleanTokens[i] + " ";
	}
	return res;
}

/* Return the string to show in tooltip */
function getScatterPlotTooltip(datum) {
	var tokens = datum.NomeFaculdade.split(" - ");
	if (tokens.length == 1) {
		tokens.push(tokens[0]);
	}
	var res = "University: " + tokens[0];
	res += "\nCollege: " + tokens[1];
	res += "\nCourse: " + datum.NomeCurso;
	res += "\nEntry Grade: " + datum.Nota;
	res += "\nUnemployment %: " + datum.PercentagemDesemprego + "%";
	return res;
}

/* Return true if a is a sub-area of b, false otherwise */
function subArea(a, b) {
	var a_ = a.toString();
	var b_ = b.toString();
	if (b == 0) { // 0 is the Root(All areas)
		return true;
	} else if (b_.substring(1, 3) == "00") {
		return a_[0] == b_[0];
	} else if (b_[2] == "0") {
		return a_.substring(0, 2) == b_.substring(0, 2);
	} else {
		return a_ == b_;
	}
}
/*Return true if a is b or children*/
function nextArea(a, b) {
	var a_ = a.toString();
	var b_ = b.toString();
	if (b == 0) {
		return a_.substring(1, 3) == "00";
	} else if (a_ == b_) {
		return true;
	} else if (b_.substring(1, 3) == "00") {
		return a_[1] != "0" && a_[2] == "0" && a_[0] == b_[0];
	} else if (b_[2] == "0") {
		return a_[2] != "0" && a_.substring(0, 2) == b_.substring(0, 2);
	}
	return false;
}


/*############################# SCATTER PLOT CONTEXT MENU #####################################*/

var scatterPlotContextMenuItems = ["Select Equal College", "Select Equal Area"];
var selectedDatum;

function clickScatterPlotContextMenu() { //Context menu click actions
	if (d3.select(this).select("text").text() === "Select Equal College") {
		scatterVisObj.selectedUniversity = selectedDatum.NomeFaculdade.split(" - ");
		if (scatterVisObj.selectedUniversity.length == 1) {
			scatterVisObj.selectedUniversity.push(scatterVisObj.selectedUniversity[0]);
		}
		dispatch.call("selectUniversityScatter", scatterVisObj.selectedUniversity, scatterVisObj.selectedUniversity);
	} else if (d3.select(this).select("text").text() === "Select Equal Area") {
		var area = new CourseArea(selectedDatum.CNAEFNome, selectedDatum.CNAEF, d3.select("#AreaCode" + selectedDatum.CNAEF).attr("fill"));
		dispatch.call("selectArea", area, area);
	}
}

/*########################## SCATTER PLOT VISUALIZATION CODE #################################*/

var fullScatterDataset; //All the data from the entry grades file

var scatterVisObj = new Object(); //Scatter plot vis object
scatterVisObj.selectedUniversity = ["Public Courses"];
scatterVisObj.selectedArea = new CourseArea("All", 0, rootDataColor);

//Load the Scatter Plot Courses data and prepare it to be used in visualization
d3.json("EntryGrades.json", function(data) {
	fullScatterDataset = data.data;
	generateScatterVis();
});

//Receive event from views that a course was mouse overed
dispatch.on("mouseOverCourse.scatterPlot", function(course, dummy) {
	var overedCircleRadius = 8;
	if (course != null) {
		d3.select("#courseScatterVis").select("svg")
			.select("#Scatter" + course.getId())
			.transition().duration(150)
			.attr("r", overedCircleRadius);
		d3.select("#courseScatterVis").select("svg")
			.select("#Scatter" + course.getId())
			.classed("scatterPlotDot-hover", true);
	} else {
		d3.select("#courseScatterVis").select("svg")
			.selectAll(".scatterPlotDot-hover")
			.transition().duration(150)
			.attr("r", 3)
		d3.select("#courseScatterVis").select("svg")
			.selectAll(".scatterPlotDot-hover")
			.classed("scatterPlotDot-hover", false);
	}
});

//Receive event from view change an area was selected
dispatch.on("selectArea.scatterPlot", function(area, dummy) {
	scatterVisObj.selectedArea = area;
	filterScatterVis();
});

//Receive event from view change in university/college matrix view
dispatch.on("selectUniversity", function(selected, dummy) {
	scatterVisObj.selectedUniversity = selected;
	filterScatterVis();
});

// Update the scatter plot info according with external filtering events
function filterScatterVis() {
	var allUniversitiesData = scatterVisObj.selectedUniversity[0] === "Public Courses" ||
		scatterVisObj.selectedUniversity[0] === "Ensino Privado";
	if (allUniversitiesData) {
		d3.select(".universitySelected").attr("visibility", "hidden");
	} else {
		d3.select(".universitySelected").attr("visibility", "visible");
		d3.select(".universitySelected").select("text").text(getAreaNameDigest(scatterVisObj.selectedUniversity[0]));
		d3.select(".universitySelected").select("title").text(scatterVisObj.selectedUniversity[0]);
	}
	if (scatterVisObj.selectedArea.code == 0) {
		d3.select(".areaSelected").attr("visibility", "hidden");
	} else {
		d3.select(".areaSelected").attr("visibility", "visible");
		d3.select(".areaSelected").select("rect").transition().duration(1000).attr("fill", scatterVisObj.selectedArea.color);
		d3.select(".areaSelected").select("text").text(getAreaNameDigest(scatterVisObj.selectedArea.name));
		d3.select(".areaSelected").select("title").text(scatterVisObj.selectedArea.name);
	}

	//Filter the dots using the color encoding
	d3.select("#courseScatterVis").select("svg")
		.selectAll("circle")
		.each(function(p, j) {
			d3.select(this)
				.transition().duration(1000)
				.attr("class", "scatterPlotDot")
				.attr("fill", function(d) {
					var res = "#e6e6e6"; //Not accepted by filter
					if (scatterVisObj.selectedUniversity[0] === "Public Courses") { //All Universities Data
						if (subArea(d.CNAEF, scatterVisObj.selectedArea.code)) {
							res = scatterVisObj.selectedArea.color;
						}
					} else { //University/College selected
						var university = true;
						for (var i = 0; i < scatterVisObj.selectedUniversity.length; i++) {
							if (!d.NomeFaculdade.includes(scatterVisObj.selectedUniversity[i])) {
								university = false;
								break;
							}
						}
						if (university && subArea(d.CNAEF, scatterVisObj.selectedArea.code)) {
							res = scatterVisObj.selectedArea.color;
						}
					}
					return res;
				});
		});

	//Add events to the courses dots
	d3.select("#courseScatterVis").select("svg")
		.selectAll("circle")
		.on("mouseover", function(d) {
			var tokens = d.NomeFaculdade.split(" - ");
			var overCourse = new Course(tokens[0], tokens[1], d.NomeCurso, d.CNAEF);
			dispatch.call("mouseOverCourse", overCourse, overCourse);
		})
		.on("mouseout", function() {
			dispatch.call("mouseOverCourse", null, null);
		});
}

//Draw/update the scatter plot
function updateScatterVis(newCollection) {
	var dotRadius = 3;

	//Enter/update the data
	var circles = d3.select("#courseScatterVis").select("svg")
		.selectAll("circle")
		.data(newCollection)
		.enter().append("circle")
		.attr("r", function(d) {
			if (d.PercentagemDesemprego < 0) {
				return 0;
			} else {
				return dotRadius;
			}
		})
		.attr("id", function(d) {
			var tokens = d.NomeFaculdade.split(" - ");
			var course = new Course(tokens[0], tokens[1], d.NomeCurso, d.CodigoArea);
			return "Scatter" + course.getId();
		})
		.attr("cx", function(d) {
			return scatterVisObj.xscale(d.Nota / 10);
		})
		.attr("cy", function(d) {
			return scatterVisObj.yscale(d.PercentagemDesemprego);
		});

	circles.append("title").text(function(d) {
		return getScatterPlotTooltip(d);
	});

	circles.on("contextmenu", function(d) { //Draw the scatter plot context menu
			d3.event.preventDefault();
			selectedDatum = d;
			drawContextMenu(d3.select("#courseScatterVis").select("svg"), d3.mouse(this)[0], d3.mouse(this)[1], scatterVisObj.width, scatterVisObj.height,
				scatterPlotContextMenuItems, clickScatterPlotContextMenu);
		})
		.on("click", function(d) { //Add the course to the line chart
			var course;
			var tokens = d.NomeFaculdade.split(" - ");
			if (tokens.length == 1) {
				tokens.push(tokens[0]);
			}
			course = new Course(tokens[0], tokens[1], d.NomeCurso, d.CNAEF);
			dispatch.call("selectCourseScatter", course, course);
		});
}

function generateScatterVis() {
	var height = 670;
	var width = 620;
	var padding = {
		"top": 10,
		"bottom": 40,
		"left": 40,
		"right": 10
	};
	var crossImageSize = 20;
	//Create the svg to the scatter plot
	var svg = d3.select("#courseScatterVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scaleLinear().domain([9.5, 18.6]).range([padding.left, width - padding.right]);
	var yscale = d3.scaleLinear().domain([90, 0]).range([padding.top, height - padding.bottom]);

	scatterVisObj.width = width;
	scatterVisObj.height = height;
	scatterVisObj.xscale = xscale;
	scatterVisObj.yscale = yscale;
	scatterVisObj.padding = padding;
	scatterVisObj.selectedUniversity = ["Public Courses"];

	updateScatterVis(fullScatterDataset);

	var xaxis = d3.axisBottom().scale(xscale).ticks(19);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding.bottom) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding.left + ",0)").call(yaxis);

	var g = svg.append("g").attr("class", "universitySelected");
	g.append("rect")
		.attr("x", 220)
		.attr("y", 0)
		.attr("width", 380)
		.attr("height", 30)
		.attr("fill", rootDataColor);
	g.append("text")
		.attr("class", "universitySelectedText")
		.attr("x", 222)
		.attr("y", 20)
		.text("Public Courses");
	g.append("image")
		.attr("width", crossImageSize)
		.attr("height", crossImageSize)
		.attr("x", 578)
		.attr("y", 5)
		.attr("xlink:href", "deleteCross.png");
	g.append("title").text("Public Courses");
	g.attr("visibility", "hidden")
		.on("click", function() {
			dispatch.call("clearMatrix");
		});

	g = svg.append("g").attr("class", "areaSelected");
	g.append("rect")
		.attr("x", 220)
		.attr("y", 35)
		.attr("width", 380)
		.attr("height", 30)
		.attr("fill", rootDataColor);
	g.append("text")
		.attr("class", "areaSelectedText")
		.attr("x", 222)
		.attr("y", 55)
		.text("All");
	g.append("image")
		.attr("width", crossImageSize)
		.attr("height", crossImageSize)
		.attr("x", 578)
		.attr("y", 40)
		.attr("xlink:href", "deleteCross.png");
	g.append("title").text("All");
	g.attr("visibility", "hidden")
		.on("click", function() {
			var area = new CourseArea("All", 0, rootDataColor);
			dispatch.call("selectArea", area, area);
		});

	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", -height / 2)
		.attr("y", 12)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", (width - 175) / 2)
		.attr("y", height - 5)
		.text("Course Minimum Entry Grade");
}

//#############################################################################
//#############################################################################
//#############################################################################
//#############################################################################
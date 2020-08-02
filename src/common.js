
const slides = [
    {
        'title': 'This is the first slide',
        'populator': firstSlideBuilder
    },
    {
        'title': 'This is the second slide',
        'populator': secondSlideBuilder
    },
    {
        'title': 'This is the second slide',
        'populator': thirdSlideBuilder
    }   
]

var loadedData = null;
var years = null;
var categories = null;
var miscCategories = null;
var averageMovieRatingsByYear = null;
var runningYearCounts = null;
// // get the min & max of the year data
var minYear = null;
var maxYear = null;
var maxYearCount = null;

var maxCatCount = null;


const svgWidth = 750;
const svgHeight = 500;
const halfBarMarginPercent = .05;

// Axis margins
const padAxisTop = 50;
const padAxisBottom = 20;
const padAxisLeft = 50;
const padAxisRight = 50;
const genreThresh = 5;
// Merge categories that are less than this % of the scanned movies
const otherCategoryThreshold = .07;

// Subtitles & Text
const slide1Subtitle = 'How Often Does Netflix Add New Movies?'
const slide2Subtitle = 'Is the Movie Quality on Netflix Consistent?'
const slide3Subtitle = 'What Genres of Movies are on Netflix?'
const slide1Description = 'Netflix has long been known for offering a wide variety of movies on their streaming service. In recent years, many companies like Disney, Amazon, and Hulu have entered the streaming space as competitors. In order to stay ahead, streaming platforms must offer high-quality new content regularly. From a quantity perspective, Netflix has done an excellent job of adding a high volume of movies and expanding its platform to over 190 countries. It is important note that the data portrayed in the visualization below shows the movies uploaded to Netflix as of mid-January, 2020.'
const slide2Description = 'Maybe!'
const slide3Description = 'Netflix has an extremely diverse selection. [EXPLAIN MORE]'

// Slide 1 - interactive slide config and visualization
/*
 * Reset the canvas on which we draw our graphs. We do this before any slide transitions
 * to ensure that we have a clean slate.
 */
function resetGraphicsCanvas() {
    d3.selectAll("#svg_canvas > *").remove();
}

/*
 * We have one slide selected at any given time. The selected slide number is always highlighted
 * so that the user knows which slide they are on. When another slide is selected, its button
 * should be highlighted, and all other buttons should be reset to a non-emphasized state.
 */
function emphasizeButton(buttonIdx) {
    slides.forEach((slideInfo, idx) => {
        if(buttonIdx == idx) {
            slideInfo.button.className = 'selectedButton';
        } else {
            slideInfo.button.className = '';
        }
    });
}

// Populate info needed for slide 1
function buildYearList(data) {
    const yearMap = {}
    data.forEach((d) => {
        if(d['Year Added'] in yearMap) {
            yearMap[d['Year Added']] += 1;
        } else {
            yearMap[d['Year Added']] = 1;
        }
    });
    years = [];
    Object.keys(yearMap).forEach((year) => {
        years.push({'year': parseInt(year), 'count': yearMap[year]});
    });
    minYear = d3.min(years.map((d) => {return d.year}));
    maxYear = d3.max(years.map((d) => {return d.year}));
    // Round the max count up to the nearest 100
    maxYearCount = Math.ceil(d3.max(years.map((d) => {return d.count}))/100.0) * 100;
}

function updateSubtitleText(newText) {
    document.getElementById("sub_title").innerText = newText;
}

function updateDescriptionText(newText) {
    document.getElementById("text_area").innerText = newText;
}

function firstSlideBuilder() {
    resetGraphicsCanvas();
    updateSubtitleText(slide1Subtitle);
    updateDescriptionText(slide1Description);
    // Create scales for the x axis (year) & y axis (number of released movies)
    const xScale = d3.scaleBand()
         .domain(d3.range(minYear, maxYear+1))
         .range([padAxisLeft, svgWidth - padAxisRight]);
    const yScale = d3.scaleLinear()
        .domain([0, maxYearCount])
        .range([padAxisTop, svgHeight - padAxisBottom]);
    const barMargin = halfBarMarginPercent * xScale.bandwidth();
    
    // Populate the cleared svg with bar graph
    const svgCanvas = d3.select('#svg_canvas')
        .attr('height', svgHeight)
        .attr('width', svgWidth)

    const xAxisScale = d3.scaleBand()
        .domain(d3.range(minYear, maxYear+1))
        .range([padAxisLeft, svgWidth - padAxisRight]);
    const yAxisTranslate = svgHeight - padAxisTop;
    svgCanvas.append('g')
        .attr('transform', 'translate(0,'+yAxisTranslate+')')
        .call(d3.axisBottom(xAxisScale));

    const yAxisScale = d3.scaleLinear()
        .domain([0, maxYearCount])
        .range([svgHeight - padAxisTop, padAxisBottom]);
    svgCanvas.append('g')
        .attr('transform', 'translate('+padAxisLeft+', 0)')
        .call(d3.axisLeft(yAxisScale))
    svgCanvas.append('g')
        .attr("class", "gridline")
        .attr('transform', 'translate('+padAxisLeft+', 0)')
        .call(d3.axisLeft(yAxisScale)
        .tickSize(-1 * (svgWidth - padAxisLeft - padAxisRight))
        .tickFormat(""))

    const plotCanvas = svgCanvas.selectAll('plotviz')
        .data(years)
        .enter()
        .append('rect')
            .on('mouseover', function(d, i) {
                var toolTipHtml = 'Number of movies uploaded in ' + d.year + '<br>'
                toolTipHtml += d.count
                d3.select(this)
                    .style('opacity', 0.8)
                    .attr('fill', "#1CCAD8");
                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('left',(d3.event.pageX+5)+'px')
                    .style('top',(d3.event.pageY+5)+'px')
                    .style('position', 'absolute')
                    .style('text-align', 'center')
                    .style('background', 'white')
                    .style('border-style', 'solid')
                    .style('border-width', '1px')
                    .style('padding', '1px')
                    .html(
                        toolTipHtml
                    )
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .style('opacity', 1)
                    .attr('fill', "#587291");
                d3.select('#tooltip')
                    .style("opacity", 0)
            })
            .attr('x', (d) => {return xScale(d.year);})
            .attr('y', (d) => {return svgHeight - padAxisTop;})
            .attr('width', () => {
                return xScale.bandwidth() - barMargin;
            })
            .attr('height', (d) => {
                return 0;
            })
            .attr("fill", "#587291")
    
    addDefaultSvgAxes(svgCanvas, 'Year added to Netflix', 'Number of Movies');
    addPlotTransition(plotCanvas, yScale);
    // TODO: ADD ANNOTATIONS
}


function addPlotTransition(plotCanvas, yScale) {
    plotCanvas.transition()
        .attr('y', (d) => {
            return svgHeight - yScale(d.count);
        })
        .attr('height', (d) => {
            return yScale(d.count) - padAxisTop;
        })
        .duration(750)
}

function addDefaultSvgAxes(svgCanvas, xAxisText, yAxisText) {
    // X-axis label
    svgCanvas.append("text")
        .attr("y", (svgHeight - padAxisBottom))
        .attr("x", (svgWidth / 2 ) - padAxisLeft)
        .text(xAxisText)
        .attr('dy', '12px');

    // Y-axis label
    svgCanvas.append("text")
        .attr("y", 12)
        .attr("x", - svgHeight/2 - 35)
        .attr("transform", "rotate(-90)")
        .text(yAxisText);
}

//////////////////////////////////////////////////////////////////////////////////////////
// Ensure that all interactive buttons for drilling deeper are reset on slide changes
function clearInteractiveComponents() {
    const toggleDiv = document.getElementById('interactive_components');
    toggleDiv.innerHTML = '';
}

// Compute the average movie by rating by year
function buildMovieRatingLists(data) {
    runningYearCounts = {};
    data.forEach((d) => {
        if(d['Year Added'] in runningYearCounts) {
            runningYearCounts[d['Year Added']].ratingSum += d['IMDB Rating'];
            runningYearCounts[d['Year Added']].count += 1;
        } else {
            runningYearCounts[d['Year Added']] = {};
            runningYearCounts[d['Year Added']].ratingSum = d['IMDB Rating'];
            runningYearCounts[d['Year Added']].count = 1;
        }
    });
    averageMovieRatingsByYear = [];
    Object.keys(runningYearCounts).forEach((year) => {
        // Compute the average to 2 decimal places
        var aveRating = runningYearCounts[year].ratingSum / runningYearCounts[year].count;
        aveRating = Math.round(aveRating * 100) / 100;
        averageMovieRatingsByYear.push({'year': year, 'averating': aveRating});
        runningYearCounts[year].averating = aveRating;
    });
}

// Slide 2 - Build something very similar to slide 1, but add a second axis and ratings line
// TODO: Annotations
// TODO: Fix colors
// TODO: Change tick colors on line plot side & make that match the line color
// Could benefit from...
// - Adding zooming, especially on the second graph after toggle
// - Fixing the axes
// - Adding the text / analysis
function secondSlideBuilder() {
    resetGraphicsCanvas();
    updateSubtitleText(slide2Subtitle);
    updateDescriptionText(slide2Description);

    const noScatterPlotFunc = buildLineGraph;
    const scatterPlotFunc = (svgCanvas, xScale, rightYAxisScale, barMargin) => {
        buildLineGraph(svgCanvas, xScale, rightYAxisScale, barMargin);
        buildScatterMovieGraph(svgCanvas, xScale, rightYAxisScale, barMargin);
    };

    const svgCanvas = buildDefaultGraphSecondSlide(noScatterPlotFunc);
    addRightSvgAxis(svgCanvas, 'Average IMDB Movie Rating');
    const toggleDiv = document.getElementById('interactive_components');
    const toggler = document.createElement('button');
    const togglerTexts = [
        'Show individual movie ratings',
        'Show average movie ratings only'
    ]
    // By default, build something graph from part 1 with an extra axis and different tooltips
    // If the toggle button is selected, expand the graph to show individual movies, grouped by
    // year and ratings.
    toggler.innerText = togglerTexts[0];
    toggleDiv.append(toggler);
    toggler.onclick = () => {
        if(toggler.innerText === togglerTexts[0]){
            toggler.innerText = togglerTexts[1];
            buildDefaultGraphSecondSlide(scatterPlotFunc);
            addRightSvgAxis(svgCanvas, 'IMDB Movie Rating');
        } else {
            toggler.innerText = togglerTexts[0];
            buildDefaultGraphSecondSlide(noScatterPlotFunc);
            addRightSvgAxis(svgCanvas, 'Average IMDB Movie Rating');
        }
    }
}

function buildDefaultGraphSecondSlide(plotFunc) {
    resetGraphicsCanvas();
    // Create scales for the x axis (year) & y axis (number of released movies)
    const xScale = d3.scaleBand()
         .domain(d3.range(minYear, maxYear+1))
         .range([padAxisLeft, svgWidth - padAxisRight]);
    // Scale for Movie counter [bars]
    const leftYScale = d3.scaleLinear()
        .domain([0, maxYearCount])
        .range([padAxisTop, svgHeight - padAxisBottom]);
    // Scale for ratings [lines]
    const rightYScale = d3.scaleLinear()
        .domain([0, 10])
        .range([padAxisTop, svgHeight - padAxisBottom]);

    const barMargin = halfBarMarginPercent * xScale.bandwidth();
    // Populate the cleared svg with bar graph
    const svgCanvas = d3.select('#svg_canvas')
        .attr('height', svgHeight)
        .attr('width', svgWidth)

    const xAxisScale = d3.scaleBand()
        .domain(d3.range(minYear, maxYear+1))
        .range([padAxisLeft, svgWidth - padAxisRight]);
    const yAxisTranslate = svgHeight - padAxisTop;
    svgCanvas.append('g')
        .attr('transform', 'translate(0,'+yAxisTranslate+')')
        .call(d3.axisBottom(xAxisScale));

    // Left yAxis
    const leftYAxisScale = d3.scaleLinear()
        .domain([0, maxYearCount])
        .range([svgHeight - padAxisTop, padAxisBottom]);
    svgCanvas.append('g')
        .attr('transform', 'translate('+padAxisLeft+', 0)')
        .call(d3.axisLeft(leftYAxisScale));
    // Right yAxis
    const rightYAxisScale = d3.scaleLinear()
        .domain([0, 10])
        .range([svgHeight - padAxisTop, padAxisBottom]);
    svgCanvas.append('g')
        .attr('transform', 'translate('+(svgWidth - padAxisRight)+', 0)')
        .call(d3.axisRight(rightYAxisScale));

    const plotCanvas = svgCanvas.selectAll('plotviz')
        .data(years)
        .enter()
        .append('rect')
            .on('mouseover', function(d, i) {
                var toolTipHtml = 'Number of movies uploaded in ' + d.year + '<br>';
                toolTipHtml += d.count + '<br>';
                toolTipHtml += 'Average IMDB rating of uploaded movies: ' + runningYearCounts[d.year].averating;
                d3.select(this)
                    .style('opacity', 0.8)
                    .attr('fill', "#1CCAD8");
                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('left',(d3.event.pageX+5)+'px')
                    .style('top',(d3.event.pageY+5)+'px')
                    .style('position', 'absolute')
                    .style('text-align', 'center')
                    .style('background', 'white')
                    .style('border-style', 'solid')
                    .style('border-width', '1px')
                    .style('padding', '1px')
                    .html(
                        toolTipHtml
                    )
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .style('opacity', 1)
                    .attr('fill', "#199911");
                d3.select('#tooltip')
                    .style("opacity", 0)
            })
            .attr('x', (d) => {return xScale(d.year);})
            .attr('y', (d) => {return svgHeight - padAxisTop;})
            .attr('width', () => {
                return xScale.bandwidth() - barMargin;
            })
            .attr('height', (d) => {
                return 0;
            })
            .attr("fill", "#589991")

    plotFunc(svgCanvas, xScale, rightYAxisScale, barMargin);
    addDefaultSvgAxes(svgCanvas, 'Year Added to Netflix', 'Number of Movies');
    addPlotTransition(plotCanvas, leftYScale);
    return svgCanvas;
}

function addRightSvgAxis(svgCanvas, axisText) {
    svgCanvas.append("text")
        .attr("y", svgWidth - 12)
        .attr("x", - svgHeight/2 - 80)
        .attr("transform", "rotate(-90)")
        .text(axisText);
}

// Average line graph
function buildLineGraph(svgCanvas, xScale, rightYAxisScale, barMargin) {
    // Now build the line graph showing the ratings - start with the circles
    svgCanvas.selectAll('plotviz')
        .data(averageMovieRatingsByYear)
        .enter()
        .append('circle')
        .attr('cx', (d) => {
            var halfBarSize = (xScale.bandwidth() - barMargin) / 2;
            return halfBarSize+xScale(d.year);
        })
        .attr('cy', (d) => {return rightYAxisScale(d.averating);})
        .attr('r', 5);

    var line = d3.line()
        .x((d) => { 
            var halfBarSize = (xScale.bandwidth() - barMargin) / 2;
            return halfBarSize+xScale(d.year);
        })
        .y((d) => { 
            return rightYAxisScale(d.averating); }) // set the y values for the line generator 
    svgCanvas.append("path")
        .datum(averageMovieRatingsByYear)
        .attr("d", line)
        .attr("stroke", "black")
        .attr("fill", "none");
}

// Invidual movies - not just averages
function buildScatterMovieGraph(svgCanvas, xScale, rightYAxisScale, barMargin) {
    svgCanvas.selectAll('plotviz')
        .data(loadedData)
        .enter()
        .append('circle')
        .on('mouseover', function(d, i) {
            var toolTipHtml = 'Title: ' + d['Netflix Title'] + '<br>';
            toolTipHtml += 'IMDB Rating: ' + d['IMDB Rating'] + '<br>'
            toolTipHtml += 'Number of votes on IMDB: ' + d['Vote Count'] +'<br>'
            toolTipHtml += 'Release Year: ' + d['Release Year'] +'<br>'
            toolTipHtml += 'Number of votes on IMDB: ' + d['Vote Count'] +'<br>'
            toolTipHtml += 'Movie Category: ' + d['Category'] +'<br>'
            d3.select(this)
                .style('opacity', 0.4)
            d3.select('#tooltip')
                .style('opacity', 1)
                .style('left',(d3.event.pageX+5)+'px')
                .style('top',(d3.event.pageY+5)+'px')
                .style('position', 'absolute')
                .style('text-align', 'center')
                .style('background', 'white')
                .style('border-style', 'solid')
                .style('border-width', '1px')
                .style('padding', '1px')
                .html(toolTipHtml)
        })
        .on('mouseout', function(d) {
            d3.select(this)
                .style('opacity', 1)
            d3.select('#tooltip')
                .style("opacity", 0)
        })        
        .attr('cx', (d) => {
            var halfBarSize = (xScale.bandwidth() - barMargin) / 2;
            return halfBarSize+xScale(d['Year Added']);
        })
        .attr('cy', (d) => {
            return rightYAxisScale(d['IMDB Rating']);
        })
        .attr('r', 3);
}

//////////////////////////////////////////////////////////////////////////////////////////




























function suffixlessName(categoryName) {
    const lowerCat = categoryName.toLowerCase();
    const splitCat = lowerCat.split(' ');
    const splitAtAmpersandCat = lowerCat.split('&');
    const toTitleCase = (word) => { return word[0].toUpperCase() + word.substr(1).toLowerCase() };

    if((splitCat[splitCat.length - 1] === 'movie' || splitCat[splitCat.length - 1] === 'movies') && splitCat.length > 1) {
        // Keep everything up until the end, but leave movie off since everything is a movie
        var allExceptLast = splitCat.slice(0, -1);
        var titleCased = allExceptLast.map(toTitleCase);
        return titleCased.join(' ');
    } else if (splitAtAmpersandCat.length > 1){
        return toTitleCase(splitAtAmpersandCat[0]);
    } else {
        return categoryName;
    }
}

function buildCategoryList(data) {
    const categoryMap = {}
    data.forEach((d) => {
        d['Category'].split(',').forEach((unstrippedSubcategory) => {
            var subcategory = suffixlessName(unstrippedSubcategory.trim());
            if(subcategory in categoryMap) {
                categoryMap[subcategory] += 1;
            } else {
                categoryMap[subcategory] = 1;
            }
        });
    });
    categories = [{'category': 'Misc', 'count': 0}];
    miscCategories = [];
    Object.keys(categoryMap).forEach((category) => {
        // Only keep values over a small threshold, since the data has some mistakes
        if(categoryMap[category] < genreThresh) {
            delete categoryMap[category];
        }
    });
    // Finally, merge categories that are below the threshold. Otherwise, keep them.
    Object.keys(categoryMap).forEach((category) => {
        // Only keep values over a small threshold, since the data has some mistakes
        if(categoryMap[category] > otherCategoryThreshold * data.length) {
            categories.push({'category': category, 'count': categoryMap[category]});
        } else {
            // Update misc if the category is too small
            categories[0].count += categoryMap[category];
            miscCategories.push({'category': category, 'count': categoryMap[category]});
        }
    });
    categories = categories.sort((a, b) => (a.count > b.count) ? 1 : -1);
    maxCatCount = Math.ceil(d3.max(categories.map((d) => {return d.count}))/100.0) * 100;
}










// const svgCanvas = buildDefaultGraphSecondSlide(noScatterPlotFunc);
// addRightSvgAxis(svgCanvas, 'Average IMDB Movie Rating');
// const toggleDiv = document.getElementById('interactive_components');
// const toggler = document.createElement('button');
// const togglerTexts = [
//     'Show individual movie ratings',
//     'Show average movie ratings only'
// ]
// // By default, build something graph from part 1 with an extra axis and different tooltips
// // If the toggle button is selected, expand the graph to show individual movies, grouped by
// // year and ratings.
// toggler.innerText = togglerTexts[0];
// toggleDiv.append(toggler);
// toggler.onclick = () => {
//     if(toggler.innerText === togglerTexts[0]){
//         toggler.innerText = togglerTexts[1];
//         buildDefaultGraphSecondSlide(scatterPlotFunc);
//         addRightSvgAxis(svgCanvas, 'IMDB Movie Rating');
//     } else {
//         toggler.innerText = togglerTexts[0];
//         buildDefaultGraphSecondSlide(noScatterPlotFunc);
//         addRightSvgAxis(svgCanvas, 'Average IMDB Movie Rating');
//     }
// }
function thirdSlideBuilder() {
    resetGraphicsCanvas();
    updateSubtitleText(slide3Subtitle);
    updateDescriptionText(slide3Description);
    buildDefaultGraphThirdSlide();

    const toggleDiv = document.getElementById('interactive_components');
    const toggler = document.createElement('button');
    const togglerTexts = [
        'Show Movie Counts for Top Ten Netflix Categories',
        'Explore Invidual Netflix Categories By Year Added'
    ];

    toggler.innerText = togglerTexts[0];
    toggleDiv.append(toggler);
    toggler.onclick = () => {
        if(toggler.innerText === togglerTexts[0]){
            toggler.innerText = togglerTexts[1];
            buildDefaultGraphSecondSlide((x, y, z, q) => {});
        } else {
            toggler.innerText = togglerTexts[0];
            buildDefaultGraphThirdSlide();
        }
    }

}




// Slide 3 - interactive slide config and visualization
function buildDefaultGraphThirdSlide() {
    resetGraphicsCanvas();
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(categories.map((d) => {return d.category}));

    const xScale = d3.scaleBand()
        .domain(categories.map((d) => {return d.category}))
        .range([padAxisLeft, svgWidth - padAxisRight]);

    const yScale = d3.scaleLinear()
        .domain([0, maxCatCount])
        .range([padAxisTop, svgHeight - padAxisBottom]);
    const barMargin = halfBarMarginPercent * xScale.bandwidth();
    
    // Populate the cleared svg with bar graph
    const svgCanvas = d3.select('#svg_canvas')
        .attr('height', svgHeight)
        .attr('width', svgWidth)

    const xAxisScale = d3.scaleBand()
        .domain(d3.range(0, categories.length))
        .range([padAxisLeft, svgWidth - padAxisRight]);
    const yAxisTranslate = svgHeight - padAxisTop + 50;
    svgCanvas.append('g')
        .attr('transform', 'translate(0,'+(svgHeight - padAxisTop)+')')
        .call(d3.axisBottom(xAxisScale)
        .tickFormat((d) => {
            return categories[d].category;
        }))
        .selectAll('text');

    const yAxisScale = d3.scaleLinear()
        .domain([0, maxCatCount])
        .range([svgHeight - padAxisTop, padAxisBottom]);
    svgCanvas.append('g')
        .attr('transform', 'translate('+padAxisLeft+', 0)')
        .call(d3.axisLeft(yAxisScale))
    svgCanvas.append('g')
        .attr("class", "gridline")
        .attr('transform', 'translate('+padAxisLeft+', 0)')
        .call(d3.axisLeft(yAxisScale)
        .tickSize(-1 * (svgWidth - padAxisLeft - padAxisRight))
        .tickFormat(""))

    const plotCanvas = svgCanvas.selectAll('plotviz')
        .data(categories)
        .enter()
        .append('rect')
            .on('mouseover', function(d, i) {
                d3.select(this)
                    .style('opacity', 0.6)
                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('left',(d3.event.pageX+5)+'px')
                    .style('top',(d3.event.pageY+5)+'px')
                    .style('position', 'absolute')
                    .style('text-align', 'center')
                    .style('background', 'white')
                    .html(d.year)
                var toolTipHtml = 'Category: ' + d.category + '<br>';
                toolTipHtml += 'Count: ' + d.count + '<br>';
                // If we are display miscellaneous, add all the categories beneath it to the tooltip
                if(d.category === 'Misc') {
                    toolTipHtml += '[Includes The Following]' + '<br>';
                    miscCategories.forEach((miscCat) => {
                        toolTipHtml += '- ' + miscCat.category + ' (count: ' + miscCat.count + ')<br>'
                    })
                }

                d3.select(this)
                    .style('opacity', 0.4)
                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('left',(d3.event.pageX+5)+'px')
                    .style('top',(d3.event.pageY+5)+'px')
                    .style('position', 'absolute')
                    .style('text-align', 'center')
                    .style('background', 'white')
                    .style('border-style', 'solid')
                    .style('border-width', '1px')
                    .style('padding', '1px')
                    .html(toolTipHtml)

            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .style('opacity', 1)
                    .attr('fill', colorScale(d.category));
                d3.select('#tooltip')
                    .style("opacity", 0)
            })
            .attr('x', (d, i) => {
                return xScale(d.category);
            })
            .attr('y', (d) => {return svgHeight - padAxisTop;})
            .attr('width', () => {
                return xScale.bandwidth() - barMargin;
            })
            .attr('height', (d) => {
                return 0;
            })
            .attr("fill", (d) => {
                return colorScale(d.category);
            })

 
    addDefaultSvgAxes(svgCanvas, 'Netflix Movie Categories', 'Number of Movies Offered');

    plotCanvas.transition()
        .attr('y', (d) => {
            return svgHeight - yScale(d.count);
        })
        .attr('height', (d) => {
            return yScale(d.count) - padAxisTop;
        })
        .duration(750)            

}





// Common Slide Setup
function configurePageInteractivity() {
    d3.json("https://raw.githubusercontent.com/abrooks6/NetflixNarrative/master/data/rated_netflix_movies.json")
    .then((data) => {
        loadedData = data;
        buildYearList(data);
        buildCategoryList(data);
        buildMovieRatingLists(data);
        dynamicallyPopulateButtons();
    })
    .catch((error) => {
        console.error(error);
    });
}

function dynamicallyPopulateButtons() {
    console.log('    Starting to populate buttons based on slidecontent');
    const buttonDiv = document.getElementById('button_panel');
    slides.forEach((slideInfo, idx) => {
        var slideButton = document.createElement("button");
        slideButton.innerText = (idx + 1).toString();
        // Add a callback to the button to update the subtitle / text / slideinfo
        // that is presented when clicked. We also wrap emphasis calls to the button
        // callback to highlight only the selected button at any given time.
        slideButton.onclick = () => {
            clearInteractiveComponents();
            emphasizeButton(idx);
            slideInfo.populator();
        }
        buttonDiv.append(slideButton);
        // Add the button to the slide info so that we can highlight as needed
        slideInfo.button = slideButton;
    })
    // Set the first slide as the "default slide"
    slides[0].populator()
    slides[0].button.className = 'selectedButton';
}

window.onload = configurePageInteractivity;

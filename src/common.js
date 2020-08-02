var loadedData = null;
var years = null;
var categories = null;
var unfilteredCategories = null;
var categoryYearMap = null;
var miscCategories = null;
var averageMovieRatingsByYear = null;
var runningYearCounts = null;
// // get the min & max of the year data
var minYear = null;
var maxYear = null;
var maxYearCount = null;

const slides = [
    { 'populator': firstSlideBuilder },
    { 'populator': secondSlideBuilder },
    { 'populator': thirdSlideBuilder }
]


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
var introSlideText = 'This narrative is an interactive slideshow focused on the quality of movies uploaded to the Netflix platform.'
+ ' Each slide focuses on a different desirable quality of a well-balanced streaming service.'

+ ' We begin by examining how frequently new content is uploaded to Netflix.'
+ ' In order to retain customers, a streaming service must upload high-quality content frequently.'
+ ' This is especially valuable if the content is exlusive to the platform.'

+ ' Next, we investigate the quality of the uploaded movies every year.'
+ ' This is accomplished by pairing the list of Netflix movies with IMDB ratings.'

+ ' Lastly, we dig into the diversity of the content uploaded to Netflix.'
+ ' We show a breakdown of the most prevalent movie genres on the platform and illustrate how frequently new content is uploaded per genre.'

var slide1Description = 'Netflix has long been known for offering a wide variety of movies on their streaming service.'
+ ' In recent years, many companies like Disney, Amazon, and Hulu have entered the streaming space as competitors.'
+ ' In order to stay ahead, streaming platforms must offer high-quality new content regularly.'
+ ' From a quantity perspective, Netflix has done an excellent job of adding a high volume of movies and expanding its platform to over 190 countries.'
+ ' It is important note that the data portrayed in the visualization below shows the movies uploaded to Netflix as of mid-January, 2020.'
+ ' That is, the movie uploads have not slowed down - the provided dataset is just a bit stale.'



const slide2Description = 'Customers of streaming services often seem to complain that the platforms lack high quality content.'
+ ' The figure above illustrates the IMDB ratings of movies uploaded to the platform over the years.'
+ ' The quality of the content seems to have stabilized over the last several years, which appears to be somewhat close to the expected average IMDB movie rating, based on a 2009 study.'
+ ' In this way, we see that while the movie quality on Netflix is not spectacularly above average, it isn\'t as poor as some jaded users might expect.'

const slide3Description = 'In the first slide, we saw some useful annotations focused on the growth of Netflix as a streaming platform.'
+ ' With such a large subscriber base one might rightfully expect that Netflix boasts a large selection for a wide variety of movie genres.'
+ ' However, it may come as a surprise that the category with the largest selection on the Netflix platform is Internation films.'
+ ' In fact, the majority of Netflix subscribers live are not from the United States.'


const introButtonText = 'Start the Slideshow!'
const slide1Subtitle = 'How Often Does Netflix Add New Movies?'
const slide2Subtitle = 'Is the Movie Quality on Netflix Consistent?'
const slide3Subtitle = 'What Genres of Movies are on Netflix?'

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
            .attr('y', (d) => {return svgHeight - leftYScale(d.count);})
            .attr('width', () => {
                return xScale.bandwidth() - barMargin;
            })
            .attr('height', (d) => {
                return leftYScale(d.count) - padAxisTop;
            })
            .attr("fill", "#589991")

    plotFunc(svgCanvas, xScale, rightYAxisScale, barMargin);
    addDefaultSvgAxes(svgCanvas, 'Year Added to Netflix', 'Number of Movies');
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
        return toTitleCase(splitAtAmpersandCat[0].trim());
    } else {
        return categoryName;
    }
}

function buildCategoryList(data) {
    const categoryMap = {};
    categoryYearMap = {};
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
    // Maintain one list of all category objects - too many to display well at once here
    unfilteredCategories = [];
    // ...And another where categories are condensed
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
        unfilteredCategories.push({'category': category, 'count': categoryMap[category]});
        // Only keep values over a small threshold, since the data has some mistakes
        if(categoryMap[category] > otherCategoryThreshold * data.length) {
            categories.push({'category': category, 'count': categoryMap[category]});
        } else {
            // Update misc if the category is too small
            categories[0].count += categoryMap[category];
            miscCategories.push({'category': category, 'count': categoryMap[category]});
        }
    });

    // Now let's also populate a category -> year population map
    unfilteredCategories.map((ucat) => {return ucat.category}).forEach((category) => {
        categoryYearMap[category] = {}
    });
    data.forEach((d) => {
        var currentYear = d['Year Added']
        d['Category'].split(',').forEach((unstrippedSubcategory) => {
            var subcategory = suffixlessName(unstrippedSubcategory.trim());
            try {
                if(currentYear in categoryYearMap[subcategory]) {
                    categoryYearMap[subcategory][currentYear] += 1;
                } else {
                    categoryYearMap[subcategory][currentYear] = 1;
                }
            } catch(err) {}
        });
    });
    unfilteredCategories = unfilteredCategories.sort((a, b) => (a.count > b.count) ? -1 : 1);
    categories = categories.sort((a, b) => (a.count > b.count) ? 1 : -1);
    maxCatCount = Math.ceil(d3.max(categories.map((d) => {return d.count}))/100.0) * 100;
}

// In the interactive components section, build a hover & select drop down menu showing every
// category. These are raw category values - there's no grouping into misc here. When a category
// is selected, update the visualization's stack plot.
function initializeUnfiltedCategoryStackFilter() {
    const updateMenu = document.getElementById('updateMenu');
    const catButtons = [];
    updateMenu.innerText = 'Movie type';
    // Create a button that has an onhover event to show an invisble 
    unfilteredCategories.forEach((cat) => {
        var catButton = document.createElement('button');
        catButtons.push(catButton);
        catButton.innerText = cat.category;
        updateMenu.append(catButton)        
    });
    catButtons.forEach((catButton, idx) => {
        catButton.onclick = () => emphasizeCatButtonAtIndex(catButtons, idx);
        if(idx === 0) {
            catButton.onclick();
            catButton.className = 'selectedButton';
        }
    });
}


function emphasizeCatButtonAtIndex(catButtons, idx) {
    catButtons.forEach((c, i) => {
        if(i === idx) {
            catButtons[i].className = 'selectedButton';
            buildDefaultGraphThirdSlide(unfilteredCategories[i].category, categoryYearMap[unfilteredCategories[i].category]);
        } else {
            catButtons[i].className = '';
        }
    });
}

function clearUpdateMenu() {
    const updateMenu = document.getElementById('updateMenu');
    updateMenu.innerHTML = '';
}

function thirdSlideBuilder() {
    resetGraphicsCanvas();
    initializeUnfiltedCategoryStackFilter();
    updateSubtitleText(slide3Subtitle);
    updateDescriptionText(slide3Description);
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
            clearUpdateMenu();
            toggler.innerText = togglerTexts[1];
            buildAlternateGraphThirdSlide();
        } else {
            initializeUnfiltedCategoryStackFilter();
            toggler.innerText = togglerTexts[0];
        }
    }

}




// Slide 3 - interactive slide config and visualization
function buildDefaultGraphThirdSlide(focusCategory, yearsFocusCategoryAdded) {
    resetGraphicsCanvas();
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



        const focusData = Object.keys(yearsFocusCategoryAdded).map((year) => {
            return {'year': parseInt(year), 'count': yearsFocusCategoryAdded[year]}
        });

    const plotCanvas = svgCanvas.selectAll('plotviz')
        .data(focusData)
        .enter()
        .append('rect')
        .attr('x', (d) => {return xScale(d.year);})
        .attr('y', (d) => {return svgHeight - padAxisTop;})
        .attr('width', () => {
            return xScale.bandwidth() - barMargin;
        })
        .attr('height', (d) => {
            return 0;
        })
        .attr('fill', '#587291')
        .attr('stroke', '#587291')
        .attr('opacity', 1)

    svgCanvas.selectAll('plotviz')
        .data(years)
        .enter()
        .append('rect')
            .on('mouseover', function(d, i) {
                var toolTipHtml = 'Number of Movies Uploaded in ' + d.year + ': ' + d.count + '<br>'
                toolTipHtml += 'Number of Uploaded ' + focusCategory + ' Movies: ' + focusData[i].count;
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
                d3.select('#tooltip')
                    .style("opacity", 0)
            })
            .attr('x', (d) => {return xScale(d.year);})
            .attr('y', (d) => {return svgHeight - yScale(d.count);})
            .attr('width', () => {
                return xScale.bandwidth() - barMargin;
            })
            .attr('height', (d) => {
                return yScale(d.count) - padAxisTop;
            })
            .attr('fill', '#587291')
            .attr('stroke', '#587291')
            .attr('opacity', .4)

    addPlotTransition(plotCanvas, yScale);
        
    addDefaultSvgAxes(svgCanvas, 'Year added to Netflix', 'Number of Movies');
}

function buildAlternateGraphThirdSlide() {
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
        .duration(750);
}



// Common Slide Setup
function configurePageInteractivity() {
    d3.json("https://raw.githubusercontent.com/abrooks6/NetflixNarrative/master/data/rated_netflix_movies.json")
    .then((data) => {
        loadedData = data;
        buildYearList(data);
        buildCategoryList(data);
        buildMovieRatingLists(data);
        buildIntroSlide();        
    })
    .catch((error) => {
        console.error(error);
    });
}
/* Build the intro slide - this is the first page the user will see. */
function buildIntroSlide() {
    const buttonDiv = document.getElementById('button_panel');
    const startButton = document.createElement('button');
    startButton.innerText = introButtonText;
    updateDescriptionText(introSlideText);
    startButton.onclick = () => {
        buttonDiv.innerHTML = '';
        dynamicallyPopulateButtons();
        slides[0].populator();
        slides[0].button.className = 'selectedButton';
    }
    buttonDiv.append(startButton);
}

/* Build */
function dynamicallyPopulateButtons() {
    const buttonDiv = document.getElementById('button_panel');
    clearInteractiveComponents();
    slides.forEach((slideInfo, idx) => {
        var slideButton = document.createElement("button");
        slideButton.innerText = (idx + 1).toString();
        // Add a callback to the button to update the subtitle / text / slideinfo
        // that is presented when clicked. We also wrap emphasis calls to the button
        // callback to highlight only the selected button at any given time.
        slideButton.onclick = () => {
            clearInteractiveComponents();
            clearUpdateMenu();            
            emphasizeButton(idx);
            slideInfo.populator();
        }
        buttonDiv.append(slideButton);
        // Add the button to the slide info so that we can highlight as needed
        slideInfo.button = slideButton;
    });
}

window.onload = configurePageInteractivity;

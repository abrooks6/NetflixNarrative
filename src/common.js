
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
const padAxisRight = 20;
const genreThresh = 5;

// Subtitles & Text
const slide1Subtitle = 'How Often Does Netflix Add New Movies?'
const slide2Subtitle = 'What Genres of Movies are on Netflix?'
const slide1Description = 'Netflix has long been known for offering a wide variety of movies on their streaming service. In recent years, many companies like Disney, Amazon, and Hulu have entered the streaming space as competitors. In order to stay ahead, streaming platforms must offer high-quality new content regularly. From a quantity perspective, Netflix has done an excellent job of adding a high volume of movies and expanding its platform to over 190 countries. It is important note that the data portrayed in the visualization below shows the movies uploaded to Netflix as of mid-January, 2020.'
const slide2Description = 'Netflix has an extremely diverse selection. [EXPLAIN MORE]'

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
    resetGraphicsCanvas()
    updateSubtitleText(slide1Subtitle)
    updateDescriptionText(slide1Description)
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
                    .html(d.year)
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
    
    plotCanvas.transition()
        .attr('y', (d) => {
            return svgHeight - yScale(d.count);
        })
        .attr('height', (d) => {
            return yScale(d.count) - padAxisTop;
        })
        .duration(750)

    // TODO: ADD CATEGORY BREAKDOWN
    // TODO: ADD ANNOTATIONS
    // TODO: [POPULATE TOOLTIPS WITH WHAT THEY REALLY SHOULD BE]
}

// Populate info needed for slide 2
function buildCategoryList(data) {
    const categoryMap = {}
    data.forEach((d) => {
        d['Category'].split(',').forEach((unstrippedSubcategory) => {
            var subcategory =unstrippedSubcategory.trim()
            if(subcategory in categoryMap) {
                categoryMap[subcategory] += 1;
            } else {
                categoryMap[subcategory] = 1;
            }
        });
    });
    categories = [];
    Object.keys(categoryMap).forEach((category) => {
        // Only keep values over a small threshold, since the data has some mistakes
        if(categoryMap[category] > genreThresh) {
            categories.push({'category': category, 'count': categoryMap[category]});
        }
    });
    categories = categories.sort((a, b) => (a.count > b.count) ? 1 : -1);
    maxCatCount = Math.ceil(d3.max(categories.map((d) => {return d.count}))/100.0) * 100;
}

// Slide 2 - interactive slide config and visualization
// TODO: Make me transition
function secondSlideBuilder() {
    resetGraphicsCanvas()
    updateSubtitleText(slide2Subtitle)
    updateDescriptionText(slide2Description)  
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
        .attr('transform', 'translate(-16,'+yAxisTranslate+')')
        .call(d3.axisBottom(xAxisScale)
        .tickFormat((d) => {
            return categories[d].category;
        }))
        .selectAll('text')
        .attr("transform", "rotate(-90)");
                


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

    plotCanvas.transition()
        .attr('y', (d) => {
            return svgHeight - yScale(d.count);
        })
        .attr('height', (d) => {
            return yScale(d.count) - padAxisTop;
        })
        .duration(750)            

}


















// Slide 3 - interactive slide config and visualization
// TODO: Make me transition
function thirdSlideBuilder() {
    resetGraphicsCanvas();
}

// Common Slide Setup
function configurePageInteractivity() {
    d3.json("https://raw.githubusercontent.com/abrooks6/NetflixNarrative/master/data/rated_netflix_movies.json")
    .then((data) => {
        loadedData = data;
        buildYearList(data);
        buildCategoryList(data);
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

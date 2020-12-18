let ctx = {
  w: 600,
  h: 600,
  currentSection: 0,
  currentProgress: 1,
  setupDone: false,
  sectionTransition: 500, // in ms
  showCC: false, // for the carbon capture section
};

function setupVis() {
  let svg = d3.select('#vis')
              .append('svg')
              .attr('viewBox', [0, 0, ctx.w, ctx.h]);
  intro();
  section1();
  section2();
  section3();
  ctx.setupDone = true;
  // Setup scroller
  let scroll = scroller().container(d3.select('#dual'));
  // Setup events before calling `scroll` to receive info about starting position
  scroll.on('active', onActive);
  scroll.on('progress', onProgress);
  scroll(d3.selectAll('.step'));

}

// setup and update the introduction visualisation
function intro() {
  let hmargin = 25;
  let vmargin = 25;
  let vboxW = 600;
  let vboxH = 400;

  // x scale
  let xScale = d3.scaleBand()
                 .domain(history.map(d => d.year))
                 .range([hmargin, vboxW - 2*hmargin])
                 .padding(0.2); // padding in %
  // y scale
  let yScale = d3.scaleLinear()
                 .domain([0, 1.1 * d3.max(history, d => d.totalCo2)])
                 .range([vboxH - vmargin, vmargin]);
  // Color scale
  let keys = ['scope1', 'scope2', 'scope3']
  let color = d3.scaleOrdinal()
                .domain(keys)
                .range(d3.schemeSpectral[3]);

  // --- SETUP ---
  if(!ctx.setupDone) {
    let co2Hist = d3.select('#co2Hist').append('svg')
                    .attr('viewBox', [0, 0, vboxW, vboxH]);
    // X axis
    co2Hist.append("g")
           .attr("class", "xAxis")
           .attr("transform",
                 `translate(0, ${vboxH - vmargin})`)
           .call(d3.axisBottom(xScale).ticks(5));
    // Y axis
    co2Hist.append("g")
           .attr("class", "yAxis")
           .attr("transform",
                 `translate(${hmargin}, 0)`)
           .call(d3.axisLeft(yScale).ticks(10));
    // y axis unit
    co2Hist.append("text")
          .attr('x', 0)
          .attr('y', vmargin - 5)
          .attr('font-size', 8)
          .html("kgCO2 / t-cem");
    // Legend
    let legend = co2Hist.append('g')
                        .classed('legend', true)
                        .attr("transform",
                              `translate (${vboxW - 200}, ${vmargin})`);
    legend.selectAll('text')
          .data(keys)
          .join('text')
            .attr('x', 40)
            .attr('y', (d,i) => i*19 + 19)
            .attr('font-size', 12)
            .text(d => scope2text(d));
    legend.selectAll('rect')
          .data(keys)
          .join('rect')
            .attr('x', 0)
            .attr('y', (d,i) => i*19 + 9)
            .attr('width', 30)
            .attr('height', 12)
            .attr('fill', d => color(d));
  }

  // --- UPDATE ---
  let co2Hist = d3.select('#co2Hist').select('svg');
  // The .map below allows us to show "Scope 1" or "Scope 2"
  let stackedCo2 = d3.stack()
                     .keys(keys)(history)
                     .map(d => (d.forEach(v => v.key = d.key), d));
  // TODO: proper tooltips
  co2Hist.selectAll("g.stacked")
         .data(stackedCo2)
         .join("g")
           .classed("stacked", true)
           .attr("fill", d => color(d.key))
         .selectAll("rect")
         .data(d => d)
         .join("rect")
           .attr("x", (d,i) => xScale(d.data.year))
           .attr('y', d => yScale(d[1]))
           .attr('height', d => yScale(d[0]) - yScale(d[1]))
           .attr('width', xScale.bandwidth())
           .on('mouseenter', function (d,i) { this.setAttribute('opacity', 0.7) })
           .on('mouseleave', function (d,i) { this.setAttribute('opacity', 1) } )
         .append('title')
         .text(d =>
           'Total: ' + Math.round(d.data['totalCo2']) + ' kgCO2 / t-cim \n' +
           scope2text(d.key) + ': ' + Math.round(d.data[d.key]) + ' kgCO2 / t-cim'
         );
}

function section1() {
  let vpadding = 80;
  let hpadding = 80;
  let axisSize = 20;
  let titleSize = 25;

  let svg = d3.select('#vis')
              .select('svg');

  // === [FUEL MIX BAR CHART] ===
  let keys = ['fossil', 'alt', 'biomass'];
  let groups = ['After', 'Before']

  // X scale
  let xScale = d3.scaleLinear()
                 .domain([0, 1])
                 .range([hpadding, ctx.w - hpadding]);
  // Y scale
  let yScale = d3.scaleBand()
                 .domain(groups)
                 .range([(ctx.h - vpadding)/2, vpadding])
                 .padding(0.2);
  // Color scale
  let color = d3.scaleOrdinal()
                 .domain(keys)
                 .range(d3.schemeSpectral[6]);
  // --- SETUP ---
  if(!ctx.setupDone) {
    // X axis
    svg.append("g")
      .classed("xAxis", true)
      .attr("transform",
            `translate(0, ${(ctx.h - vpadding)/2})`)
      .call(d3.axisBottom(xScale).ticks(10, '%'))
      .classed('s1', true);
    // Y axis
    svg.append('g')
      .classed('yAxis', true)
      .attr('transform',
            `translate(${hpadding}, 0)`)
      .call(d3.axisLeft(yScale))
      .classed('s1', true);
    // Legend
    let legend = svg.append('g')
                    .classed('legend', true)
                    .attr('transform',
                        `translate(200, 50)`);
    legend.selectAll('rect')
          .data(keys)
          .join('rect')
            .attr('x', (d,i) => 100*i)
            .attr('y', 0)
            .attr('width', 30)
            .attr('height', 12)
            .attr('fill', d => color(d))
            .classed('s1', true);

    legend.selectAll('text')
          .data(keys)
          .join('text')
            .attr('x', (d,i) => 35 + 100*i)
            .attr('y', 10)
            .attr('font-size', 12)
            // Capitalize first letter
            .text(d => d.replace(/^\w/, c => c.toUpperCase()))
            .classed('s1', true);
  }
  // --- UPDATE ---
  // Normalized bar chart for fuel composition
  let fuelMix = [ {fossil: 1 - fuelSubst.altFinal - fuelSubst.biomassFinal, alt: fuelSubst.altFinal, biomass: fuelSubst.biomassFinal},
                  {fossil: plant.fuelMixCoal, alt: plant.fuelMixAlt, biomass: plant.fuelMixBiomass},];
  let stackedMix = d3.stack().keys(keys)(fuelMix);
  // Stacked bars
  svg.selectAll('g.fuelMix')
     .data(stackedMix)
     .join('g')
       .classed('fuelMix', true)
       .attr('fill', d => color(d.key))
     .selectAll('rect')
     .data(d => d)
     .join('rect')
       .classed('s1', true)
       .attr('x', d => xScale(d[0]) + 1)
       .attr('y', (d,i) => yScale(groups[i]))
       .attr('width', d => xScale(d[1]) - xScale(d[0]))
       .attr('height', yScale.bandwidth());

  // === [FUEL MIX CO2 IMPACT] ===
  // TODO: Put everything into a <g> element
  keys = ['scope1', 'scope2', 'scope3'];
  labels = ['Before', 'After', '2050 with', '2050 without'];
  let altHist = altHistory(fuelSubst)
  let data = [history[0], history[1], history[history.length - 1], altHist[altHist.length-1]];
  data.forEach((d,i) => d.label = labels[i]);
  let stacked = d3.stack().keys(keys)(data);
  // x scale
  xScale = d3.scaleBand()
             .domain(labels)
             .range([hpadding, ctx.w - hpadding])
             .padding(0.2);
  // y scale
  yScale = d3.scaleLinear()
             .domain([0, d3.max(data, d => d.totalCo2)])
             .range([ctx.h/2 - vpadding, vpadding/2]);
  // color scale
  color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeSpectral[3]);
  // --- Setup ---
  if(!ctx.setupDone) {
    // x axis
    svg.append('g')
       .classed('xAxis', true)
       .attr('transform',
            `translate(0, ${ctx.h - vpadding})`)
       .call(d3.axisBottom(xScale))
       .classed('s1', true);
    // y axis
    svg.append('g')
       .classed('yAxis', true)
       .attr('transform',
            `translate(${hpadding}, ${ctx.h / 2})`)
       .call(d3.axisLeft(yScale))
       .classed('s1', true);
  }
  // --- Update ---
  svg.selectAll('g.fuelSubstCo2')
     .data(stacked)
     .join('g')
       .classed('fuelSubstCo2', true)
       .classed('s1', true)
       .attr('fill', d => color(d.key))
       .attr('transform',
            `translate (0, ${ctx.h / 2})`)
     .selectAll('rect')
     .data(d => d)
     .join('rect')
       .classed('s1', true)
       .attr('x', (d,i) => xScale(d.data.label))
       .attr('y', d => yScale(d[1]))
       .attr('height', d => yScale(d[0]) - yScale(d[1]))
       .attr('width', xScale.bandwidth());
}

function section2() {
  let vpadding = 80;
  let hpadding = 80;
  let axisSize = 20;
  let titleSize = 25;

  let svg = d3.select('#vis').select('svg')

  // === [CEMENT MIX BAR CHART] ===
  let keys = ['filler', 'clinker', 'scm']
  let data = [{ clinker: history[history.length-1].clinkerRatio,
                filler: 1-plant.clinkerRatio, // note: should sum to 1
                scm: clinkerSubst.substRate},
              { clinker: plant.clinkerRatio,
                filler: 1-plant.clinkerRatio,
                scm: 0 }];
  let groups = ['After', 'Before']

  // x scale
  let xScale = d3.scaleLinear()
                 .domain([0, 1])
                 .range([hpadding, ctx.w - hpadding]);
  // y scale
  let yScale = d3.scaleBand()
                 .domain(groups)
                 .range([ctx.h / 2 - vpadding/2, vpadding])
                 .padding(0.2);
  // color scale
  // slice is needed to copy the scheme array to prevent side effects from reversing
  let color2 = d3.scaleOrdinal()
                .domain(keys)
                .range(d3.schemeSpectral[6].slice().reverse());
  // --- SETUP ---
  if(!ctx.setupDone) {
    // x axis
    svg.append('g')
       .classed('xAxis', true)
       .attr('transform',
             `translate(0, ${(ctx.h - vpadding)/2})`)
       .call(d3.axisBottom(xScale).ticks(10, '%'))
       .classed('s2', true);
    // y axis
    svg.append('g')
       .classed('yAxis', true)
       .attr('transform',
            `translate(${hpadding}, 0)`)
       .call(d3.axisLeft(yScale))
       .classed('s2', true);
    // Legend
    let legend = svg.append('g')
                    .classed('legend', true)
                    .attr('transform',
                         `translate(200, 50)`);
    legend.selectAll('rect')
          .data(keys)
          .join('rect')
            .attr('x', (d,i) => 100*i)
            .attr('y', 0)
            .attr('width', 30)
            .attr('height', 12)
            .attr('fill', d => color2(d))
            .classed('s2', true);
    legend.selectAll('text')
          .data(keys)
          .join('text')
            .attr('x', (d,i) => 35 + 100*i)
            .attr('y', 10)
            .attr('font-size', 12)
            // Capitalize first letter
            .text(d => d.replace(/^\w/, c => c.toUpperCase()))
            .classed('s2', true);
  }

  // --- UPDATE ---
  // Normalized bar chart for cement mix
  let stacked = d3.stack().keys(keys)(data);
  console.log('Logging data');
  console.log(data);
  console.log('Logging stacked');
  console.log(stacked);
  svg.selectAll('g.cementMix')
     .data(stacked)
     .join('g')
       .classed('cementMix', true)
       .attr('fill', d => color2(d.key))
    .selectAll('rect')
    .data(d => d)
    .join('rect')
      .classed('s2', true)
      .attr('x', d => xScale(d[0]) + 1)
      .attr('y', (d,i) => yScale(groups[i]))
      .attr('width', d => xScale(d[1]) - xScale(d[0]))
      .attr('height', yScale.bandwidth());

  // === [CLINKER SUBST CO2 IMPACT] ===
  keys = ['scope1', 'scope2', 'scope3'];
  labels = ['Before', 'After', '2050 with', '2050 without'];
  techIdx = technologies.indexOf(clinkerSubst);
  let altHist = altHistory(clinkerSubst);
  data = [history[techIdx], history[techIdx+1], history[history.length - 1], altHist[altHist.length-1]];
  data.forEach((d,i) => d.label = labels[i]);
  stacked = d3.stack().keys(keys)(data);
  // x scale
  xScale = d3.scaleBand()
             .domain(labels)
             .range([hpadding, ctx.w - hpadding])
             .padding(0.2);
  // y scale
  yScale = d3.scaleLinear()
             .domain([0, d3.max(data, d => d.totalCo2)])
             .range([ctx.h/2 - vpadding, vpadding/2]);
  // color scale
  color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeSpectral[3]);
  // --- Setup ---
  if(!ctx.setupDone) {
    // x axis
    svg.append('g')
       .classed('xAxis', true)
       .attr('transform',
            `translate(0, ${ctx.h - vpadding})`)
       .call(d3.axisBottom(xScale))
       .classed('s2', true);
    // y axis
    svg.append('g')
       .classed('yAxis', true)
       .attr('transform',
            `translate(${hpadding}, ${ctx.h / 2})`)
       .call(d3.axisLeft(yScale))
       .classed('s2', true);
  }
  // --- Update ---
  svg.selectAll('g.clinkerSubstCo2')
     .data(stacked)
     .join('g')
       .classed('clinkerSubstCo2', true)
       .classed('s2', true)
       .attr('fill', d => color(d.key))
       .attr('transform',
            `translate (0, ${ctx.h / 2})`)
     .selectAll('rect')
     .data(d => d)
     .join('rect')
       .classed('s2', true)
       .attr('x', (d,i) => xScale(d.data.label))
       .attr('y', d => yScale(d[1]))
       .attr('height', d => yScale(d[0]) - yScale(d[1]))
       .attr('width', xScale.bandwidth());
}

function section3() {
  let vpadding = 80;
  let hpadding = 80;
  let axisSize = 20;
  let titleSize = 25;
  let pieHeight = (ctx.h - 3*vpadding) / 2;

  let svg = d3.select('#vis').select('svg');

  // === CO2 IMPACTS PIE CHART ===
  let data = getAllImpacts();
  if(!ctx.toggleCC) { data.pop(); }
  data = data.map((d,i) => { return { name: technologies[i].name, impact: -d.totalCo2 } });
  console.log('Logging pie chart data');
  console.log(data);

  let pie = d3.pie().value(d => d.impact)
  let arcs = pie(data);
  console.log('Logging arcs');
  console.log(arcs);
  let arcGen = d3.arc().innerRadius(10).outerRadius(pieHeight / 2 - 1);
  let arcLabel = d3.arc().innerRadius(0.6 * pieHeight / 2 ).outerRadius(0.6 * pieHeight / 2);
  let color = d3.scaleOrdinal()
                .domain(data.map(d => d.name))
                .range(d3.schemeTableau10);
  // --- Setup ---
  if(!ctx.setupDone) {
    svg.append('g')
         .attr('stroke', 'white')
         .attr('transform',
              `translate(${ctx.w / 2}, ${ctx.h / 4})`)
         .attr('id', 'pieCC');
    svg.append('g')
         .attr('font-size', 8)
         .attr('font-family', 'sans-serif')
         .attr('text-anchor', 'middle')
         .attr('transform',
              `translate(${ctx.w /2}, ${ctx.h / 4})`)
         .attr('id', 'pieCCtext');
  }
  // --- Update ---
  svg.select('g#pieCC')
     .selectAll('path')
     .data(arcs)
     .join('path')
       .attr('fill', d => color(d.data.name))
       .attr('d', arcGen)
       .classed('s3', true)
  // Needed to ensure that if someone reloads page in CC section and toggles
  // CC impact in the pie chart, the new arc does not appear with opacity 0
       .style('opacity', ctx.setupDone? 1 : 0);
  svg.select('g#pieCCtext')
     .selectAll('text.pieName')
     .data(arcs)
     .join('text')
        .attr('transform', d =>
              `translate(${arcLabel.centroid(d)})`)
        .attr('font-weight', 'bold')
        .text(d => d.data.name)
        .classed('pieName', true)
        .classed('s3', true)
        .style('opacity', ctx.setupDone? 1 : 0);
  svg.select('g#pieCCtext')
     .selectAll('text.pieValue')
     .data(arcs)
  // TODO: add animation when adding new section by differentiating between enter and update;
     .join('text')
        .attr('transform', d =>
              `translate(${arcLabel.centroid(d)})`)
        .attr('y', '1em')
        .text(d => Math.round(d.data.impact) + 'kgCO2/t-cim')
        .classed('pieValue', true)
        .classed('s3', true)
        .attr('fill-opacity', 0.7)
        .style('opacity', ctx.setupDone? 1 : 0);

  // === [CC OPEX COMPARISON BAR CHART] ===
  let deltaClink = history[history.length-1].opexClinker - history[history.length-2].opexClinker;
  deltaClink /= history[history.length-2].opexClinker;
  let deltaCimWithSubst = history[history.length-1].opexCement - history[history.length-2].opexCement;
  deltaCimWithSubst /= history[history.length-2].opexCement;
  let altHist = altHistory(clinkerSubst);
  let deltaCimWithoutSubst = altHist[altHist.length-1].opexCement - altHist[altHist.length-2].opexCement;
  deltaCimWithoutSubst /= altHist[altHist.length-2].opexCement;

  let opexData = [{ name: 'Clinker price increase', value: deltaClink, type: 'clinker'},
                  { name: 'Cement price increase', value: deltaCimWithSubst, type:'cement' },
                  { name: 'Cement price w/o clinker subst.', value: deltaCimWithoutSubst, type:'cement' }];

  xScale = d3.scaleBand()
             .domain(opexData.map(d => d.name))
             .range([hpadding, ctx.w-hpadding])
             .padding(0.2);
  yScale = d3.scaleLinear()
             .domain([0, 1.3*d3.max(opexData, d => d.value)])
             .range([ctx.h/2-vpadding, vpadding/2]);
  color = d3.scaleOrdinal()
            .domain(opexData.map(d => d.type))
            .range(d3.schemeSet1)
  if(!ctx.setupDone) {
    svg.append('g')
       .classed('xAxis', true)
       .attr('transform',
             `translate(0, ${ctx.h - vpadding})`)
       .call(d3.axisBottom(xScale))
       .classed('s3', true);
    svg.append('g')
       .classed('yAxis', true)
       .attr('transform',
             `translate(${hpadding}, ${ctx.h / 2})`)
       .call(d3.axisLeft(yScale).ticks(11, '+%'))
       .classed('s3', true);
    svg.append('g')
       .classed('opexCC', true)
       .attr('transform',
             `translate(0, ${ctx.h/2})`)
  }
  svg.select('g.opexCC')
     .selectAll('rect')
     .data(opexData)
     .join('rect')
       .attr('x', d => xScale(d.name))
       .attr('y', d => yScale(d.value))
       .attr('height', d => yScale(0) - yScale(d.value))
       .attr('width', xScale.bandwidth())
       .attr('fill', d => color(d.type))
       .attr('fill-opacity', 0.7)
       .classed('s3', true);
  svg.select('g.opexCC')
     .selectAll('text')
     .data(opexData)
     .join('text')
       .attr('text-anchor', 'middle')
       .attr('x', d => xScale(d.name) + xScale.bandwidth() / 2)
       .attr('y', d => (yScale(d.value) + yScale(0)) / 2)
       // .attr('stroke', 'white')
       .attr('fill', 'white')
       .text(d => '+' + Math.round(d.value * 100) + '%')
       .classed('s3', true);
}

function onActive(index) {
    if(index !== ctx.currentSection) {
        console.log('Changing from section ' + ctx.currentSection +' to section ' + index);
        vis['hide' + ctx.currentSection]();
        vis['show' + index]();
        ctx.currentSection = index;
    }
}

function onProgress(index, progress) {
    if(index !== ctx.currentSection) {
        console.log('onProgress called for new section ' + index);
    }
    if(progress !== ctx.currentProgress)
    {
        console.log('onProgress called for same section with progress = ' + progress);
        ctx.currentProgress = progress;
    }
}

// Named transitions allow for simultaneously fading in a new section
// and setting its color to progress
let vis = {
    show0() {
      let vis = d3.select('#vis')
                  .transition('hide')
                  .duration(ctx.sectionTransition)
                  .style('background-color', 'transparent');
    },
    show1() {
      // Update to include changes made elsewhere
      section1();
      d3.selectAll('.s1')
        .transition('show')
        .duration(ctx.sectionTransition)
        .style('opacity', 1);
    },
    show2() {
      // Update to include changes made elsewhere
      section2();
      d3.selectAll('.s2')
        .transition('show')
        .duration(ctx.sectionTransition)
        .style('opacity', 1)
    },
    show3() {
      // Update to include changes made elsewhere
      section3()
      d3.selectAll('.s3')
        .transition('show')
        .duration(ctx.sectionTransition)
        .style('opacity', 1);
    },

    // All handlers that hide the graphics of a given section
    hide0(){
      let vis = d3.select('#vis');
      vis.select('svg').attr('opacity', 1);
    },
    hide1() {
      d3.selectAll('.s1')
        .transition('hide')
        .duration(ctx.sectionTransition)
        .style('opacity', 0)
    },
    hide2() {
      d3.selectAll('.s2')
        .transition('hide')
        .duration(ctx.sectionTransition)
        .style('opacity', 0)
    },
    hide3() {
      d3.selectAll('.s3')
        .transition('hide')
        .duration(ctx.sectionTransition)
        .style('opacity', 0)
    }

    // All progress handlers
}

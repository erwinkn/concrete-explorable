function init() {
    updateHistory();
    setupVis();
    setupInputs();
}

function updateGeneral() {
    updateHistory();
    intro();
}

function updateS1() {
    d3.selectAll('span.altFinal')
      .text(Math.round(fuelSubst.altFinal*100));
    d3.selectAll('span.biomassFinal')
      .text(Math.round(fuelSubst.biomassFinal*100));
    updateGeneral();
    section1();
}

function updateS2() {
    d3.selectAll('span.substRate')
      .text(Math.round(clinkerSubst.substRate*100));
    d3.selectAll('span.substScope3')
      .text(Math.round(clinkerSubst.substScope3));
    updateGeneral();
    section2();
}

function updateS3() {
    updateGeneral();
    section3();
}

function setupInputs() {
    // Fuel substitution
    d3.selectAll('span.altFinal')
      .text(Math.round(fuelSubst.altFinal*100));
    d3.selectAll('input.altFinal')
      .attr('value', fuelSubst.altFinal*100)
      .on('input', function(e, d) {
          fuelSubst.altFinal = this.value / 100;
          updateS1();
      });
    d3.selectAll('span.biomassFinal')
      .text(Math.round(fuelSubst.biomassFinal*100));
    d3.selectAll('input.biomassFinal')
      .attr('value', fuelSubst.biomassFinal*100)
      .on('input', function(e,d) {
          fuelSubst.biomassFinal = this.value / 100;
          updateS1();
      });

    // Clinker substitution
    d3.selectAll('span.substRate')
      .text(Math.round(clinkerSubst.substRate*100));
    d3.selectAll('input.substRate')
      .attr('value', clinkerSubst.substRate*100)
      .filter('.section2')
      .on('input', function(e,d) {
          clinkerSubst.substRate = this.value / 100;
          updateS2()
      });
    d3.selectAll('input.substRate')
      .filter('.section3')
      .on('input', function(e,d) {
          clinkerSubst.substRate = this.value / 100;
          updateS3();
      })
    d3.selectAll('span.substScope3')
      .text(Math.round(clinkerSubst.substScope3));
    d3.selectAll('input.substScope3')
      .attr('value', clinkerSubst.substScope3)
      .on('input', function(e,d) {
          clinkerSubst.substScope3 = this.value;
          updateS2();
      });

    // Carbon capture
    d3.select('input#activateCC')
      .on('change', (e,d) => {ctx.toggleCC = !ctx.toggleCC; updateS3(); });
    d3.select('input#oxyfuel')
      .on('change', (e,d) => { cc.switch2oxy(); updateS3(); });
    d3.select('input#amine')
      .on('change', (e,d) => { cc.switch2amine(); updateS3(); });
}

function toggle(id) {
    let x = document.getElementById(id);
    if(x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function scope2text(key) {
    if(key === 'scope1') { return "Scope 1"; }
    if(key === 'scope2') { return "Scope 2"; }
    if(key === 'scope3') { return "Scope 3"; }
}

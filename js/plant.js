/* --- ASSUMPTIONS --- */
// Total CO2 is computed as gross CO2, thus ignoring biomass emissions

let plant = {
    production: 1000000,// t/yr
    clinkerRatio: 0.75, // %
    thermalKiln: 3500, // MJ / t-cli
    thermalExt: 0, // MJ / t-cim
    elecKiln: 130, // kWh / t-cli
    elecExt: 15, // kWh / t-cim
    processCo2: 520, // kgCO2 / t-cli
    scope3: 40, // kg CO2 / t-cim, additional emissions
    fuelMixCoal: 0.8, // for fossil / alt / biomass
    fuelMixAlt: 0.2,
    fuelMixBiomass: 0.0,
    opexRaw: 10, // € / t-cli for raw materials
    opexMaintenance: 15, // € / t-cli for maintenance / personal
    opexGrind: 5, // additional opex for grinding clinker into cement
    ccr: 0, // carbon capture ratio
    cementRatio: 280, // kg-cement / m3-concrete
    update() {
        this.scope2 = (this.elecKiln * this.clinkerRatio + this.elecExt) * env.elecCo2 / 1000;
        this.fuelMixCo2 = this.fuelMixCoal * env.fuelCo2[0] + this.fuelMixAlt * env.fuelCo2[1];
        this.fuelMixCo2 /= 1000;
        let scope1Kiln = (this.thermalKiln * this.fuelMixCo2 + this.processCo2) * (1 - this.ccr / 100)
        this.scope1 = scope1Kiln * this.clinkerRatio + this.thermalExt * this.fuelMixCo2;
        this.totalCo2 = this.scope1 + this.scope2 + this.scope3;
        let fuelMixPrice = this.fuelMixCoal * env.fuelPrices[0]
            + this.fuelMixAlt * env.fuelPrices[1] + this.fuelMixBiomass * env.fuelPrices[2];
        this.opexClinker = this.opexRaw + this.opexMaintenance
            + this.elecKiln * env.elecPrice + this.thermalKiln * fuelMixPrice / 1000;
        this.opexCement = this.opexClinker * this.clinkerRatio + this.elecExt * env.elecPrice
            + this.thermalExt * fuelMixPrice / 1000 + this.opexGrind;
    }
};

let env = {
    elecPrice: 0.05, // € / kWh, equiv to 50 € / MWh
    fuelPrices: [2.4, -0.9, 7], // € / GJ for fossil / alt / biomass
    elecCo2: 500, // kgCO2 / MWh
    fuelCo2: [90, 120 , 110], // gCO2 / MJ for fossil / alt / biomass
};

let fuelSubst = {
    name: "Fuel substitution",
    deploy: 2025,
    maturity: 0,
    thermal: 0, // additional thermal demand
    altFinal: 0.3, //
    biomassFinal: 0.2,
    // Modifies in place
    apply(plant) {
        plant.thermalKiln += this.thermal;
        plant.fuelMixAlt = this.altFinal;
        plant.fuelMixBiomass = this.biomassFinal;
        plant.fuelMixCoal = 1 - plant.fuelMixAlt - plant.fuelMixBiomass;
    }
}


let clinkerSubst = {
    name: "Clinker substitution",
    deploy: 2030,
    maturity: 1,
    substRate: 0.35,
    thermal: 800, // MJ / t-material used
    elec: 50, // kWh / t-material used
    substScope3: 0, // kg CO2 / t-material, scope 3
    // Modifies in place
    apply(plant) {
        plant.clinkerRatio -= this.substRate;
        plant.thermalExt += this.thermal * this.substRate;
        plant.elecExt += this.elec * this.substRate;
        plant.scope3 += this.substScope3 * this.substRate;
    }
};


// optimisation before 2030
let opti = {
    name: "Optimisation",
    deploy: 2035,
    maturity: 0,
    thermal: 10, // % of kiln demand
    elec: 10, // % of elec demand
    // Modifies in place
    apply(plant) {
        plant.thermalKiln *= (1 - this.thermal / 100);
        plant.elecKiln *= (1 - this.elec / 100);
    }
}


let cc = {
    name: "Carbon capture",
    deploy: 2045,
    ccr: 90, // %
    thermal: 200, // MJ / t-CO2 captured
    elec: 150, // kWh / t-CO2 captured
    cost: 50, // € / t-CO2 captured
    // Modifies in place
    apply(plant) {
        plant.ccr += this.ccr;
        let captured = this.ccr / 100 * (plant.thermalKiln * plant.fuelMixCo2 + plant.processCo2)
        plant.thermalKiln += this.thermal/1000 * captured;
        plant.elecKiln += this.elec/1000 * captured;
        plant.opexMaintenance += this.cost / 1000 * captured;
        plant.update()
    },
    switch2oxy() {
        this.thermal = 200;
        this.elec = 150;
        this.cost = 50;
    },
    switch2amine() {
        this.thermal = 2400;
        this.elec = 30;
        this.cost = 70;
    }
}

// This is not clean design, please do not reproduce this
let technologies = [fuelSubst, clinkerSubst, opti, cc];
let nbTechno = technologies.length;
let history = new Array(1 + nbTechno);
plant.update()
console.log('Plant after update:');
console.log(plant);
history[0] = Object.assign({}, plant);
history[0].year = 2020;
for(var i = 1; i <= nbTechno; i++) {
    // Copy plant state
    history[i] = Object.assign({}, history[0]);
}

// Recompute history from the given starting point
function updateHistory(start = 1) {
    if(start === 0) { start = 1; }
    for(var i = start; i <= nbTechno; i++) {
        // Copy previous plant state
        history[i] = Object.assign({}, history[i-1]);
        // Apply technology
        technologies[i - 1].apply(history[i]);
        history[i].update();
        history[i].year = technologies[i-1].deploy;
    }
    console.log('Logging history');
    console.log(history);
    return history;
}

// Get state for 2050 without a given technology
function altHistory(excluded) {
    let altHist = []
    altHist[0] = Object.assign({}, plant);
    var j = 0;
    for(var i=0; i<technologies.length; i++) {
        if(technologies[i] === excluded) { continue; }
        altHist[j+1] = Object.assign({}, altHist[j])
        technologies[i].apply(altHist[j+1]);
        altHist[j+1].update();
        j++;
    }
    return altHist;
}

// Get the impact of a technology based on its id
function getImpact(id) {
    let impact = {};
    for(var k of Object.keys(history[id])) {
        if(k == "update") { continue; }
        impact[k] = history[id+1][k] - history[id][k];
    }
    console.log('Logging impact of technology ' + id);
    console.log(impact);
    return impact;
}

function getAllImpacts() {
    let impacts = new Array(nbTechno)
    for(var i = 0; i < nbTechno; i++) {
        impacts[i] = getImpact(i);
    }
    return impacts;
}


"use strict"
const fs = require('fs');

// homemade libs
const fileman = require('./fileman'); // for basic file manipulation
const lib = require('./lib'); // for global prototyping

const PROCESSORS_DIR = './processors/'
const PROCESSORSSOURCE_DIR = PROCESSORS_DIR + 'source/';
const PROCESSORSTX_DIR =  PROCESSORS_DIR + 'tx/';
const PROCESSORSPOSTTX_DIR =  PROCESSORS_DIR + 'posttx/';

// Get all source processors
var sourceprocessors = {};
var normalizedPath = require("path").join(__dirname, PROCESSORSSOURCE_DIR);
fs.readdirSync(normalizedPath).forEach(function(file) {
    sourceprocessors[file] = require(PROCESSORSSOURCE_DIR + file);
    // sourceprocessors[file].init();
});

// Get all tx processors
var processors = {};
var normalizedPath = require("path").join(__dirname, PROCESSORSTX_DIR);
fs.readdirSync(normalizedPath).forEach(function(file) {
    processors[file] = require(PROCESSORSTX_DIR + file);
});


// Get all post processors
var postprocessors = {};
var normalizedPath = require("path").join(__dirname, PROCESSORSPOSTTX_DIR);
fs.readdirSync(normalizedPath).forEach(function(file) {
    postprocessors[file] = require(PROCESSORSPOSTTX_DIR + file);
});

// init each of the sources
Object.keys(sourceprocessors).forEach((sp, index) => {
    sourceprocessors[sp].init(
        {sourceprocessors, processors, postprocessors}
    )
});

var runbit = 3; // 1: ProcessPortfolio(); 2: PortfolioRateUpdate(); 3: both

if (runbit & 1) {
    Object.keys(sourceprocessors).forEach((sp, index) => {
        sourceprocessors[sp].process(
            {sourceprocessors, processors, postprocessors}
        )
    });
}

if (runbit & 2) {
    Object.keys(sourceprocessors).forEach((sp, index) => {
        sourceprocessors[sp].complete(
            {sourceprocessors, processors, postprocessors}
        )
    });
}
'use strict';

/**
 * Configure path
 */
const path = require('path');
global.JSPM_SOURCE = path.resolve(__dirname + '/../source');
global.JSPM_FIXTURES = path.resolve(__dirname + '/__fixtures__');
global.JSPM_TEST = __dirname;


/**
 * Configure chai
 */
const chai = require('chai');
chai.config.includeStack = true;
chai.config.useProxy = false;
global.expect = chai.expect;
global.chai = chai;

/**
 * Show unhandled
 */
/* eslint no-console: 0 */
process.on('unhandledRejection', r => console.log(r));

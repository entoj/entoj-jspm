'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * @memberOf configuration
 */
class JspmConfiguration extends Base
{
    /**
     * @param  {model.configuration.GlobalConfiguration} globalConfiguration
     */
    constructor(globalConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);

        // Create configuration
        this._configPath = globalConfiguration.get('jspm.configPath', '${entoj}');
        this._configFilename = globalConfiguration.get('jspm.configFilename', 'jspm.js');
        this._configFile = this._configPath + '/' + this._configFilename;
        this._packagesPath = globalConfiguration.get('jspm.packagesPath', '${entoj}/jspm_packages');
        this._sourcesPath = globalConfiguration.get('jspm.sourcesPath', '${sites}');
        this._precompilePath = globalConfiguration.get('jspm.precompilePath', '${cache}/jspm/precompiled');
        this._bundlePath = globalConfiguration.get('jspm.bundlePath', '${cache}/jspm/bundles');
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [GlobalConfiguration] };
    }


    /**
     * @inheritDocss
     */
    static get className()
    {
        return 'configuration/JspmConfiguration';
    }


    /**
     * The path to the folder containing the config file
     *
     * @type {String}
     */
    get configPath()
    {
        return this._configPath;
    }


    /**
     * The filename of the jspm config file without it's path
     *
     * @type {String}
     */
    get configFilename()
    {
        return this._configFilename;
    }


    /**
     * The full path to the config file
     *
     * @type {String}
     */
    get configFile()
    {
        return this._configFile;
    }


    /**
     * Path to the jspm packages folder
     *
     * @type {String}
     */
    get packagesPath()
    {
        return this._packagesPath;
    }


    /**
     * Path to the project source folder
     *
     * @type {String}
     */
    get sourcesPath()
    {
        return this._sourcesPath;
    }


    /**
     * Path to a folder where precompiled files are stored
     *
     * @type {String}
     */
    get precompilePath()
    {
        return this._precompilePath;
    }


    /**
     * Path to a folder where bundles are stored
     *
     * @type {String}
     */
    get bundlePath()
    {
        return this._bundlePath;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmConfiguration = JspmConfiguration;

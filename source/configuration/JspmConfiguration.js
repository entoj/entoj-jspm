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
        super(context);

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);

        // Create configuration
        this._configPath = globalConfiguration.get('jspm.configPath', '${entoj}');
        this._packagesPath = globalConfiguration.get('jspm.packagesPath', '${entoj}/jspm_packages');
        this._configFilename = globalConfiguration.get('jspm.configFilename', 'jspm.js');
        this._cachePath = globalConfiguration.get('jspm.cachePath', '${cache}/jspm');
        this._configFile = this._configPath + '/' + this._configFilename;
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
     * Path to a cache folder where transpiled file are stored
     *
     * @type {String}
     */
    get cachePath()
    {
        return this._cachePath;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmConfiguration = JspmConfiguration;

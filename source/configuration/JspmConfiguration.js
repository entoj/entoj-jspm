'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * @memberOf configuration
 */
class JspmConfiguration extends Base
{
    /**
     * @param  {model.configuration.GlobalConfiguration} globalConfiguration
     * @param  {model.configuration.BuildConfiguration} buildConfiguration
     */
    constructor(globalConfiguration, buildConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);
        assertParameter(this, 'buildConfiguration', buildConfiguration, true, BuildConfiguration);

        // Create configuration
        this._configPath = globalConfiguration.get('jspm.configPath', '${entoj}');
        this._configFilename = globalConfiguration.get('jspm.configFilename', 'jspm.js');
        this._configFile = this._configPath + '/' + this._configFilename;
        this._defaultGroup = buildConfiguration.get('jspm.defaultGroup', globalConfiguration.get('jspm.defaultGroup', 'common'));
        this._runtimeUrl = globalConfiguration.get('jspm.runtimeUrl', '/jspm_packages/system.js');
        this._packagesPath = globalConfiguration.get('jspm.packagesPath', '${entoj}/jspm_packages');
        this._sourcesPath = globalConfiguration.get('jspm.sourcesPath', '${sites}');
        this._precompilePath = globalConfiguration.get('jspm.precompilePath', '${cache}/jspm/precompiled');
        this._bundlePath = buildConfiguration.get('js.bundlePath', globalConfiguration.get('jspm.bundlePath', '${cache}/jspm/bundles'));
        this._bundleTemplate = buildConfiguration.get('js.bundleTemplate', globalConfiguration.get('jspm.bundleTemplate', '${site.name.urlify()}/${group.urlify()}.js'));
        this._bundleUrlTemplate = buildConfiguration.get('js.bundleUrlTemplate', globalConfiguration.get('jspm.bundleUrlTemplate', '/${site.name.urlify()}/${group.urlify()}.js'));
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [GlobalConfiguration, BuildConfiguration] };
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
     * The name of the default group used
     * to name generated files
     *
     * @type {String}
     */
    get defaultGroup()
    {
        return this._defaultGroup;
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


    /**
     * Template for bundle filenames
     *
     * @type {String}
     */
    get bundleTemplate()
    {
        return this._bundleTemplate;
    }


    /**
     * Url template for a bundle url
     *
     * @type {String}
     */
    get bundleUrlTemplate()
    {
        return this._bundleUrlTemplate;
    }


    /**
     * Url to system js runtime source file
     *
     * @type {String}
     */
    get runtimeUrl()
    {
        return this._runtimeUrl;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmConfiguration = JspmConfiguration;

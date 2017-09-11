'use strict';

/**
 * Requirements
 * @ignore
 */
const Route = require('entoj-system').server.route.Route;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const execute = require('entoj-system').utils.synchronize.execute;
const JspmConfiguration = require('../../configuration/JspmConfiguration.js').JspmConfiguration;


/**
 * A route to serve jspm js files
 *
 * @memberOf server.route
 */
class JspmRoute extends Route
{
    /**
     * @param {cli.CliLogger} cliLogger
     */
    constructor(cliLogger, pathesConfiguration, jspmConfiguration, buildConfiguration, options)
    {
        super(cliLogger.createPrefixed('route.jspmroute'));

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'jspmConfiguration', jspmConfiguration, true, JspmConfiguration);
        assertParameter(this, 'buildConfiguration', buildConfiguration, true, BuildConfiguration);

        // Assign options
        const opts = options || {};
        this._buildConfiguration = buildConfiguration;
        this._configPath = execute(pathesConfiguration, 'resolve', [opts.configPath || jspmConfiguration.configPath]);
        this._packagesPath = execute(pathesConfiguration, 'resolve', [opts.packagesPath || jspmConfiguration.packagesPath]);
        this._sourcesPath = execute(pathesConfiguration, 'resolve', [opts.sourcesPath || jspmConfiguration.sourcesPath]);
        this._precompilePath = execute(pathesConfiguration, 'resolve', [opts.precompilePath || jspmConfiguration.precompilePath]);
        this._bundlePath = execute(pathesConfiguration, 'resolve', [opts.bundlePath || jspmConfiguration.bundlePath]);
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration, JspmConfiguration, BuildConfiguration, 'server.route/JspmRoute.options'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'server.route/JspmRoute';
    }


    /**
     * @type {model.configuration.BuildConfiguration}
     */
    get buildConfiguration()
    {
        return this._buildConfiguration;
    }


    /**
     * The base path to the jspm packages directory
     *
     * @type {String}
     */
    get packagesPath()
    {
        return this._packagesPath;
    }


    /**
     * The base path to the js sources
     *
     * @type {String}
     */
    get sourcesPath()
    {
        return this._sourcesPath;
    }


    /**
     * The base path to the jspm config file
     *
     * @type {String}
     */
    get configPath()
    {
        return this._configPath;
    }


    /**
     * The base path to precompiled files
     *
     * @type {String}
     */
    get precompilePath()
    {
        return this._precompilePath;
    }


    /**
     * The base path to bundled files
     *
     * @type {String}
     */
    get bundlePath()
    {
        return this._bundlePath;
    }


    /**
     * @inheritDocs
     */
    register(express)
    {
        const promise = super.register(express);
        promise.then(() =>
        {
            this.addStaticFileHandler('/jspm_packages/*', this.packagesPath, ['.js']);
            this.addStaticFileHandler('*', this.configPath, ['.js', '.json']);
            if (this.buildConfiguration.get('js.precompile', false))
            {
                this.addStaticFileHandler('*', this.precompilePath, ['.js']);
            }
            else if (this.buildConfiguration.get('js.bundle', false))
            {
                this.addStaticFileHandler('*', this.bundlePath, ['.js']);
            }
            else
            {
                this.addStaticFileHandler('*', this.sourcesPath, ['.js']);
            }
        });
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmRoute = JspmRoute;

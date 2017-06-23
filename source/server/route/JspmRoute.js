'use strict';

/**
 * Requirements
 * @ignore
 */
const Route = require('entoj-system').server.route.Route;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
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
    constructor(cliLogger, pathesConfiguration, jspmConfiguration, options)
    {
        super(cliLogger.createPrefixed('route.jspmroute'));

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'jspmConfiguration', jspmConfiguration, true, JspmConfiguration);

        // Assign options
        const opts = options || {};
        this._configPath = execute(pathesConfiguration, 'resolve', [opts.configPath || jspmConfiguration.configPath]);
        this._packagesPath = execute(pathesConfiguration, 'resolve', [opts.packagesPath || jspmConfiguration.packagesPath]);
        this._precompilePath = execute(pathesConfiguration, 'resolve', [opts.precompilePath || jspmConfiguration.precompilePath]);
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration, JspmConfiguration, 'server.route/JspmRoute.options'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'server.route/JspmRoute';
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
     * The base path to the jspm config file
     *
     * @type {String}
     */
    get configPath()
    {
        return this._configPath;
    }


    /**
     * The base path to the jspm packages directory
     *
     * @type {String}
     */
    get precompilePath()
    {
        return this._precompilePath;
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
            this.addStaticFileHandler('/*', this.configPath, ['.js', '.json']);
            this.addStaticFileHandler('/*', this.precompilePath, ['.js']);
        });
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmRoute = JspmRoute;

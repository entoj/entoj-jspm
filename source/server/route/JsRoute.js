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


/**
 * A route to serve jspm js files
 *
 * @memberOf server.route
 */
class JsRoute extends Route
{
    /**
     * @param {cli.CliLogger} cliLogger
     */
    constructor(cliLogger, pathesConfiguration, options)
    {
        super(cliLogger.createPrefixed('route.sassroute'));

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);

        // Assign options
        const opts = options || {};
        this._pathesConfiguration = pathesConfiguration;
        this._packagesPath = execute(this._pathesConfiguration, 'resolve', [opts.packagesPath || '${entoj}/jspm_packages']);
        this._configPath = execute(this._pathesConfiguration, 'resolve', [opts.configPath || '${entoj}']);
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration, 'server.route/JsRoute.options'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'server.route/JsRoute';
    }


    /**
     * @type {model.configuration.PathesConfiguration}
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
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
     * @inheritDocs
     */
    register(express)
    {
        const promise = super.register(express);
        promise.then(() =>
        {
            this.addStaticFileHandler('/jspm_packages/*', this.packagesPath, ['.js', '.json']);
            this.addStaticFileHandler('/*', this.configPath, ['.js', '.json']);
        });
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JsRoute = JsRoute;

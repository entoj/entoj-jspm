'use strict';

/**
 * Requirements
 */
const JspmRoute = require(JSPM_SOURCE + '/server/route/JspmRoute.js').JspmRoute;
const JspmConfiguration = require(JSPM_SOURCE + '/configuration/JspmConfiguration.js').JspmConfiguration;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const routeSpec = require('entoj-system/test').server.RouteShared;


/**
 * Spec
 *
 * @todo add tests for actual serving files
 */
describe(JspmRoute.className, function()
{
    /**
     * Route Test
     */
    routeSpec(JspmRoute, 'server.route/JspmRoute', function(parameters)
    {
        const buildConfiguration = new BuildConfiguration();
        const pathesConfiguration = new PathesConfiguration();
        const jspmConfiguration = new JspmConfiguration(new GlobalConfiguration());
        const cliLogger = new CliLogger('', { muted: true });
        return [cliLogger, pathesConfiguration, jspmConfiguration, buildConfiguration];
    });
});

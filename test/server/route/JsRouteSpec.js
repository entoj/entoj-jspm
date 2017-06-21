'use strict';

/**
 * Requirements
 */
const JsRoute = require(JSPM_SOURCE + '/server/route/JsRoute.js').JsRoute;
const JspmConfiguration = require(JSPM_SOURCE + '/configuration/JspmConfiguration.js').JspmConfiguration;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const routeSpec = require('entoj-system/test').server.RouteShared;


/**
 * Spec
 *
 * @todo add tests for actual serving files
 */
describe(JsRoute.className, function()
{
    /**
     * Route Test
     */
    routeSpec(JsRoute, 'server.route/JsRoute', function(parameters)
    {
        const pathesConfiguration = new PathesConfiguration();
        const jspmConfiguration = new JspmConfiguration(new GlobalConfiguration());
        const cliLogger = new CliLogger('', { muted: true });
        return [cliLogger, pathesConfiguration, jspmConfiguration];
    });
});

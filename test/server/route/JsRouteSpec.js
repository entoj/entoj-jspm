'use strict';

/**
 * Requirements
 */
const JsRoute = require(JSPM_SOURCE + '/server/route/JsRoute.js').JsRoute;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
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
        const cliLogger = new CliLogger('', { muted: true });
        return [cliLogger, pathesConfiguration];
    });
});

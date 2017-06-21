'use strict';

/**
 * Requirements
 */
const JspmConfiguration = require(JSPM_SOURCE + '/configuration/JspmConfiguration.js').JspmConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const baseSpec = require('entoj-system/test').BaseShared;


/**
 * Spec
 */
describe(JspmConfiguration.className, function()
{
    /**
     * Base Test
     */
    baseSpec(JspmConfiguration, 'configuration/JspmConfiguration', function(parameters)
    {
        return [new GlobalConfiguration()];
    });


    /**
     * JspmConfiguration Test
     */

    // create a initialized testee instance
    const createTestee = function(config)
    {
        return new JspmConfiguration(new GlobalConfiguration(config));
    };

    // Simple properties
    baseSpec.assertProperty(createTestee(), ['configPath'], undefined, '${entoj}');
    baseSpec.assertProperty(createTestee(), ['configFilename'], undefined, 'jspm.js');
    baseSpec.assertProperty(createTestee(), ['configFile'], undefined, '${entoj}/jspm.js');
    baseSpec.assertProperty(createTestee(), ['packagesPath'], undefined, '${entoj}/jspm_packages');
    baseSpec.assertProperty(createTestee(), ['cachePath'], undefined, '${cache}/jspm');

    // Configuration via contructor
    describe('#constructor', function()
    {
        baseSpec.assertProperty(createTestee({ jspm: { configPath: '/configured' } }), ['configPath'], undefined, '/configured');
        baseSpec.assertProperty(createTestee({ jspm: { configFilename: 'config.js' } }), ['configFilename'], undefined, 'config.js');
        baseSpec.assertProperty(createTestee({ jspm: { configPath: '/configured', configFilename: 'config.js' } }), ['configFile'], undefined, '/configured/config.js');
        baseSpec.assertProperty(createTestee({ jspm: { packagesPath: '/configured' } }), ['packagesPath'], undefined, '/configured');
        baseSpec.assertProperty(createTestee({ jspm: { cachePath: '/configured' } }), ['cachePath'], undefined, '/configured');
    });
});

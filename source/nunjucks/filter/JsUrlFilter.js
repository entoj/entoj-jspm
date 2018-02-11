'use strict';

/**
 * Requirements
 * @ignore
 */
const Filter = require('entoj-system').nunjucks.filter.Filter;
const JspmConfiguration = require('../../configuration/JspmConfiguration.js').JspmConfiguration;
const Site = require('entoj-system').model.site.Site;
const urls = require('entoj-system').utils.urls;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const templateString = require('es6-template-strings');


/**
 * Generates a js url.
 *
 * @memberOf nunjucks.filter
 */
class JsUrlFilter extends Filter
{
    /**
     * @inheritDoc
     */
    constructor(moduleConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'moduleConfiguration', moduleConfiguration, true, JspmConfiguration);

        // Assign options
        this._name = ['jsUrl', 'js'];
        this._moduleConfiguration = moduleConfiguration;
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [JspmConfiguration] };
    }


    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'nunjucks.filter/JsUrlFilter';
    }


    /**
     * @type {configuration.JspmConfiguration}
     */
    get moduleConfiguration()
    {
        return this._moduleConfiguration;
    }


    /**
     * @type {String}
     */
    get baseUrl()
    {
        if (this.environment &&
            this.environment.buildConfiguration)
        {
            return this.environment.buildConfiguration.get('filters.jsUrl');
        }
        return false;
    }


    /**
     * @inheritDoc
     */
    filter(value)
    {
        const scope = this;
        return function(value, group)
        {
            const globals = scope.getGlobals(this);
            const data =
            {
                type: typeof value == 'string' 
                    ? value 
                    : 'bundle',
                site: value instanceof Site 
                    ? value 
                    : globals.location.site,
                group: group || scope.moduleConfiguration.defaultGroup,
                baseUrl: scope.baseUrl
            };
            switch (data.type)
            {
                case 'bundle':
                    data.path = templateString(scope.moduleConfiguration.bundleUrlTemplate, data);
                    if (data.baseUrl)
                    {
                        data.path = urls.concat(data.baseUrl, data.path);
                    }
                    break;

                case 'runtime':
                    data.path = scope.moduleConfiguration.runtimeUrl;
                    break;

                case 'configuration':
                    data.path = '/' + scope.moduleConfiguration.configFilename;
                    break;

                default:
                    data.path = value;
                    data.type = 'link';
                    break;
            }
            return scope.applyCallbacks(data.path, arguments, data);
        };
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JsUrlFilter = JsUrlFilter;

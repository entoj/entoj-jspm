'use strict';

/**
 * Requirements
 * @ignore
 */
const Command = require('entoj-system').command.Command;
const Context = require('entoj-system').application.Context;
const JspmBundleTask = require('../task/JspmBundleTask.js').JspmBundleTask;
const JspmPrecompileTask = require('../task/JspmPrecompileTask.js').JspmPrecompileTask;
const JspmConfiguration = require('../configuration/JspmConfiguration.js').JspmConfiguration;
const ModelSynchronizer = require('entoj-system').watch.ModelSynchronizer;
const WriteFilesTask = require('entoj-system').task.WriteFilesTask;
const DecorateTask = require('entoj-system').task.DecorateTask;
const PostProcessJsTask = require('entoj-js').task.PostProcessJsTask;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const CliLogger = require('entoj-system').cli.CliLogger;
const waitForPromise = require('entoj-system').utils.synchronize.waitForPromise;
const co = require('co');
const gitRev = require('git-rev-promises');


/**
 * @memberOf command
 */
class JspmCommand extends Command
{
    /**
     */
    constructor(context)
    {
        super(context);

        // Assign options
        this._name = ['js', 'jspm'];
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [Context] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'command/JspmCommand';
    }


    /**
     * @inheritDocs
     */
    get help()
    {
        const help =
        {
            name: this._name,
            description: 'Compiles js files into bundles',
            actions:
            [
                {
                    name: 'bundle',
                    description: 'Bundles all js files of the given query into their configured bundles',
                    options:
                    [
                        {
                            name: 'query',
                            type: 'inline',
                            optional: true,
                            defaultValue: '*',
                            description: 'Query for sites to use e.g. /base'
                        },
                        {
                            name: 'destination',
                            type: 'named',
                            value: 'path',
                            optional: true,
                            defaultValue: '',
                            description: 'Define a base folder where bundles are written to'
                        }
                    ]
                },
                {
                    name: 'precompile',
                    description: 'Precompiles all js files to es5 compatible versions',
                    options:
                    [
                        {
                            name: 'query',
                            type: 'inline',
                            optional: true,
                            defaultValue: '*',
                            description: 'Query for entities to use e.g. base/elements'
                        }
                    ]
                },
                {
                    name: 'watch',
                    description: 'Precompiles all js files to es5 compatible versions and watches for file changes',
                    options:
                    [
                        {
                            name: 'query',
                            type: 'inline',
                            optional: true,
                            defaultValue: '*',
                            description: 'Query for entities to use e.g. base/elements'
                        }
                    ]
                }
            ]
        };
        return help;
    }


    /**
     * Precompiles js files
     *
     * @returns {Promise}
     */
    precompile(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.jspm.precompile');
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const jspmConfiguration = scope.context.di.create(JspmConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            const options =
            {
                writePath: yield pathesConfiguration.resolve(jspmConfiguration.precompilePath),
                query: parameters && parameters._ && parameters._[0] || '*'
            };
            yield scope.context.di.create(JspmPrecompileTask, mapping)
                .pipe(scope.context.di.create(WriteFilesTask, mapping))
                .run(buildConfiguration, options);
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * Uses watch.ModelSynchronizer to wait for changes on .js files
     * to precompile them
     *
     * @protected
     * @param {Object} parameters
     * @returns {Promise}
     */
    watch(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.jspm.watch');
            const modelSynchronizer = scope.context.di.create(ModelSynchronizer);
            yield scope.precompile(parameters);
            yield modelSynchronizer.start();
            /* istanbul ignore next */
            modelSynchronizer.signals.invalidated.add((synchronizer, invalidations) =>
            {
                if (invalidations.entity.update &&
                    invalidations.extensions.indexOf('.js') > -1)
                {
                    for (const entity of invalidations.entity.update)
                    {
                        logger.info('Detected update in <' + entity.pathString + '>');
                        waitForPromise(scope.precompile({ _:[entity.pathString] }));
                    }
                }
            });
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * Bundles all js packages into grouped files grouped by groups.css
     *
     * @returns {Promise}
     */
    bundle(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.jspm.bundle');
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const jspmConfiguration = scope.context.di.create(JspmConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            let prepend = false;
            if (buildConfiguration.get('js.banner', false))
            {
                prepend = '/** ' + buildConfiguration.get('js.banner', false) + ' **/';
            }
            const options =
            {
                writePath: yield pathesConfiguration.resolve((parameters && parameters.destination) || jspmConfiguration.bundlePath),
                query: parameters && parameters._ && parameters._[0] || '*',
                decorateVariables:
                {
                    date: new Date(),
                    gitHash: yield gitRev.long(),
                    gitBranch: yield gitRev.branch()
                },
                decoratePrepend: prepend
            };
            yield scope.context.di.create(JspmBundleTask, mapping)
                .pipe(scope.context.di.create(PostProcessJsTask, mapping))
                .pipe(scope.context.di.create(DecorateTask, mapping))
                .pipe(scope.context.di.create(WriteFilesTask, mapping))
                .run(buildConfiguration, options);
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * @inheritDocs
     */
    dispatch(action, parameters)
    {
        switch((action || '').toLowerCase())
        {
            case 'precompile':
                return this.precompile(parameters);

            case 'watch':
                return this.watch(parameters);

            default:
                return this.bundle(parameters);
        }
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmCommand = JspmCommand;

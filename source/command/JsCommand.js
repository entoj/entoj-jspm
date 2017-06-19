'use strict';

/**
 * Requirements
 * @ignore
 */
const Command = require('entoj-system').command.Command;
const Context = require('entoj-system').application.Context;
const BundleJsTask = require('../task/BundleJsTask.js').BundleJsTask;
const WriteFilesTask = require('entoj-system').task.WriteFilesTask;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const CliLogger = require('entoj-system').cli.CliLogger;
const co = require('co');


/**
 * @memberOf command
 */
class JsCommand extends Command
{
    /**
     */
    constructor(context)
    {
        super(context);

        // Assign options
        this._name = 'js';
        this._pathesConfiguration = context.di.create(PathesConfiguration);
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [Context, PathesConfiguration] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'command/JsCommand';
    }


    /**
     * @inheritDocs
     */
    get help()
    {
        const help =
        {
            name: this._name,
            description: 'Compiles and optimizes js files',
            actions:
            [
                {
                    name: 'compile',
                    description: 'Compiles all js files the given site(s) into their configured bundles'
                }
            ]
        };
        return help;
    }


    /**
     * @inheritDocs
     * @returns {Promise}
     */
    compile(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.js.compile');
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const path = yield pathesConfiguration.resolveCache('/js');
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            yield scope.context.di.create(BundleJsTask, mapping)
                .pipe(scope.context.di.create(WriteFilesTask, mapping))
                .run(buildConfiguration, { writePath: path });
        });
        return promise;
    }


    /**
     * @inheritDocs
     */
    dispatch(action, parameters)
    {
        return this.compile(parameters);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JsCommand = JsCommand;

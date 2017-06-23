'use strict';

/**
 * Requirements
 * @ignore
 */
const Task = require('entoj-system').task.Task;
const GlobalRepository = require('entoj-system').model.GlobalRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const ContentType = require('entoj-system').model.ContentType;
const CliLogger = require('entoj-system').cli.CliLogger;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const through2 = require('through2');
const VinylFile = require('vinyl');
const co = require('co');
const babel = require('babel-core');


/**
 * @memberOf task
 */
class JspmPrecompileTask extends Task
{
    /**
     *
     */
    constructor(cliLogger, pathesConfiguration, globalRepository)
    {
        super(cliLogger);

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'globalRepository', globalRepository, true, GlobalRepository);

        // Assign options
        this._globalRepository = globalRepository;
        this._pathesConfiguration = pathesConfiguration;
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration, GlobalRepository] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'task/JspmPrecompileTask';
    }


    /**
     * @type {model.configuration.PathesConfiguration}
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
    }


    /**
     * @type {model.GlobalRepository}
     */
    get globalRepository()
    {
        return this._globalRepository;
    }


    /**
     * @protected
     * @returns {Promise<Array>}
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const promise = super.prepareParameters(buildConfiguration, parameters)
            .then((params) =>
            {
                params.query = params.query || '*';
                return params;
            });
        return promise;
    }


    /**
     * @returns {Promise<Array<VinylFile>>}
     */
    processEntity(entity, buildConfiguration, parameters)
    {
        if (!entity)
        {
            this.logger.warn(this.className + '::processEntity - No entity given');
            return Promise.resolve(false);
        }

        const scope = this;
        const promise = co(function *()
        {
            const result = [];

            // Iterate all js files
            const sourceFiles = entity.files.filter((file) => file.contentType == ContentType.JS);
            for (const sourceFile of sourceFiles)
            {
                // Transpile file
                const filename = yield scope.pathesConfiguration.relativeToSites(sourceFile.filename);
                const work = scope.cliLogger.work('Transpiling <' + filename + '>');
                const options =
                {
                    presets: [require('babel-preset-es2015')],
                    babelrc: false
                };
                const contents = babel.transform(sourceFile.contents.toString(), options).code;
                const resultFile = new VinylFile(
                    {
                        path: filename,
                        contents: new Buffer(contents)
                    });
                scope.cliLogger.end(work);
                result.push(resultFile);
            }
            return result;
        });
        return promise;
    }


    /**
     * @inheritDocs
     * @returns {Promise<Array>}
     */
    processEntities(buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const params = yield scope.prepareParameters(buildConfiguration, parameters);

            // Process each entity
            const result = [];
            const entities = yield scope.globalRepository.resolveEntities(params.query);
            for (const entity of entities)
            {
                // Render entity
                const files = yield scope.processEntity(entity, buildConfiguration, parameters);
                result.push(...files);
            }

            // Done
            return result;
        });
        return promise;
    }


    /**
     * @returns {Stream}
     */
    stream(stream, buildConfiguration, parameters)
    {
        let resultStream = stream;
        if (!resultStream)
        {
            resultStream = through2(
                {
                    objectMode: true
                });
            const scope = this;
            co(function *()
            {
                const work = scope._cliLogger.section('Precompiling js files');
                const params = yield scope.prepareParameters(buildConfiguration, parameters);
                scope.cliLogger.options(params);
                const files = yield scope.processEntities(buildConfiguration, parameters);
                for (const file of files)
                {
                    resultStream.write(file);
                }
                resultStream.end();
                scope.cliLogger.end(work);
            }).catch((e) =>
            {
                this.logger.error(e);
            });
        }
        return resultStream;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmPrecompileTask = JspmPrecompileTask;

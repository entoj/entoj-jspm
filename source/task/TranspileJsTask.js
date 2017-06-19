'use strict';

/**
 * Requirements
 * @ignore
 */
const TransformingTask = require('entoj-system').task.TransformingTask;
const babel = require('babel-core');
const VinylFile = require('vinyl');


/**
 * @memberOf task
 */
class TranspileJsTask extends TransformingTask
{
    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'task/TranspileJsTask';
    }



    /**
     * @returns {String}
     */
    get sectionName()
    {
        return 'Transpiling js files';
    }


    /**
     * @returns {Stream}
     */
    processFile(file, buildConfiguration, parameters)
    {
        /* istanbul ignore next */
        if (!file || !file.isNull)
        {
            this.cliLogger.info('Invalid file <' + file + '>');
            return false;
        }

        // Render template
        const work = this.cliLogger.work('Transpiling template file <' + file.path + '>');
        let resultFile;
        try
        {
            const options =
            {
                presets: [require('babel-preset-es2015')],
                //plugins: ['transform-runtime'],
                babelrc: false
            };
            const contents = babel.transform(file.contents.toString(), options).code;
            resultFile = new VinylFile(
                {
                    path: file.path,
                    contents: new Buffer(contents)
                });
        }
        catch(e)
        {
            /* istanbul ignore next */
            this.cliLogger.error(e);
        }
        this.cliLogger.end(work);

        return Promise.resolve(resultFile);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.TranspileJsTask = TranspileJsTask;

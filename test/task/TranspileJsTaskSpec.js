'use strict';

/**
 * Requirements
 */
const TranspileJsTask = require(JSPM_SOURCE + '/task/TranspileJsTask.js').TranspileJsTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const taskSpec = require('entoj-system/test').task.TaskShared;
const co = require('co');
const through2 = require('through2');
const VinylFile = require('vinyl');


/**
 * Spec
 */
describe(TranspileJsTask.className, function()
{
    /**
     * Task Test
     */
    taskSpec(TranspileJsTask, 'task/TranspileJsTask', prepareParameters);

    /**
     */
    function prepareParameters(parameters)
    {
        parameters.unshift(global.fixtures.cliLogger);
        return parameters;
    }


    /**
     * TranspileJsTask Test
     */
    beforeEach(function()
    {
        global.fixtures = {};
        global.fixtures.cliLogger = new CliLogger();
        global.fixtures.cliLogger.muted = true;
    });


    describe('#stream()', function()
    {
        this.timeout(15000);
        it('should transpile all streamed files', function()
        {
            const promise = co(function *()
            {
                const input = 'for (const item of ["hi", "there"]) {};';
                const sourceStream = through2(
                    {
                        objectMode: true
                    });
                sourceStream.write(new VinylFile(
                    {
                        path: 'test.js',
                        contents: new Buffer(input)
                    }));
                sourceStream.end();

                const testee = new TranspileJsTask(global.fixtures.cliLogger);
                const data = yield taskSpec.readStream(testee.stream(sourceStream));
                for (const file of data)
                {
                    expect(file.contents.toString()).to.be.ok;
                    expect(file.contents.toString()).to.be.not.equal(input);
                    expect(file.contents.toString()).to.contain('"hi"');
                    expect(file.contents.toString()).to.contain('"there"');
                }
            });
            return promise;
        });
    });
});

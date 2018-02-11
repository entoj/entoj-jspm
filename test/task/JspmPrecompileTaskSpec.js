'use strict';

/**
 * Requirements
 */
const JspmPrecompileTask = require(JSPM_SOURCE + '/task/JspmPrecompileTask.js').JspmPrecompileTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const taskSpec = require('entoj-system/test').task.TaskShared;
const projectFixture = require('entoj-system/test').fixture.project;
const co = require('co');
const sinon = require('sinon');
const path = require('path');


/**
 * Spec
 */
describe(JspmPrecompileTask.className, function()
{
    /**
     * Task Test
     */
    taskSpec(JspmPrecompileTask, 'task/JspmPrecompileTask', prepareParameters);

    // Adds necessary parameters to create a testee
    function prepareParameters(parameters)
    {
        return [global.fixtures.cliLogger, global.fixtures.pathesConfiguration, global.fixtures.globalRepository];
    }


    /**
     * PrecompileJsTask Test
     */
    beforeEach(function()
    {
        global.fixtures = projectFixture.createStatic();
        global.fixtures.cliLogger = new CliLogger();
        global.fixtures.cliLogger.muted = true;
    });


    // create a initialized testee instance
    const createTestee = function()
    {
        let parameters = Array.from(arguments);
        if (prepareParameters)
        {
            parameters = prepareParameters(parameters);
        }
        return new JspmPrecompileTask(...parameters);
    };


    describe('#processEntity()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.processEntity(global.fixtures.entityTeaser, global.fixtures.buildConfiguration);
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should return a sites relative file for each js file of the given entity', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.processEntity(global.fixtures.entityTeaser, global.fixtures.buildConfiguration);
                expect(files).to.have.length(1);
                expect(files[0].path).to.be.equal('base' + path.sep + 'modules' + path.sep + 'm-teaser' + path.sep + 'js' + path.sep + 'm-teaser.js');
            });
            return promise;
        });

        it('should transpile each js file', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.processEntity(global.fixtures.entityGlobal, global.fixtures.buildConfiguration);
                expect(files).to.have.length(9);
                expect(files[0].contents.toString()).to.contain('use strict');
            });
            return promise;
        });
    });


    describe('#processEntities()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.processEntities(global.fixtures.buildConfiguration);
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should process each found entity', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                sinon.spy(testee, 'processEntity');
                yield testee.processEntities(global.fixtures.buildConfiguration);
                expect(testee.processEntity.callCount).to.be.equal(9);
            });
            return promise;
        });

        it('should yield a array with all processed files', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.processEntities(global.fixtures.buildConfiguration);
                expect(files).to.have.length(14);
                expect(files[0].contents.toString()).to.contain('use strict');
            });
            return promise;
        });

        it('should allow to use a query to select entities', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.processEntities(global.fixtures.buildConfiguration, { query: 'base/modules' });
                expect(files).to.have.length(1);
            });
            return promise;
        });
    });
});

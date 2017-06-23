'use strict';

/**
 * Requirements
 */
const JspmCommand = require(JSPM_SOURCE + '/command/JspmCommand.js').JspmCommand;
const commandSpec = require('entoj-system/test').command.CommandShared;
const projectFixture = require('entoj-system/test').fixture.project;
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');


/**
 * Spec
 */
describe(JspmCommand.className, function()
{
    /**
     * Base Test
     */
    commandSpec(JspmCommand, 'command/JspmCommand', prepareParameters);

    // Adds necessary parameters to create a testee
    function prepareParameters(parameters)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.entities.loader.plugins.push(require('entoj-js').model.loader.documentation.JsPlugin);
            config.pathes.entojTemplate = JSPM_FIXTURES;
            config.pathes.cacheTemplate = JSPM_FIXTURES + '/cache';
            return config;
        });
        return [global.fixtures.context];
    }


    /**
     * BundleJsTask Test
     */
    function createTestee()
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.entities.loader.plugins.push(require('entoj-js').model.loader.documentation.JsPlugin);
            config.pathes.entojTemplate = JSPM_FIXTURES;
            config.pathes.cacheTemplate = JSPM_FIXTURES + '/cache';
            return config;
        });
        return new JspmCommand(global.fixtures.context);
    }


    describe('#bundle()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.bundle();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should create all configured bundles', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee();
                yield testee.bundle();
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/base/common.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/base/core.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/extended/common.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/extended/common.js'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to pass a query for entities', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee();
                yield testee.bundle({ _:['base'] });
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/base/common.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/base/core.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/extended/common.js'))).to.be.false;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/bundles/extended/common.js'))).to.be.false;
            });
            return promise;
        });

        it('should allow to write bundles to a custom path', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee();
                yield testee.bundle({ _:['base'], destination: path.join(JSPM_FIXTURES, '/cache/release') });
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/release/base/common.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/release/base/core.js'))).to.be.ok;
            });
            return promise;
        });
    });


    describe('#precompile()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.precompile();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should precompile all files', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee();
                yield testee.precompile();
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/base/elements/e-image/js/e-image.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/extended/elements/e-image/js/e-image.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/base/global/js/application.js'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to pass a query for entities', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee();
                yield testee.precompile({ _:['base'] });
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/base/elements/e-image/js/e-image.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/extended/elements/e-image/js/e-image.js'))).to.be.not.ok;
            });
            return promise;
        });
    });
});

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
     * Command Test
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
     * JspmCommand Test
     */
    function createTestee(buildConfiguration)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.entities.loader.plugins.push(require('entoj-js').model.loader.documentation.JsPlugin);
            config.pathes.entojTemplate = JSPM_FIXTURES;
            config.pathes.cacheTemplate = JSPM_FIXTURES + '/cache';
            config.environments.development = buildConfiguration || {};
            config.logger.muted = true;
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

        it('should allow to add a configurable banner via environment settings', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee({ js: { banner: 'Banner!' }});
                yield testee.bundle();
                const filename = path.join(JSPM_FIXTURES, '/cache/jspm/bundles/base/common.js');
                expect(yield fs.readFile(filename, { encoding: 'utf8' })).to.contain('/** Banner!');
            });
            return promise;
        });

        it('should allow to post process files via environment settings', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee({ js: { minify: true }});
                yield testee.bundle();
                const filename = path.join(JSPM_FIXTURES, '/cache/jspm/bundles/base/common.js');
                expect(yield fs.readFile(filename, { encoding: 'utf8' })).to.not.contain('/**');
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


    describe('#watch()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.watch();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should initially precompile all files', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(JSPM_FIXTURES, '/cache'));
                const testee = createTestee();
                yield testee.watch();
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
                yield testee.watch({ _:['base'] });
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/base/elements/e-image/js/e-image.js'))).to.be.ok;
                expect(yield fs.exists(path.join(JSPM_FIXTURES, '/cache/jspm/precompiled/extended/elements/e-image/js/e-image.js'))).to.be.not.ok;
            });
            return promise;
        });
    });
});

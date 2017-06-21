'use strict';

/**
 * Requirements
 */
const BundleJsTask = require(JSPM_SOURCE + '/task/BundleJsTask.js').BundleJsTask;
const JspmConfiguration = require(JSPM_SOURCE + '/configuration/JspmConfiguration.js').JspmConfiguration;
const CliLogger = require('entoj-system').cli.CliLogger;
const taskSpec = require('entoj-system/test').task.TaskShared;
const projectFixture = require('entoj-system/test').fixture.project;
const co = require('co');


/**
 * Spec
 */
describe(BundleJsTask.className, function()
{
    /**
     * Task Test
     */
    taskSpec(BundleJsTask, 'task/BundleJsTask', prepareParameters);

    // Adds necessary parameters to create a testee
    function prepareParameters(parameters)
    {
        return [global.fixtures.cliLogger, global.fixtures.filesRepository,
            global.fixtures.sitesRepository, global.fixtures.pathesConfiguration, new JspmConfiguration(global.fixtures.globalConfiguration)];
    }


    /**
     * BundleJsTask Test
     */
    beforeEach(function()
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.entities.loader.plugins.push(require('entoj-js').model.loader.documentation.JsPlugin);
            config.pathes.entojTemplate = JSPM_FIXTURES;
            return config;
        });
        global.fixtures.cliLogger = new CliLogger();
        global.fixtures.cliLogger.muted = true;
    });

    // matches the contents of an array
    function containsMatch(value, regex)
    {
        let result = false;
        if (Array.isArray(value))
        {
            for (const item of value)
            {
                if (regex.test(item))
                {
                    result = true;
                }
            }
        }
        return result;
    }

    // create a initialized testee instance
    const createTestee = function()
    {
        let parameters = Array.from(arguments);
        if (prepareParameters)
        {
            parameters = prepareParameters(parameters);
        }
        return new BundleJsTask(...parameters);
    };


    describe('#generateConfiguration()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.generateConfiguration();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should resolve to an array containing bundle configs for each configured site', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const bundles = yield testee.generateConfiguration();
                expect(bundles).to.be.instanceof(Array);
                expect(bundles).to.have.length(2);
            });
            return promise;
        });

        it('should generate bundle configs that contains all groups', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const bundles = yield testee.generateConfiguration();
                const baseBundle = bundles[0];
                const extendedBundle = bundles[1];
                expect(baseBundle).to.contain.key('common');
                expect(baseBundle.common.filename).to.be.equal('base/common.js');
                expect(baseBundle).to.contain.key('core');
                expect(baseBundle.core.filename).to.be.equal('base/core.js');
                expect(extendedBundle).to.contain.key('common');
                expect(extendedBundle.common.filename).to.be.equal('extended/common.js');
                expect(extendedBundle).to.contain.key('core');
                expect(extendedBundle.core.filename).to.be.equal('extended/core.js');
            });
            return promise;
        });

        it('should allow to customize bundle file pathes', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const bundles = yield testee.generateConfiguration(undefined, { filenameTemplate: '${group.urlify()}.js'});
                const baseBundle = bundles[0];
                const extendedBundle = bundles[1];
                expect(baseBundle.common.filename).to.be.equal('common.js');
                expect(baseBundle.core.filename).to.be.equal('core.js');
                expect(extendedBundle.common.filename).to.be.equal('common.js');
                expect(extendedBundle.core.filename).to.be.equal('core.js');
            });
            return promise;
        });

        it('should generate bundle configs that contains all in/excluded files for a group', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const bundles = yield testee.generateConfiguration();
                const baseBundle = bundles[0];
                expect(baseBundle.common.include).to.have.length(11);
                expect(baseBundle.common.include).to.contain('base/global/js/bootstrap.js');
                expect(baseBundle.common.include).to.contain('base/global/js/component.js');
                expect(baseBundle.common.exclude).to.have.length(1);
                expect(baseBundle.common.exclude).to.contain('base/modules/m-teaser/js/m-teaser.js');
                expect(baseBundle.core.include).to.have.length(1);
                expect(baseBundle.core.include).to.contain('base/modules/m-teaser/js/m-teaser.js');
                expect(baseBundle.core.exclude).to.have.length(11);
                expect(baseBundle.core.exclude).to.contain('base/global/js/bootstrap.js');
                expect(baseBundle.core.exclude).to.contain('base/global/js/component.js');
            });
            return promise;
        });

        it('should prepend jspm files on first group', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const bundles = yield testee.generateConfiguration();
                const baseBundle = bundles[0];
                expect(baseBundle.common.prepend).to.have.length(3);
                expect(containsMatch(baseBundle.common.prepend, /system-polyfills\.js/)).to.be.ok;
                expect(containsMatch(baseBundle.common.prepend, /system\.src\.js/)).to.be.ok;
                expect(containsMatch(baseBundle.common.prepend, /jspm\.js/)).to.be.ok;
            });
            return promise;
        });

        it('should generate bundle configs for extended sites that contains all in/excluded files for a group', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const bundles = yield testee.generateConfiguration();
                const extendedBundle = bundles[1];
                expect(extendedBundle.common.include).to.have.length(12);
                expect(extendedBundle.common.include).to.contain('base/global/js/bootstrap.js');
                expect(extendedBundle.common.include).to.contain('base/global/js/component.js');
                expect(extendedBundle.common.include).to.contain('base/elements/e-image/js/e-image.js');
                expect(extendedBundle.common.include).to.contain('extended/elements/e-image/js/e-image.js');
                expect(extendedBundle.common.exclude).to.have.length(1);
                expect(extendedBundle.common.exclude).to.contain('base/modules/m-teaser/js/m-teaser.js');
                expect(extendedBundle.core.include).to.have.length(1);
                expect(extendedBundle.core.include).to.contain('base/modules/m-teaser/js/m-teaser.js');
                expect(extendedBundle.core.exclude).to.have.length(12);
                expect(extendedBundle.core.exclude).to.contain('base/global/js/bootstrap.js');
                expect(extendedBundle.core.exclude).to.contain('base/global/js/component.js');
                expect(extendedBundle.core.exclude).to.contain('base/elements/e-image/js/e-image.js');
                expect(extendedBundle.core.exclude).to.contain('extended/elements/e-image/js/e-image.js');
            });
            return promise;
        });
    });


    describe('#compileBundle()', function()
    {
        it('should create a file for a configured bundle group', function()
        {
            const promise = co(function *()
            {
                const bundleConfiguration =
                {
                    common:
                    {
                        filename: 'base/common.js',
                        prepend: [],
                        append: [],
                        include:
                        [
                            'base/global/js/application.js',
                            'base/global/js/base.js',
                            'base/global/js/bootstrap.js',
                            'base/global/js/breakpoints.js',
                            'base/global/js/component.js',
                            'base/global/js/css.js',
                            'base/global/js/keycode.js',
                            'base/global/js/utils.js',
                            'base/global/js/viewport.js',
                            'base/elements/e-image/js/e-image.js',
                            'base/module-groups/g-teaserlist/js/g-teaserlist.js'
                        ],
                        exclude: [ 'base/modules/m-teaser/js/m-teaser.js' ]
                    }
                };
                const testee = createTestee();
                const files = yield testee.compileBundles(bundleConfiguration);

                expect(files).to.have.length(1);
                const contents = files[0].contents.toString();
                expect(contents).to.contain('base.global/Application');
                expect(contents).to.contain('base.global/Base');
                expect(contents).to.contain('base.global/Breakpoints');
                expect(contents).to.contain('base.global/Component');
                expect(contents).to.contain('base.global/CSS');
                expect(contents).to.contain('base.global/KeyCode');
                expect(contents).to.contain('base.global/Viewport');
                expect(contents).to.contain('base.element.e-image/Component');
                expect(contents).to.contain('base.modulegroup.g-teaserlist/Component');
                expect(contents).to.not.contain('base.module.m-teaser/Component');
            });
            return promise;
        });
    });
});

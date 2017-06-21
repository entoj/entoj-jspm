'use strict';

/**
 * Requirements
 * @ignore
 */
const Task = require('entoj-system').task.Task;
const FilesRepository = require('entoj-system').model.file.FilesRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const SitesRepository = require('entoj-system').model.site.SitesRepository;
const ContentType = require('entoj-system').model.ContentType;
const Site = require('entoj-system').model.site.Site;
const CliLogger = require('entoj-system').cli.CliLogger;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const pathes = require('entoj-system').utils.pathes;
const urls = require('entoj-system').utils.urls;
const execute = require('entoj-system').utils.synchronize.execute;
const Builder = require('systemjs-builder');
const through2 = require('through2');
const VinylFile = require('vinyl');
const difference = require('lodash.difference');
const path = require('path');
const co = require('co');
const fs = require('co-fs-extra');
const templateString = require('es6-template-strings');
const PATH_SEPERATOR = require('path').sep;
const isWin32 = require('os').platform() == 'win32';


/**
 * @memberOf task
 */
class BundleJsTask extends Task
{
    /**
     *
     */
    constructor(cliLogger, filesRepository, sitesRepository, pathesConfiguration, options)
    {
        super(cliLogger);

        //Check params
        assertParameter(this, 'filesRepository', filesRepository, true, FilesRepository);
        assertParameter(this, 'sitesRepository', sitesRepository, true, SitesRepository);
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);

        // Assign options
        const opts = options || {};
        this._filesRepository = filesRepository;
        this._sitesRepository = sitesRepository;
        this._pathesConfiguration = pathesConfiguration;
        this._defaultGroup = 'common';
        this._configPath = execute(this._pathesConfiguration, 'resolve', [opts.configPath || '${entoj}/jspm.js']);
        this._packagesPath = execute(this._pathesConfiguration, 'resolve', [opts.packagesPath || '${entoj}/jspm_packages']);
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, FilesRepository, SitesRepository, PathesConfiguration, 'task/BundleJsTask.options'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'task/BundleJsTask';
    }


    /**
     * @inheritDocs
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const promise = super.prepareParameters(buildConfiguration, parameters)
            .then((params) =>
            {
                params.query = params.query || '*';
                params.filenameTemplate = params.filenameTemplate || '${site.name.urlify()}/${group.urlify()}.js';
                return params;
            });
        return promise;
    }


    /**
     * @protected
     * @returns {Promise<Array>}
     */
    generateConfiguration(buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const params = yield scope.prepareParameters(buildConfiguration, parameters);

            // Start
            const work = scope._cliLogger.section('Generating bundle configuration for <' + params.query + '>');

            // Get Sites
            let sites = [];
            if (params.query !== '*')
            {
                const site = yield scope._sitesRepository.findBy(Site.ANY, params.query);
                sites.push(site);
            }
            else
            {
                sites = yield scope._sitesRepository.getItems();
            }

            // Get bundles
            const result = [];
            for (const site of sites)
            {
                // Get js sources
                const filter = function(file)
                {
                    return file.contentType === ContentType.JS;
                };
                const sourceFiles = yield scope._filesRepository.getBySiteGrouped(site, filter, 'groups.js', scope._defaultGroup);

                // Collect all modules
                const all = [];
                for (const group in sourceFiles)
                {
                    for (const file of sourceFiles[group])
                    {
                        const module = urls.normalizePathSeparators(file.filename.replace(scope._pathesConfiguration.sites + PATH_SEPERATOR, ''));
                        all.push(module);
                    }
                }

                // Create bundles
                const bundles = {};
                for (const group in sourceFiles)
                {
                    const filename = urls.normalizePathSeparators(templateString(params.filenameTemplate, { site: site, group: group }));
                    const groupWork = scope._cliLogger.work('Generating bundle config for <' + site.name + '> / <' + group + '>');
                    const bundle =
                    {
                        filename : filename,
                        prepend: [],
                        append: [],
                        include: [],
                        exclude: []
                    };

                    // Add include
                    for (const file of sourceFiles[group])
                    {
                        const module = urls.normalizePathSeparators(file.filename.replace(scope._pathesConfiguration.sites + PATH_SEPERATOR, ''));
                        bundle.include.push(module);
                    }

                    // Generate exclude
                    bundle.exclude = difference(all, bundle.include);

                    // Add jspm when default category
                    if (group === scope._defaultGroup)
                    {
                        bundle.prepend.push(path.join(scope._packagesPath, '/system-polyfills.js'));
                        bundle.prepend.push(path.join(scope._packagesPath, '/system.src.js'));
                        bundle.prepend.push(scope._configPath);
                    }

                    // Add bundle
                    bundles[group] = bundle;
                    scope._cliLogger.end(groupWork);
                }

                result.push(bundles);
            }

            // End
            scope._cliLogger.end(work);
            return result;
        });
        return promise;
    }


    /**
     * @protected
     * @returns {Promise<Array>}
     */
    compileBundles(bundles, buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Load config
            let builderConfig = false;
            const context =
            {
                System:
                {
                    config: (config) => builderConfig = config
                }
            };
            const builderConfigSource = yield fs.readFile(pathes.concat(scope._pathesConfiguration.entoj, 'jspm.js'), { encoding: 'utf8' });
            require('vm').runInNewContext(builderConfigSource, context);

            // Prepare config
            const prepareFilePath = (pth) =>
            {
                if (!isWin32)
                {
                    return pth;
                }
                return 'file:///' + urls.normalizePathSeparators(pth);
            };
            builderConfig.paths =
            {
                'jspm_packages/*': prepareFilePath(scope._packagesPath) + '/*',
                'github:*': prepareFilePath(scope._packagesPath) + '/github/*',
                'npm:*': prepareFilePath(scope._packagesPath) + '/npm/*',
                'bower:*': prepareFilePath(scope._packagesPath) + '/bower/*'
            };
            const sites = yield scope._sitesRepository.getItems();
            for (const site of sites)
            {
                builderConfig.paths[site.name.urlify() + '/*'] = 'sites/' + site.name.urlify() + '/*';
            }

            // Prepare bundler config
            const loadedFiles = [];
            const bundlerConfig =
            {
                runtime: false,
                minify: false,
                sourceMaps: false,
                lowResSourceMaps: false,
                fetch: function (load, fetch)
                {
                    const promise = co(function *()
                    {
                        const sourceFilename = pathes.normalize(load.name.replace('file:///', ''));
                        const filename = yield scope._pathesConfiguration.shorten(sourceFilename);
                        const work = scope._cliLogger.work(filename);
                        const result = yield fetch(load);
                        if (loadedFiles.indexOf(load.name) === -1)
                        {
                            const stats = fs.statSync(sourceFilename);
                            const size = stats['size'] / 1024;
                            scope._cliLogger.end(work, false, 'Added ' + filename + ' <' + size.toFixed(1) + 'kb>');
                            loadedFiles.push(load.name);
                        }

                        return result;
                    });
                    return promise;
                }
            };

            // Build bundles
            const builder = new Builder(prepareFilePath(scope._pathesConfiguration.root), builderConfig);
            const result = [];
            for (const name in bundles)
            {
                const section = scope._cliLogger.section('Creating bundle <' + bundles[name].filename + '>');

                // Get bundle arithmetic
                const bundle = bundles[name];
                let modules = bundle.include.join(' + ');
                // Remove excludes when not default group
                if (name !== scope._defaultGroup && bundle.exclude.length)
                {
                    modules+= ' - ' + bundle.exclude.join(' - ');
                }

                // Build bundle
                const bundled = yield builder.bundle(modules, bundlerConfig);

                // Create file
                let contents = '';

                // Prepend files
                for (const filename of bundle.prepend)
                {
                    const work = scope._cliLogger.work(filename);
                    const fileContent = yield fs.readFile(filename, { encoding: 'utf8' });
                    contents+= fileContent;
                    scope._cliLogger.end(work, false, 'Prepended ' + filename);
                }

                // Bundle
                contents+= bundled.source;
                const file = new VinylFile(
                    {
                        path: bundle.filename,
                        contents: new Buffer(contents)
                    });
                result.push(file);

                // Done
                scope._cliLogger.end(section);
            }

            return result;
        })
        .catch((e) => this.logger.error(e) );
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
                const siteBundles = yield scope.generateConfiguration(buildConfiguration, parameters);
                const work = scope._cliLogger.section('Bundling js files');
                scope._cliLogger.options(scope.prepareParameters(buildConfiguration, parameters));
                for (const siteBundle of siteBundles)
                {
                    const siteFiles = yield scope.compileBundles(siteBundle, buildConfiguration, parameters);
                    for (const siteFile of siteFiles)
                    {
                        resultStream.write(siteFile);
                    }
                }
                resultStream.end();
                scope._cliLogger.end(work);
            });
        }
        return resultStream;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.BundleJsTask = BundleJsTask;

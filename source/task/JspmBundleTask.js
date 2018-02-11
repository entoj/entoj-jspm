'use strict';

/**
 * Requirements
 * @ignore
 */
const Task = require('entoj-system').task.Task;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const FilesRepository = require('entoj-system').model.file.FilesRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const JspmConfiguration = require('../configuration/JspmConfiguration.js').JspmConfiguration;
const SitesRepository = require('entoj-system').model.site.SitesRepository;
const EntitiesRepository = require('entoj-system').model.entity.EntitiesRepository;
const ContentType = require('entoj-system').model.ContentType;
const CliLogger = require('entoj-system').cli.CliLogger;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const pathes = require('entoj-system').utils.pathes;
const urls = require('entoj-system').utils.urls;
const execute = require('entoj-system').utils.synchronize.execute;
const activateEnvironment = require('entoj-system').utils.string.activateEnvironment;
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
class JspmBundleTask extends Task
{
    /**
     * @param {cli.CliLogger} cliLogger
     * @param {model.file.FilesRepository} filesRepository
     * @param {model.site.SitesRepository} sitesRepository
     * @param {model.configuration.PathesConfiguration} pathesConfiguration
     * @param {Object} options
     */
    constructor(cliLogger, filesRepository, sitesRepository, entitiesRepository, pathesConfiguration, jspmConfiguration, options)
    {
        super(cliLogger);

        //Check params
        assertParameter(this, 'filesRepository', filesRepository, true, FilesRepository);
        assertParameter(this, 'sitesRepository', sitesRepository, true, SitesRepository);
        assertParameter(this, 'entitiesRepository', entitiesRepository, true, EntitiesRepository);
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'jspmConfiguration', jspmConfiguration, true, JspmConfiguration);

        // Assign options
        const opts = options || {};
        this._filesRepository = filesRepository;
        this._sitesRepository = sitesRepository;
        this._entitiesRepository = entitiesRepository;
        this._pathesConfiguration = pathesConfiguration;
        this._jspmConfiguration = jspmConfiguration;
        this._defaultGroup = 'common';
        this._configPath = execute(this._pathesConfiguration, 'resolve', [opts.configPath || jspmConfiguration.configPath]);
        this._packagesPath = execute(this._pathesConfiguration, 'resolve', [opts.packagesPath || jspmConfiguration.packagesPath]);
        this._configFile = execute(this._pathesConfiguration, 'resolve', [opts.configFile || jspmConfiguration.configFile]);
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, FilesRepository, SitesRepository, EntitiesRepository, PathesConfiguration, JspmConfiguration, 'task/JspmBundleTask.options'] };
    }


    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'task/JspmBundleTask';
    }


    /**
     * @type {configuration.JspmConfiguration}
     */
    get jspmConfiguration()
    {
        return this._jspmConfiguration;
    }


    /**
     * @type {model.file.FilesRepository}
     */
    get filesRepository()
    {
        return this._filesRepository;
    }


    /**
     * @type {model.site.SitesRepository}
     */
    get sitesRepository()
    {
        return this._sitesRepository;
    }


    /**
     * @type {model.entity.EntitiesRepository}
     */
    get entitiesRepository()
    {
        return this._entitiesRepository;
    }


    /**
     * @type {model.configuration.PathesConfiguration}
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
    }


    /**
     * @type {String}
     */
    get defaultGroup()
    {
        return this._defaultGroup;
    }


    /**
     * The base path to the jspm packages folder
     *
     * @type {String}
     */
    get packagesPath()
    {
        return this._packagesPath;
    }


    /**
     * The path to the jspm config file folder
     *
     * @type {String}
     */
    get configPath()
    {
        return this._configPath;
    }


    /**
     * The path to the jspm config file
     *
     * @type {String}
     */
    get configFile()
    {
        return this._configFile;
    }


    /**
     * @inheritDoc
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const promise = super.prepareParameters(buildConfiguration, parameters)
            .then((params) =>
            {
                params.query = params.query || '*';
                if (!params.bundleTemplate)
                {
                    params.bundleTemplate = this.jspmConfiguration.bundleTemplate;
                }
                return params;
            });
        return promise;
    }


    /**
     * @protected
     * @returns {Promise<Array>}
     */
    generateConfigurationForEntities(site, entities, buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const params = yield scope.prepareParameters(buildConfiguration, parameters);

            // Start
            const work = scope.cliLogger.section('Generating bundle configuration for <' + params.query + '>');

            // Get all sites
            const sites = [];
            let currentSite = site;
            while(currentSite)
            {
                sites.unshift(currentSite);
                currentSite = currentSite.extends;
            }

            // Get scss files for each entity and site
            const sourceFiles = {};
            for (const entity of entities)
            {
                const group = entity.properties.getByPath('groups.js', scope.defaultGroup);
                sourceFiles[group] = sourceFiles[group] || [];
                for (const s of sites)
                {
                    const files = entity.files.filter((file) =>
                    {
                        const add = file.contentType === ContentType.JS &&
                            file.site.isEqualTo(s);
                        return add;
                    });
                    if (files)
                    {
                        sourceFiles[group].push(...files);
                    }
                }
            }

            // Collect all modules
            const all = [];
            for (const group in sourceFiles)
            {
                for (const file of sourceFiles[group])
                {
                    const module = urls.normalizePathSeparators(file.filename.replace(scope.pathesConfiguration.sites + PATH_SEPERATOR, ''));
                    all.push(module);
                }
            }

            // Create bundles
            const bundles = {};
            for (const group in sourceFiles)
            {
                const filename = urls.normalizePathSeparators(templateString(params.bundleTemplate, { site: site, group: group }));
                const groupWork = scope.cliLogger.work('Generating bundle config for <' + site.name + '> / <' + group + '>');
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
                    const module = urls.normalizePathSeparators(file.filename.replace(scope.pathesConfiguration.sites + PATH_SEPERATOR, ''));
                    bundle.include.push(module);
                }

                // Generate exclude
                bundle.exclude = difference(all, bundle.include);

                // Add jspm when default category
                if (group === scope.defaultGroup)
                {
                    bundle.prepend.push(path.join(scope.packagesPath, '/system-polyfills.js'));
                    bundle.prepend.push(path.join(scope.packagesPath, '/system.src.js'));
                    bundle.prepend.push(scope.configFile);
                }

                // Add bundle
                bundles[group] = bundle;
                scope.cliLogger.end(groupWork);
            }

            // End
            scope.cliLogger.end(work);
            return bundles;
        }).catch(ErrorHandler.handler(scope));
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
            const work = scope.cliLogger.section('Generating bundle configuration for <' + params.query + '>');

            // Get Sites
            let sites = [];
            if (params.query !== '*')
            {
                const site = yield scope.sitesRepository.findBy({ '*': params.query });
                sites.push(site);
            }
            else
            {
                sites = yield scope.sitesRepository.getItems();
            }

            // Get bundles
            const result = [];
            for (const site of sites)
            {
                let entities = [];
                if (params.entities)
                {
                    for (const entity of params.entities)
                    {
                        if (entity.usedBy.indexOf(site) > -1 || entity.site.isEqualTo(site))
                        {
                            entities.push(entity);
                        }
                    }
                }
                else
                {
                    entities = yield scope.entitiesRepository.getBySite(site);
                }
                const bundles = yield scope.generateConfigurationForEntities(site, entities, buildConfiguration, params);
                result.push(bundles);
            }

            // End
            scope.cliLogger.end(work);
            return result;
        }).catch(ErrorHandler.handler(scope));
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
            const builderConfigSource = yield fs.readFile(scope.configFile, { encoding: 'utf8' });
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
            for (const key in builderConfig.paths)
            {
                builderConfig.paths[key] = builderConfig.paths[key].replace('jspm_packages', prepareFilePath(scope.packagesPath));
            }
            builderConfig.paths['jspm_packages/*'] = prepareFilePath(scope.packagesPath) + '/*';
            builderConfig.transpiler = 'babel',
            builderConfig.babelOptions =
            {
                optional: ['runtime']
            };

            // Add sites
            const sites = yield scope.sitesRepository.getItems();
            for (const site of sites)
            {
                builderConfig.paths[site.name.urlify() + '/*'] = 'sites/' + site.name.urlify() + '/*';
            }

            // Prepare bundler config
            const loadedFiles = [];
            const bundlerConfig =
            {
                runtime: 'babel',
                minify: false,
                sourceMaps: false,
                lowResSourceMaps: false,
                fetch: function (load, fetch)
                {
                    const promise = co(function *()
                    {
                        const sourceFilename = pathes.normalize(load.name.replace('file:///', ''));
                        const filename = yield scope.pathesConfiguration.shorten(sourceFilename, 80);
                        const work = scope.cliLogger.work(filename);
                        let result = yield fetch(load);
                        if (buildConfiguration)
                        {
                            result = activateEnvironment(result, buildConfiguration.environment);
                        }
                        if (loadedFiles.indexOf(load.name) === -1)
                        {
                            const stats = fs.statSync(sourceFilename);
                            const size = stats['size'] / 1024;
                            scope.cliLogger.end(work, false, 'Added ' + filename + ' <' + size.toFixed(1) + 'kb>');
                            loadedFiles.push(load.name);
                        }

                        return result;
                    });
                    return promise;
                }
            };

            // Build bundles
            const builder = new Builder(prepareFilePath(scope.pathesConfiguration.root), builderConfig);
            const result = [];
            for (const name in bundles)
            {
                const section = scope.cliLogger.section('Creating bundle <' + bundles[name].filename + '>');

                // Get bundle arithmetic
                const bundle = bundles[name];
                let modules = bundle.include.join(' + ');
                // Remove excludes when not default group
                if (name !== scope.defaultGroup && bundle.exclude.length)
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
                    scope.cliLogger.end(work, false, 'Prepended ' + filename);
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
                scope.cliLogger.end(section);
            }

            return result;
        }).catch(ErrorHandler.handler(scope));
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
                const work = scope.cliLogger.section('Bundling js files');
                scope.cliLogger.options(yield scope.prepareParameters(buildConfiguration, parameters));
                for (const siteBundle of siteBundles)
                {
                    const siteFiles = yield scope.compileBundles(siteBundle, buildConfiguration, parameters);
                    for (const siteFile of siteFiles)
                    {
                        resultStream.write(siteFile);
                    }
                }
                resultStream.end();
                scope.cliLogger.end(work);
            }).catch(ErrorHandler.handler(scope));
        }
        return resultStream;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmBundleTask = JspmBundleTask;

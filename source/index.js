/**
 * Registers with default configurations
 */
function register(configuration, options)
{
    // Commands
    configuration.commands.add(require('./command/index.js').JspmCommand);

    // Entities
    configuration.mappings.add(require('entoj-system').model.entity.EntitiesLoader,
        {
            '!plugins':
            [
                require('entoj-js').model.loader.documentation.JsPlugin
            ]
        });

    // Linter
    configuration.commands.add(require('entoj-system').command.LintCommand,
        {
            '!linters':
            [
                {
                    type: require('entoj-js').linter.JsFileLinter,
                    options:
                    {
                        useDefaultRules: true
                    }
                }
            ]
        });

    // Routes
    configuration.commands.add(require('entoj-system').command.ServerCommand,
        {
            options:
            {
                routes:
                [
                    {
                        type: require('./server/index.js').route.JspmRoute
                    }
                ]
            }
        });
}


/**
 * Public Api
 */
module.exports =
{
    register: register,
    command: require('./command/index.js'),
    linter: require('entoj-js').linter,
    model: require('entoj-js').model,
    parser: require('entoj-js').parser,
    server: require('./server/index.js'),
    task: require('./task/index.js'),
    configuration: require('./configuration/index.js')
};

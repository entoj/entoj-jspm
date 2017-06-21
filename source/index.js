/**
 * Public Api
 */
module.exports =
{
    linter: require('entoj-js').linter,
    model: require('entoj-js').model,
    parser: require('entoj-js').parser,
    server: require('./server/index.js')
};

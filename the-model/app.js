var common = require('./lib/common.js');
var collection = require('./lib/collections.js');
var nodefactory = require('./lib/node-factory.js');

var Universe = {
    common: common,
    collection: collection,
    nodefactory : nodefactory
};

module.exports = Universe;

console.log('the-model started.');


var common = require('./Lib/common.js');
var collection = require('./Lib/collections.js');
var nodefactory = require('./Lib/node-factory.js');

var Universe = {
    common: common,
    collection: collection,
    nodefactory : nodefactory
};

module.exports = Universe;

console.log('the-model started.');


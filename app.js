require('./bootstrap.js');

let fetcherName = process.argv.splice(2)[0];

let fether = require('./fetcher/' + fetcherName)();

// Lets Mocha run the unit and node suites straight from TypeScript
require('ts-node').register({
    project: require('path').join(__dirname, 'tsconfig.node.json'),
    files: true,
});

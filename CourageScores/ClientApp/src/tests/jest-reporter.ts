const fs = require('fs');

class JestReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
    }

    onRunComplete(testContexts, results) {
        if (results.success) {
            return;
        }

        const testResults = results.testResults; // []
        for (const testResult of testResults ) {
            const childResults = testResult.testResults; // []
            for (const childResult of childResults ) {
                const title = childResult.ancestorTitles.join(' > ');
                const status = childResult.status;

                if (status === 'passed') {
                    continue;
                }

                console.log(`${title}: ${status}`);
            }
        }

        // console.log(`onRunComplete arguments: ${JSON.stringify(arguments)}`)
    }
}

module.exports = JestReporter;

const fs = require('fs');
const createTestCafe = require('testcafe');

export function createTestFile(name) {
    const testFile = `
import errorHandling from './features/support/errorHandling';
import testControllerHolder from './features/support/testControllerHolder';

fixture('${name}')
test('test', testControllerHolder.capture)
    .after(async t => {
        await errorHandling.ifErrorTakeScreenshot(t);
    });
`;
    fs.writeFileSync('test.js', testFile);
}

export function cleanupTestFile() {
    fs.unlinkSync('test.js');
}

const BASE_PORT = 1338;

let iteration = 0;
export function runTest(browsers) {
    const port1 = BASE_PORT + iteration * 2;
    const port2 = BASE_PORT + iteration * 2 + 1;
    iteration++;
    return createTestCafe('localhost', port1, port2)
        .then(function(tc) {
            const runner = tc.createRunner();
            // http://devexpress.github.io/testcafe/documentation/using-testcafe/programming-interface/runner.html
            runner
                .src('./test.js')
                .screenshots('reports/screenshots/', true)
                .browsers(browsers)
                .run();
        });
}



// setDefaultTimeout(TIMEOUT);

// Before(function() {
//     runTest(n, this.setBrowser());
//     createTestFile();
//     n += 2;
//     return this.waitForTestController.then(function(testController) {
//         return testController.maximizeWindow();
//     });
// });

// After(function() {
//     fs.unlinkSync('test.js');
//     testControllerHolder.free();
// });

// After(function(testCase) {
//     const world = this;
//     if (testCase.result.status === Status.FAILED) {
//         isTestCafeError = true;
//         attachScreenshotToReport = world.attachScreenshotToReport;
//         errorHandling.addErrorToController();
//     }
// });

// AfterAll(function() {
//     let intervalId = null;

//     function waitForTestCafe() {
//         intervalId = setInterval(checkLastResponse, 500);
//     }

//     function checkLastResponse() {
//         if (testController.testRun.lastDriverStatusResponse === 'test-done-confirmation') {
//             cafeRunner.close();
//             process.exit();
//             clearInterval(intervalId);
//         }
//     }

//     waitForTestCafe();
// });

// const getIsTestCafeError = function() {
//     return isTestCafeError;
// };

// const getAttachScreenshotToReport = function() {
//     return attachScreenshotToReport;
// };

// exports.getIsTestCafeError = getIsTestCafeError;
// exports.getAttachScreenshotToReport = getAttachScreenshotToReport;

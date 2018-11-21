import {expect} from 'chai';
import {TestCafeController} from './api';
import {createTestFile, runTest} from '../support/hooks';
import testControllerHolder from '../support/testControllerHolder';

const Keys = {
    ENTER: 'enter',
};

createTestFile('fixture');
runTest(['chrome']);

let controller;

before(function () {
    this.timeout(10000);
    return testControllerHolder.get().then(testController => {
        controller = new TestCafeController(testController);
    });
});

describe('GitHub search results', async function(env) {
    this.timeout(10000);

    beforeEach(async () => {
        await controller.navigateTo('https://github.com/');
    });

    it('should contain a result for the search term', async () => {
        const searchButtonHandle = await controller.findElement('.header-search-input');
        await controller.type(searchButtonHandle, 'TestCafe');
        await controller.type(null, Keys.ENTER);

        const title = await controller.getTitle();
        expect(title).to.match(/TestCafe/);

        const itemHandle = await controller.findElement('.repo-list-item');
        const itemText = await controller.getElementText(itemHandle)
        expect(itemText).to.contain('DevExpress/testcafe');
    });
});

describe('GitHub login', async function(env) {
    this.timeout(10000);

    beforeEach(async () => {
        await controller.navigateTo('https://github.com/login');
    });

    it('should fail to login with no credentials', async () => {
        const loginButton = await controller.findElement('.btn.btn-primary.btn-block');
        await controller.click(loginButton);

        const errorHandle = await controller.findElement('#js-flash-container > div > div');
        const errorText = await controller.getElementText(errorHandle);
        expect(errorText).to.contain('Incorrect username or password.');
    });
});

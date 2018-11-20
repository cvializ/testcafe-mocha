import * as describes from '../support/describes';
import {expect} from 'chai';

const Keys = {
    ENTER: 'enter',
};

describes.functional('GitHub search results', {
    browsers: ['chrome'],
}, async env => {
    let controller;

    beforeEach(async () => {
        controller = env.controller;
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

describes.functional('GitHub login', {
    browsers: ['chrome'],
}, async env => {
    let controller;

    beforeEach(async () => {
        controller = env.controller;
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

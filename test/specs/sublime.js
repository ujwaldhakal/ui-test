import mysqlProvider from "../services/mysql";
var pageId = process.env.TEST_PAGE_ID,
    // builderUrl = 'google.com';
    builderUrl = process.env.BUILDER_URL + '/build/' + pageId + '/pages';
var sublime;
module.exports = {
    'starting browser': function (browser) {
        sublime = new Sublime();
        sublime.setSublimeTheme();
        sublime.setAllPageMetas();
    },

    'Testing if current page is home page': function (browser) {
        sublime.startBrowser(browser,builderUrl);
        sublime.testIfCurrentPageIsHomePage();
    },

    'Testing index page ': function (browser) {
        sublime.startBrowser(browser,builderUrl + '/index');
        sublime.testIfBannerDescriptionIsCorrect();
    },

    'end of sublime test': function () {
        sublime.endBrowser();
    }
};

class Sublime {

    constructor() {
        this.mysql = new mysqlProvider;
        this.pageMetas = [];
    }

    async setAllPageMetas() {
        if (this.pageMetas.length === 0) {
            let pageMetas = await this.mysql.statement('select * from fbpages_metas where pageid=' + pageId);
            for (let pageMeta in pageMetas) {
                this.pageMetas[pageMetas[pageMeta].key] = pageMetas[pageMeta].value; //setting key value only
            }
        }
        // console.log(this.pageMetas);
    }

    startBrowser(browser, builderUrl) {
        this.browser = browser;
        browser
            .url(builderUrl)   // visit the url
            .waitForElementVisible('body', 5000); // wait for the body to be rendered
    }

    testIfBannerDescriptionIsCorrect() {
        let bannerOption = JSON.parse(this.pageMetas['facebook']);
        let description;
        console.log(bannerOption['display_content']);
        if (bannerOption['display_content'] == 1) { // if user choose option to visible the description
            if (bannerOption['display_custom'] == 1) {
                description = bannerOption['custom_content'];
            }
            console.log('here');
            this.browser.assert.containsText('.jumbotron .header-font-modifier',description);
        }
    }

    setSublimeTheme() {
        return this.mysql.update('fbpages_metas', {
            'key': 'theme_name',
            'value': 'sublime'
        }, {'pageid': pageId, 'key': 'theme_name'});
    }

    getPageName() {
        var siteMenu = this.pageMetas["custom_site_name"];

        return siteMenu;
    }

    async testIfCurrentPageIsHomePage() {
        var siteMenu = await this.mysql.statement('select * from site_menu where pageid=' + pageId + ' and o=0', true),
            title = siteMenu.seo_title;
        if (title === "") {
            let pageName = this.getPageName();
            title = siteMenu.label + ' | ' + pageName;
        }
        this.browser.assert.title(title);
    }

    testIfNumberOfNewsInHomePageIsCorrect() {
        this.browser.verify.visible('.col-sm-4 box');

    }

    endBrowser() {
        this.browser.end();
    }
}

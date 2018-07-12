import mysqlProvider from "../services/mysql";
var pageId = process.env.TEST_PAGE_ID,
    builderUrl = process.env.BUILDER_URL + '/build/' + pageId + '/pages',
    everythingUrl = process.env.NODE_API+'/pages/'+pageId+'/everything',
     sublime,
     axios = require('axios');

module.exports = {
    'starting browser': function (browser) {
        sublime = new Sublime();
        sublime.setSublimeTheme();
        sublime.setAllPageMetas();
        sublime.setMongoData();
    },

    'Testing if current page is home page': function (browser) {
        sublime.startBrowser(browser,builderUrl);
        sublime.testIfCurrentPageIsHomePage();
    },

    'Testing index page ': function (browser) {
        sublime.startBrowser(browser,builderUrl + '/index');
        sublime.testIfBannerDescriptionIsCorrect();
        sublime.testIfReviewsSliderIsWorking();
        sublime.testIfReviewsPageIsPresent();
        sublime.testReviewsSliderFilterOption();
    },

    'end of sublime test': function (browser) {
        browser.end();
    }
};

class Sublime {

    constructor() {
        this.mysql = new mysqlProvider;
        this.mongoData = [];
        this.pageMetas = [];
    }

    async setMongoData() {
       if(this.mongoData.length === 0) {
           this.mongoData = await axios.get(everythingUrl);
           this.mongoData = this.mongoData.data;
       }
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

    testIfReviewsSliderIsWorking()
    {
        let reviewsMeta = JSON.parse(this.pageMetas['fb_reviews']);
        let ratings = this.mongoData.ratings.data;
        if(reviewsMeta.switch && reviewsMeta.homepage_switch && ratings.length > 0) {
            this.browser.assert.elementPresent('.review-slider .item') //this means review slider is active and working
        }
    }

    testIfReviewsPageIsPresent()
    {
        let reviewsMeta = JSON.parse(this.pageMetas['fb_reviews']);
        let ratings = this.mongoData.ratings.data;
        if(reviewsMeta.switch && reviewsMeta.has_active_review_page && ratings.length > 0) {
            this.browser.assert.attributeContains('.multi-page', 'data-section', '#reviews');
        }
    }

    testReviewsSliderFilterOption()
    {
        let reviewsMeta = JSON.parse(this.pageMetas['fb_reviews']);
        let ratings = this.mongoData.ratings.data;
        if(reviewsMeta.switch && reviewsMeta.homepage_switch && reviewsMeta.ratings_switch && ratings.length > 0)  {
            let filter = reviewsMeta.visible_ratings;
           let filteredReviews =  ratings.filter(function (rating) {
                if(filter.indexOf(rating.rating) > -1 && typeof rating.reviewer !== 'undefined') {
                    return rating;
                }
            });

            this.browser.assert.elementCount('.review-slider .item', filteredReviews.length);
        }
    }

    testIfBannerDescriptionIsCorrect() {
        let bannerOption = JSON.parse(this.pageMetas['facebook']);
        let description;
        if (bannerOption['display_content'] == 1) { // if user choose option to visible the description
            if (bannerOption['display_custom'] == 1) {
                description = bannerOption['custom_content'];
            }
            if (bannerOption['display_custom'] == 0) {
                description = this.mongoData.about;
            }
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

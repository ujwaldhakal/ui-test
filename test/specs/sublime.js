import mysqlProvider from "../services/mysql";
var pageId = process.env.TEST_PAGE_ID,
    builderUrl = process.env.BUILDER_URL + '/build/' + pageId + '/pages',
    everythingUrl = process.env.NODE_API + '/pages/' + pageId + '/everything',
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

    'Testing about page ': function (browser) {
        sublime.startBrowser(browser, builderUrl + '/about');
        sublime.testAboutDescription();
        sublime.testAboutImageSection();
    },

    'Testing error page ': function (browser) {
        sublime.startBrowser(browser, builderUrl + '/jpt');
        sublime.testIf404PageWorks();

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
        this.profilePicture = false;
    }

    async setMongoData() {
        if (this.mongoData.length === 0) {
            this.mongoData = await axios.get(everythingUrl);
            this.mongoData = this.mongoData.data.data;
        }
    }

    getBrowser() {
        return this.browser;
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

    testIfReviewsSliderIsWorking() {
        let reviewsMeta = JSON.parse(this.pageMetas['fb_reviews']);
        let ratings = this.mongoData.ratings.data;

        if (reviewsMeta.switch && reviewsMeta.homepage_switch && ratings.length > 0) {
            this.browser.assert.elementPresent('.review-slider .item') //this means review slider is active and working
        }
    }

    testAboutImageSection() {
        let aboutMetas = JSON.parse(this.pageMetas['about']);
        if (aboutMetas.about_image_switch === "0") {
            this.browser.assert.attributeContains('.img-holder img', 'src', this.getProfilePicture());
        }

        if (aboutMetas.about_image_switch === "1") {
            this.browser.assert.attributeContains('.img-holder img', 'src', aboutMetas.about_image);
        }

        if (aboutMetas.about_image_switch === "-1") {
            this.browser.assert.elementNotPresent('.img-holder');
        }
    }

    testAboutDescription() {
        let aboutMetas = JSON.parse(this.pageMetas['about']);
        if (aboutMetas.about_content_switch == "1") {
            let aboutText = aboutMetas.about_content.replace(/\n\s*\n/g, '\n');
            // this.browser.assert.containsText('.ckeditor-custom-about',aboutText); issue with breaking lines
        }

        if (aboutMetas.about_content_switch == "0") {
            let aboutText = this.mongoData.description;
            // this.browser.expect.element('p.description').text.to.contain(aboutText); //text issue
        }
    }



    getProfilePicture() {

        if (this.profilePicture !== false) {
            return this.profilePicture;
        }
        let albums = this.mongoData.albums.data;
        if (albums) {
            for (let index in albums) {
                let album = albums[index];
                if (album.name === "Profile Pictures") {
                    let coverImageid = album.cover_photo.id;
                    let photos = album.photos;
                    for (let photoIndex in photos) {
                        let photo = photos[photoIndex];
                        if (photo.id === coverImageid) {
                            this.profilePicture = photo.large_image;
                            return this.profilePicture;
                        }
                    }
                }
            }
        }
        // return albums;
    }

    testIf404PageWorks() {
        this.browser.assert.elementPresent('.errorWrap--head')
        this.browser.assert.containsText('.errorWrap--head', '404')
    }

    testIfReviewsPageIsPresent() {
        let reviewsMeta = JSON.parse(this.pageMetas['fb_reviews']);
        let ratings = this.mongoData.ratings.data;
        if (reviewsMeta.switch && reviewsMeta.has_active_review_page && ratings.length > 0) {
            this.browser.assert.attributeContains('.multi-page', 'data-section', '#reviews');
        }
    }

    testReviewsSliderFilterOption() {
        let reviewsMeta = JSON.parse(this.pageMetas['fb_reviews']);
        let ratings = this.mongoData.ratings.data;
        if (reviewsMeta.switch && reviewsMeta.homepage_switch && reviewsMeta.ratings_switch && ratings.length > 0) {
            let filter = reviewsMeta.visible_ratings;
            let filteredReviews = ratings.filter(function (rating) {
                if (filter.indexOf(rating.rating) > -1 && typeof rating.reviewer !== 'undefined') {
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
        if (title == "") {
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

function nl2br (str, is_xhtml) {
    if (typeof str === 'undefined' || str === null) {
        return '';
    }
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

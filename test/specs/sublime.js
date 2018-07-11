import mysqlProvider from '../services/mysql'

module.exports = {
    'Sublime theme test': function (browser) {
        let sublime = new Sublime(browser);
        sublime.startBrowser();
        sublime.testIfNumberOfNewsInHomePageIsCorrect();
        sublime.endBrowser();
    }

};

class Sublime {
    constructor(browser) {
        this.browser = browser;
        this.mysql = new mysqlProvider;
    }

    startBrowser() {
        this.browser
            .url('http://build.pagevamp.pv/build/343049269118318/pages')   // visit the url
            .waitForElementVisible('body',6000); // wait for the body to be rendered
    }

    setSublimeTheme() {
        return this.mysql.update('fbpages_metas', {'theme_name': 'sublime'}, {pageid: "343049269118318"});
    }

    async testIfHomePageIsWorkingCorrectly() {
        var a  = await this.mysql.statement("SELECT * FROM fbpages");
        return a;
    }

    testIfNumberOfNewsInHomePageIsCorrect() {
        this.browser.verify.visible('.col-sm-4 box');

    }

    endBrowser() {
        this.browser.end();
    }
}

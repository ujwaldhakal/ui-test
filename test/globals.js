require('babel-register')();
require('env2')('.env'); // optionally store youre Evironment Variables in .env
'use strict'

module.exports = {
  beforeEach: function (browser, done) {
    require('nightwatch-video-recorder').start(browser, done)
  },
  afterEach: function (browser, done) {
    require('nightwatch-video-recorder').stop(browser, done)
  }

}

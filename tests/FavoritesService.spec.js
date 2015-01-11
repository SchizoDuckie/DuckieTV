describe("Favorites Tests", function() {

    var page = require('./Favorites');
    var util = require('util');
    browser.get('/duckietv');

    browser.manage().logs().get('browser').then(function(browserLog) {
        console.log('browser log: ' + util.inspect(browserLog));
    });

    it("Should be showing the favorites page with the search box", function() {
        browser.wait(function() {
            if (!browser.isElementPresent(page.getSeriesList())) {
                return page.getDrawer().click();
            }
            return true;
        }, 10000);
        expect(browser.isElementPresent(page.getSearchBox())).toBeTruthy();
    });

    it("should execute a cached search with 11 results upon typing 'doctor who'", function() {
        element(page.getSearchBox()).sendKeys('doctor who');
        expect(page.getSearchResults().then(function(elements) {
            return elements.length;
        })).toEqual(11);
    });

    it("Should start adding 'Doctor Who 2005' when clicking it", function() {
        page.getSearchResults().then(function(elements) {
            elements[1].click();
            expect(page.getDoctorWhoAddingEarmark().isDisplayed()).toBeTruthy();

        });
    });

    it("Should result in an 'added' check mark on 'Doctor Who 2005' has finished", function() {
        page.getSearchResults().then(function(elements) {
            browser.wait(function() {
                expect(page.getDoctorWhoAddedEarmark().isDisplayed()).toBeTruthy();
            }, 60000);
        });
    });



});
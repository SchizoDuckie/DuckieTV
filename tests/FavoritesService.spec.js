describe("Favorites Tests", function() {

    var page = require('./Favorites');
    browser.get('/duckietv');

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


    /*
    it("Should wipe the existing form when clicking 'wis formulier'", function() {
        page.wipeForm();
        expect(element.all(by.css("form fieldset table tbody tr td input[name=number]")).count()).toEqual(1);

        page.getSamples().then(function(samples) {
            element.all(by.binding('data.project.samples')).then(function(res) {
                expect(res.length).toEqual(0);
            });
        })
    });


    var randomAmount = 5;
    it("should be able to add a random amount (" + randomAmount + ") of samples", function() {

        page.getClientReference().sendKeys('Automated ' + new Date().toDateString());
        page.getLocation().sendKeys('Samson-IT Rijswijk');
        page.getNote().sendKeys("Automated test project " + new Date().toString());

        for (var i = 0; i < randomAmount; i++) {
            page.addSample(i, page.getRandomSampleType());
            if (i < randomAmount - 1) {
                page.getAddSampleButton().click();
            }
        }


    })

*/


});
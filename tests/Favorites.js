function Favorites() {

    this.getDrawer = function() {
        return element(by.css('series-list div h2'));
    };

    this.getSearchBox = function() {
        return by.model('search.query');
    };

    this.getSeriesList = function() {
        return element(by.css('series-list'));
    };

    this.getSearchResults = function() {
        return element.all(by.css('series-list serieheader')).then(function(elements) {
            return elements;
        });
    };

    this.getDoctorWhoAddingEarmark = function() {
        return element(by.css('series-list serieheader:nth-child(3) em.earmark.adding'));
    };


    this.getDoctorWhoAddedEarmark = function() {
        return element(by.cssContainingText('series-list serieheader:nth-child(3) em.earmark', '✓'));
    };

    /*

    this.getAddSampleButton = function() {
        return browser.findElement(by.buttonText('Monster toevoegen'));
    };

    this.wipeForm = function() {
        element(by.cssContainingText('a.reset-button', 'Wis formulier')).click();
    };


    function getEl(model, rowNumber, cb) {
        element.all(by.model(model)).then(function(elements) {
            cb(elements[rowNumber]);
        });
    };

    this.getRandomSampleType = function() {
        var types = ['Materiaalmonster', 'Luchtmonster', 'Kleefmonster'];
        var selectedIndex = Math.floor(Math.random() * types.length);
        return types[selectedIndex];
    };
*/

}

module.exports = new Favorites();
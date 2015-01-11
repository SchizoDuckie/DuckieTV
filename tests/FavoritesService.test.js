function fixture(url, cb) {
    //var CryptoJS = require(['./js/vendor/sha1']);
    url = './base/tests/fixtures/' + url.replace(/\W/g, '').toLowerCase() + '.json';

    var x = new XMLHttpRequest();
    x.open("GET", url, false);

    x.send();

    if (x.status === 200) {
        var out = JSON.parse(x.responseText);
        if (out.headers['Content-Type'].indexOf('json') > -1) {
            return JSON.parse(out.content);
        } else {
            return out.content;
        }
    } else {
        return null;
    }
}


describe('TrakTVv2', function() {
    var TraktTVv2, $httpBackend;

    beforeEach(module('DuckieTV.providers.trakttvv2'));

    beforeEach(inject(function(_$httpBackend_, _TraktTVv2_) {
        TraktTVv2 = _TraktTVv2_;
        $httpBackend = _$httpBackend_;
    }));

    beforeEach(inject(function($injector) {
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        // todo: don't mind this.
        $httpBackend.whenGET(/.*/).respond(function(method, url, data) {
            var response = fixture(url);
            return [response ? 200 : 404, response];
        });
    }));


    describe('It should be able to search for a serie', function() {

        it("should have executed a search for 'Doctor Who'", function() {
            TraktTVv2.search('Doctor Who').then(function(searchResults) {
                expect(angular.isArray(searchResults)).toBe(true);
            });

            $httpBackend.flush();
        });

        it("Should be finding 10 items", function() {
            TraktTVv2.search('Doctor Who').then(function(searchResults) {
                expect(searchResults.length).toEqual(10);
            });

            $httpBackend.flush();
        });

        it('Should have Doctor Who as the second search result', function() {
            TraktTVv2.search('Doctor Who').then(function(searchResults) {
                expect(searchResults[1].title).toMatch('Doctor Who');
            });

            $httpBackend.flush();
        });

    });


});

describe('FavoritesService', function() {

    var FavoritesService, $httpBackend;

    beforeEach(module('DuckieTV.providers.favorites'));
    beforeEach(inject(function(_FavoritesService_) {
        FavoritesService = _FavoritesService_;

    }));

    describe('It should be initialized', function() {

        it('should have a favorites property', function() {
            expect(angular.isObject(FavoritesService.favorites)).toBe(true);
        });

        it('should list all series', function() {
            FavoritesService.getSeries().then(function(result) {
                expect(angular.isArray(result)).toBe(true);
            });

        });
    });


});
/**
 * Synchronous Fixture loader using Plain Old Javascript.
 * Strips all non alphabet/numeric characters out of the HTTP request URL
 * e.g.
 * https://api.trakt.tv/shows/doctor-who-2005/seasons?extended=full,images
 * becomes
 * 'httpsapitrakttvshowsdoctorwho2005seasonsextendedfullimages.json'
 * for
 * (not perfect, but sufficient for me)
 *
 * The file format is a simple json structure:
 * {
 *   url: 'string',
 *   headers: {
 *       //map
 *   },
 *   content: 'string'
 * }
 *
 *
 */
function fixture(url) {
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

describe('FavoritesService', function() {

    var FavoritesService, TraktTVv2, $httpBackend;

    beforeEach(module('DuckieTV.providers.favorites'));
    beforeEach(module('DuckieTV.providers.trakttvv2'));

    beforeEach(inject(function($injector) {
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.whenGET(/.*/).respond(function(method, url, data) {
            var response = fixture(url);
            return [response ? 200 : 404, response];
        });
    }));

    beforeEach(inject(function(_FavoritesService_, _TraktTVv2_, _$httpBackend_) {
        FavoritesService = _FavoritesService_;
        TraktTVv2 = _TraktTVv2_;
        $httpBackend = _$httpBackend_;
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

    describe("It should be able to add Doctor Who to the database", function() {

        it('Should be able to add Doctor Who from a parsed search result', function() {
            TraktTVv2.serie('doctor-who-2005').then(function(searchResults) {
                expect(searchResults.title).toMatch('Doctor Who');
                return searchResults;
            }).then(FavoritesService.addFavorite).then(function(serie) {
                expect(serie.id).not.toBe(false);
            });

            $httpBackend.flush();
        });




    });


});
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
describe('FavoritesService', function() {

    var FavoritesService, TraktTVv2, $httpBackend, $q, $rootScope, $scope;

    beforeEach(module('DuckieTV'));

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

    afterEach(inject(function($rootScope) {
        $rootScope.$apply();
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

        //describe("It should be able to add Doctor Who to the database", function() {

        // todo: move this to protractor test, test only the parsing of what goes into CRUD objects
        // (e.g. one serie, one episode, one season) here
        /*
        it('Should be able to add Doctor Who from a parsed search result', function(done) {
            var serie = null;
            TraktTVv2.serie('doctor-who-2005').then(function(searchResults) {
                return searchResults;
            }).then(function(result) {
                return FavoritesService.addFavorite(result);
            }).then(function(serie) {
                expect(serie).toEqual(true);
                done();
            });

            $httpBackend.flush();


        });

        it('Shoud have finished adding it', function(done) {
            var serie = null;
            CRUD.FindOne('Serie', {
                name: 'Doctor Who'
            }).then(function(serie) {

                expect(
                    serie.overview == "The Doctor is an alien Time Lord from the planet Gallifrey who travels through all of time and space in his TARDIS. His current travel companion is Clara Oswald, though he has a long list of friends and companions who have shared journeys with him. Instead of dying, the Doctor is able to “regenerate” into a new body, taking on a new personality with each regeneration. Twelve actors, plus John Hurt, have played The Doctor thus far." &&
                    serie.runtime == 50 &&
                    serie.network == 'BBC One' &&
                    serie.status == 'returning series' &&
                    serie.rating == 91 &&
                    serie.language == 'gb' &&
                    serie.fanart == 'https://walter.trakt.us/images/shows/000/056/872/fanarts/original/f5b14363ae.jpg?1420722413' &&
                    serie.poster == 'https://walter.trakt.us/images/shows/000/056/872/posters/thumb/8c421e339d.jpg?1420722412' &&
                    serie.banner == 'https://walter.trakt.us/images/shows/000/056/872/banners/original/eb6561d0ee.jpg?1420722414' &&
                    serie.TVDB_ID == 78804 &&
                    serie.TVRage_ID == 3332 &&
                    serie.IMDB_ID == 'tt0436992' &&
                    serie.contentrating == 'TV-PG' &&
                    serie.name == 'Doctor Who' &&
                    /* serie.firstaired == NaN && 
                    serie.ratingcount == 10176 &&
                    serie.genre == 'action|adventure|drama|science-fiction' &&
                    serie.ID_Serie == 1
                ).toBe(true);
                done();
            });

        });

        it("Should have added 10 seasons", function(done) {

            CRUD.FindOne('Season', {
                Serie: {
                    title: 'Doctor Who'
                }
            }).then(function(result) {
                expect(result.length).toEqual(10);
                done();
            });


        });


        it('should have added xx episodes', function() {
            expect(false).toBe(true); // placeholder
        });

        it('should have added a timer', function() {
            expect(false).toBe(true); // placeholder
        });

        it('should have added a ScheduledEvent', function() {
            expect(false).toBe(true); // placeholder
        });

        it('on new series it should have triggered a refresh of the library', function() {
            expect(false).toBe(true); // placeholder
        });

        it('should execute 0 insert/update queries when adding the same show twice', function() {
            expect(false).toBe(true); // placeholder
        });

    */


    });

});
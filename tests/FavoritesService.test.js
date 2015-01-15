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
                expect(
                    serie.id !== false &&
                    serie.banner == '' &&
                    serie.overview == '' &&
                    serie.TVDB_ID == '' &&
                    serie.networkid == '' &&
                    serie.actors == '' &&
                    serie.airs_dayofweek == '' &&
                    serie.airs_time == '' &&
                    serie.contentrating == '' &&
                    serie.firstaired == '' &&
                    serie.genre == '' &&
                    serie.language == '' &&
                    serie.network == '' &&
                    serie.rating == '' &&
                    serie.ratingcount == '' &&
                    serie.runtime == '' &&
                    serie.status == '' &&
                    serie.fanart == '' &&
                    serie.poster == '' &&
                    serie.displaycalendar == 1).toBe(true);
                /** merge this
                                air_day: "Saturday"
                                air_day_utc: "Saturday"
                                air_time: "20:30"
                                air_time_utc: "20:30"
                                certification: "TV-PG"
                                country: "gb"
                                first_aired: 1111869000
                                first_aired_iso: "2005-03-26T12:30:00-08:00"
                                first_aired_utc: 1111869000
                                genres: ["action", "adventure", "drama", "science fiction"]
                                images: {,…}
                                banner: "https://walter.trakt.us/images/shows/000/056/872/banners/original/eb6561d0ee.jpg?1420722414"
                                fanart: "https://walter.trakt.us/images/shows/000/056/872/fanarts/original/f5b14363ae.jpg?1420722413"
                                poster: "https://walter.trakt.us/images/shows/000/056/872/posters/original/8c421e339d.jpg?1420722412"
                                imdb_id: "tt0436992"
                                in_watchlist: false
                                last_updated: 1421256819
                                network: "BBC One"
                                overview: "The Doctor is an alien Time Lord from the planet Gallifrey who travels through all of time and space in his TARDIS. His current travel companion is Clara Oswald, though he has a long list of friends and companions who have shared journeys with him. Instead of dying, the Doctor is able to “regenerate” into a new body, taking on a new personality with each regeneration. Twelve actors, plus John Hurt, have played The Doctor thus far."
                                people: {actors: [{name: "Peter Capaldi", images: {,…}, character: "The Doctor"},…]}
                                actors: [{name: "Peter Capaldi", images: {,…}, character: "The Doctor"},…]
                                poster: "https://walter.trakt.us/images/shows/000/056/872/posters/original/8c421e339d.jpg?1420722412"
                                rating: false
                                rating_advanced: false
                                ratings: {percentage: 91, votes: 10210, loved: 0, hated: 0}
                                runtime: 50
                                seasons: [{season: 9, episodes: [,…]}, {season: 8,…},…]
                                stats: {watchers: 0, plays: 0, scrobbles: 0, scrobbles_unique: 0, checkins: 0, checkins_unique: 0,…}
                                checkins: 0
                                checkins_unique: 0
                                collection: 0
                                collection_unique: 0
                                plays: 0
                                scrobbles: 0
                                scrobbles_unique: 0
                                watchers: 0
                                status: "returning series"
                                title: "Doctor Who"
                                top_episodes: null
                                top_watchers: null
                                tvdb_id: 78804
                                tvrage_id: 3332
                                url: "http://trakt.tv/shows/doctor-who-2005"
                                year: 2005
                                */

            });

            $httpBackend.flush();
        });

        it('should have added 10 seasons', function() {
            CRUD.Find(Season, {
                Serie: {
                    name: 'Doctor Who'
                }
            }).then(function(seasons) {
                expect(seasons.length == 9).toBe(true);
                return seasons;
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

        it('should execute 0 insert/update queries when adding the same show twice', function() {
            expect(false).toBe(true); // placeholder
        });

        it('should execute 0 insert/update queries when adding the same show twice', function() {
            expect(false).toBe(true); // placeholder
        });



    });


});
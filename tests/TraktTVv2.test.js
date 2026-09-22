describe('TrakTVv2', function() {
    var TraktTVv2, $httpBackend;

    beforeEach(module('DuckieTV'));

    beforeEach(inject(function(_$httpBackend_, _TraktTVv2_) {
        TraktTVv2 = _TraktTVv2_;
        $httpBackend = _$httpBackend_;
    }));

    beforeEach(inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
        var searchResults = fixture('https://api-v2launch.trakt.tv/search?type=show&extended=full,images&query=doctor%20who&limit=50');
        var resolvedID = fixture('https://api-v2launch.trakt.tv/search?id_type=trakt&id=56872');
        $httpBackend.whenGET(/tests\/proxy\.php\?url=.*search%2Fshow/).respond(200, searchResults);
        $httpBackend.whenGET(/tests\/proxy\.php\?url=.*search%2Ftrakt%2F56872/).respond(200, resolvedID);
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

        it('Should be able to find Doctor Who by it\'s TRAKT_ID', function() {
            TraktTVv2.resolveID(56872, true).then(function(serie) {
                expect(serie.title == 'Doctor Who').toBe(true);

            });
            $httpBackend.flush();
        });
    });
});

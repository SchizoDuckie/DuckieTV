describe('TrakTVv2', function() {
    var TraktTVv2, $httpBackend;

    beforeEach(module('DuckieTV'));

    beforeEach(inject(function(_$httpBackend_, _TraktTVv2_) {
        TraktTVv2 = _TraktTVv2_;
        $httpBackend = _$httpBackend_;
    }));

    beforeEach(inject(function($injector) {
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

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

        it('Should be able to find Doctor Who by it\'s TVDB_ID', function() {
            TraktTVv2.resolveTVDBID(78804).then(function(serie) {
                expect(serie.title == 'Doctor Who').toBe(true);

            });
            $httpBackend.flush();
        });
    });
});
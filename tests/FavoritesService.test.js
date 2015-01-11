describe('FavoritesService', function() {

    beforeEach(module('DuckieTV'));
    beforeEach(inject(function(_FavoritesService_) {
        FavoritesService = _FavoritesService_;
    }));
    describe('It should be initialized', function() {

        it('should have a favorites property', function(FavoritesService) {
            var service = new FavoritesService();
            expect(service).to.have.property('favorites', '[]');
        });

        it('should list all series', function(FavoritesService) {
            var service = new FavoritesService();
            service.getSeries().then(function(series) {
                console.info(series);
                expect(series).to.be('array');

            });
        });
    });



});
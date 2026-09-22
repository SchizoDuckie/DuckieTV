describe('BaseTorrentRemote subscriptions', function() {
    var $rootScope;
    var remote;

    beforeEach(module('DuckieTorrent.torrent'));

    beforeEach(inject(function(_$rootScope_, BaseTorrentRemote) {
        $rootScope = _$rootScope_;
        remote = new BaseTorrentRemote();
    }));

    it('disposes one listener without affecting another listener for the same hash', function() {
        var first = jasmine.createSpy('first');
        var second = jasmine.createSpy('second');
        var disposeFirst = remote.onTorrentUpdate('HASH', first);
        remote.onTorrentUpdate('HASH', second);

        disposeFirst();
        $rootScope.$broadcast('torrent:update:HASH', { hash: 'HASH' });

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalled();
    });

    it('returns an idempotent disposer', function() {
        var callback = jasmine.createSpy('callback');
        var dispose = remote.onTorrentUpdate('HASH', callback);

        dispose();
        dispose();
        $rootScope.$broadcast('torrent:update:HASH', { hash: 'HASH' });

        expect(callback).not.toHaveBeenCalled();
    });

    it('keeps callback-based removal compatible and exact', function() {
        var first = jasmine.createSpy('first');
        var second = jasmine.createSpy('second');
        remote.onTorrentUpdate('', first);
        remote.onTorrentUpdate('', second);

        remote.offTorrentUpdate('', first);
        $rootScope.$broadcast('torrent:update:', { hash: 'HASH' });

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalled();
    });
});

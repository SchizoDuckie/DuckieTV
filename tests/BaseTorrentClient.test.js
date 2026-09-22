describe('BaseTorrentClient connection lifecycle', function() {
    var $q;
    var $rootScope;
    var client;
    var connectDeferred;
    var remote;

    beforeEach(module('DuckieTorrent.torrent'));

    beforeEach(inject(function(_$q_, _$rootScope_, BaseTorrentClient) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        remote = { torrents: {}, eventHandlers: {} };
        client = new BaseTorrentClient();
        client.setRemote(remote);
        connectDeferred = $q.defer();
        client.connect = jasmine.createSpy('connect').and.returnValue(connectDeferred.promise);
        client.Update = jasmine.createSpy('Update');
    }));

    it('shares one in-flight connection and reaches ready once', function() {
        var first = client.AutoConnect();
        var second = client.AutoConnect();

        expect(second).toBe(first);
        expect(client.connect.calls.count()).toBe(1);
        expect(client.phase).toBe('connecting');

        connectDeferred.resolve(true);
        $rootScope.$digest();

        expect(client.phase).toBe('ready');
        expect(client.connected).toBe(true);
        expect(client.initialized).toBe(true);
        expect(client.Update.calls.count()).toBe(1);
    });

    it('moves failures offline and owns the retry timer', function() {
        jasmine.clock().install();
        client.connect.and.returnValues(connectDeferred.promise, $q.defer().promise);
        client.AutoConnect().catch(angular.noop);

        connectDeferred.reject(new Error('offline'));
        $rootScope.$digest();
        expect(client.phase).toBe('offline');

        jasmine.clock().tick(15000);
        expect(client.connect.calls.count()).toBe(2);
        expect(client.phase).toBe('connecting');
        jasmine.clock().uninstall();
    });

    it('disconnects to idle and cancels a scheduled retry', function() {
        jasmine.clock().install();
        client.AutoConnect().catch(angular.noop);
        connectDeferred.reject(new Error('offline'));
        $rootScope.$digest();

        client.Disconnect();
        jasmine.clock().tick(15000);

        expect(client.phase).toBe('idle');
        expect(client.connect.calls.count()).toBe(1);
        expect(client.connected).toBe(false);
        jasmine.clock().uninstall();
    });
});

describe('uTorrent connection lifecycle', function() {
    var $q;
    var $rootScope;
    var uTorrent;

    beforeEach(module('DuckieTorrent.torrent'));

    beforeEach(inject(function(_$q_, _$rootScope_, _uTorrent_) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        uTorrent = _uTorrent_;
        localStorage.setItem('utorrent.token', 'token');
        localStorage.removeItem('utorrent.preventconnecting');
        spyOn(uTorrent, 'Scan').and.returnValue($q.when(10000));
        spyOn(uTorrent, 'connect').and.returnValue($q.when({ session: 'session' }));
    }));

    afterEach(function() {
        uTorrent.Disconnect();
        localStorage.removeItem('utorrent.token');
    });

    it('shares connection work and waits for the first empty update', function() {
        jasmine.clock().install();
        spyOn(uTorrent, 'statusQuery').and.returnValues($q.when([{}]), $q.when([]));

        var first = uTorrent.AutoConnect();
        var second = uTorrent.AutoConnect();
        expect(second).toBe(first);
        $rootScope.$digest();
        expect(uTorrent.getPhase()).toBe('synchronizing');

        jasmine.clock().tick(0);
        $rootScope.$digest();
        expect(uTorrent.getPhase()).toBe('ready');
        expect(uTorrent.isConnected()).toBe(true);
        expect(uTorrent.statusQuery.calls.count()).toBe(2);
        jasmine.clock().uninstall();
    });
});

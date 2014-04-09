/**
 * Handle global dependencies
 */


angular.module('DuckieTV', [
    'ngRoute',
    'xml',
    'datePicker',
    'ui.bootstrap',
    'DuckieTV.providers.episodeaired',
    'DuckieTV.providers.eventwatcher',
    'DuckieTV.providers.eventscheduler',
    'DuckieTV.providers.favorites',
    'DuckieTV.providers.filereader',
    'DuckieTV.providers.googleimages',
    'DuckieTV.providers.imdb',
    'DuckieTV.providers.kickasstorrents',
    'DuckieTV.providers.mirrorresolver',
    'DuckieTV.providers.notifications',
    'DuckieTV.providers.piratebayChecker',
    'DuckieTV.providers.scenenames',
    'DuckieTV.providers.settings',
    'DuckieTV.providers.storagesync',
    'DuckieTV.providers.thepiratebay',
    'DuckieTV.providers.thetvdb',
    'DuckieTV.providers.torrentfreak',
    'DuckieTV.providers.trakttv',
    'DuckieTV.providers.watchlistchecker',
    'DuckieTV.providers.watchlist',
    'DuckieTV.controllers.main',
    'DuckieTV.controllers.episodes',
    'DuckieTV.controllers.serie',
    'DuckieTV.controllers.settings',
    'DuckieTV.controllers.timer',
    'DuckieTV.controllers.watchlist',
    'DuckieTV.directives.calendar',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.backgroundrotator',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.lazybackground',
    'DuckieTV.directives.torrentdialog',
    'colorpicker.module'
])

/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {
    $httpProvider.interceptors.push('xmlHttpInterceptor');
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})


/**
 * Unsafe HTML entities passthrough.
 * (Used for for instance typeAheadIMDB.html)
 */
.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
})
/**
 * Routing configuration.
 */
.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'templates/home.html',
            controller: 'MainCtrl'
        })
        .when('/watchlist', {
            templateUrl: 'templates/watchlist.html',
            controller: 'WatchlistCtrl'
        })
        .when('/series/:id', {
            templateUrl: 'templates/serie.html',
            controller: 'SerieCtrl'
        })
        .when('/serie/:id/episode/:episode', {
            templateUrl: 'templates/episode.html',
            controller: 'EpisodeCtrl'
        })
        .when('/timers', {
            templateUrl: 'templates/timers.html',
            controller: 'TimerCtrl'
        })
        .when('/settings', {
            templateUrl: 'templates/settings.html',
            controller: 'SettingsCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}).run(function($rootScope, SettingsService, StorageSyncService, $dialogs, TraktTV, FavoritesService, $q) {

    $rootScope.getSetting = function(key) {
        return SettingsService.get(key);
    }

    $rootScope.setSetting = function(key, value) {
        return SettingsService.set(key, value);
    }

    $rootScope.enableSetting = function(key) {
        SettingsService.set(key, true);
    }

    $rootScope.disableSetting = function(key) {
        SettingsService.set(key, false);
    }

    $rootScope.$on('storage:update', function() {
        /* if ($rootScope.getSetting('storage.sync') == true) {
            console.log("STorage sync can run!");
            StorageSyncService.readIfSynced();
            StorageSyncService.synchronize();
        }*/
    });

    if (!localStorage.getItem('0.4migration')) {

        var out = {
            settings: {},
            series: {}
        };
        var done = 1;
        var homany = 0;

        var addDone = function() {
            done = done + 1;
        }
        var isDone = function() {
            console.log('is done? ', done, howmany);
            return done > howmany;
        }


        var dlg = $dialogs.wait('Please wait while updating database', 'one-time database upgrade in progress', 0);

        var addFave = function(TVDB_ID, watched) {
            console.log("Add fave: ", TVDB_ID, watched)
            var p = $q.defer();
            $rootScope.$broadcast('dialogs.wait.progress', {
                'header': 'Please wait while updating database',
                'progress': (100 / howmany) * (done + 0.2),
                'msg': "Resolving show " + TVDB_ID
            });
            TraktTV.enableBatchMode().findSerieByTVDBID(TVDB_ID).then(function(serie) {
                $rootScope.$broadcast('dialogs.wait.progress', {
                    'header': 'Please wait while updating database',
                    'progress': (100 / howmany) * (done + 0.6),
                    'msg': "Show found: " + serie.title + ". Updating information. "
                });
                FavoritesService.addFavorite(serie, watched).then(function() {
                    addDone();
                    $rootScope.$broadcast('dialogs.wait.progress', {
                        header: 'Please wait while updating database',
                        'progress': (100 / howmany) * done,
                        'msg': "Updating: " + serie.title
                    });
                    p.resolve();
                }, function() {
                    p.reject();
                });
            });
            return p.promise;
        }

        CRUD.EntityManager.getAdapter().db.execute('select Series.TVDB_ID from Series').then(function(series) {
            var out = {
                settings: {},
                series: {}
            };
            var pq = [];
            while (serie = series.next()) {
                out.series[serie.get('TVDB_ID')] = [];
            }
            CRUD.EntityManager.getAdapter().db.execute('select Series.TVDB_ID, Episodes.TVDB_ID as epTVDB_ID, Episodes.watchedAt from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.watchedAt is not null').then(function(res) {
                while (row = res.next()) {
                    if (!out.series[row.get('TVDB_ID')]) {
                        out.series[row.get('TVDB_ID')] = [];
                    }
                    out.series[row.get('TVDB_ID')].push({
                        'TVDB_ID': row.get('epTVDB_ID'),
                        'watchedAt': new Date(row.get('watchedAt')).getTime()
                    })
                }
                howmany = Object.keys(out.series).length;
                if (howmany == 0) {
                    localStorage.setItem('0.4migration', 'done');
                }
                var p = false;
                angular.forEach(out.series, function(watched, TVDB_ID) {
                    pq.push(addFave(TVDB_ID, watched));
                });
                $q.all(pq).then(function(res) {
                    $rootScope.$broadcast('dialogs.wait.message', "All series processed!");
                    if (isDone()) {
                        $rootScope.$broadcast('favorites:updated', FavoritesService);
                        $rootScope.$broadcast('dialogs.wait.complete');
                        localStorage.setItem('0.4migration', 'done');
                    }
                });
            });



        });

    }
})
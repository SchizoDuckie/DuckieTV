/**
 * Handle global dependencies
 */
var DuckieTV = angular.module('DuckieTV', [
    'formly',
    'formlyBootstrap',
    'xmlrpc',
    'ct.ui.router.extras.core',
    'ct.ui.router.extras.sticky',
    'ngLocale',
    'ngAnimate',
    'ngMessages',
    'tmh.dynamicLocale',
    'ui.bootstrap',
    'dialogs.main',
    'pascalprecht.translate',
    'DuckieTorrent.torrent',
    'toaster',
    'angular-dialgauge'
])

/**
 * Disable debug info for speed improvements
 */
.config(['$compileProvider', function($compileProvider) {
    if (localStorage.getItem('optin_error_reporting')) {
        $compileProvider.debugInfoEnabled(true);
    } else {
        $compileProvider.debugInfoEnabled(false);
    }
}])

/**
 * Unsafe HTML entities pass-through.
 * (Used for for instance typeAheadIMDB.html)
 */
.filter('unsafe', ["$sce",
    function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    }
])

/**
 * DuckietvReload service is injected whenever a window.location.reload is required,
 * which ensures that standalone gets some pre-processing done before actioning
 * the window.location.reload()  fixes #569
 */
.service('DuckietvReload', function() {
    var service = {
        windowLocationReload: function() {
            if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1)) {
                // reload for standalones
                //console.debug('DuckietvReload for standalone');
                require('nw.gui').Window.get().emit('locationreload');
            } else {
                // reload for non-standalone
                //console.debug('DuckietvReload for non-standalone');
                window.location.reload();
            }
        }
    };
    return service;
})

/**
 * BackupService is injected whenever a backup is requested
 *
 * The backup format is a simple JSON file that has the following structure:
 *
 * {
 * "settings": {
 *   // serialized settings
 * },
 * "series": {
 *  <SHOW_TVDB_ID> : [ // array of objects
 *      {
 *          "displaycalendar": 1||0,
 *          "autoDownload": 1||0,
 *          "customSearchString": <string>||null,
 *          "ignoreGlobalQuality": 1||0,
 *          "ignoreGlobalIncludes": 1||0,
 *          "ignoreGlobalExcludes": 1||0,
 *          "searchProvider": <string>||null,
 *          "ignoreHideSpecials": 1||0,
 *          "customSearchSizeMin": <integer>||null,
 *          "customSearchSizeMax": <integer>||null,
 *          "dlPath": <string>||null,
 *          "customDelay": <integer>||null,
 *      },
 *      {
 *          "TVDB_ID": <Episode_TVDB_ID>,
 *          "watchedAt": <timestamp watchedAt>||null,
 *          "downloaded": 1
 *      },
 *      // repeat
 *    ],
 *    // repeat
 *  }
 */
.service('BackupService', function() {
    var service = {
        createBackup: function() {
            // Fetch all the series
            return CRUD.executeQuery('select Series.TVDB_ID, Series.displaycalendar, Series.autoDownload, Series.customSearchString, Series.ignoreGlobalQuality, Series.ignoreGlobalIncludes, Series.ignoreGlobalExcludes, Series.searchProvider, Series.ignoreHideSpecials, Series.customSearchSizeMin, Series.customSearchSizeMax, Series.dlPath, Series.customDelay from Series').then(function(series) {
                var out = {
                    settings: {},
                    series: {}
                };
                // Store all the settings
                for (var i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).indexOf('database.version') > -1) continue;
                    if (localStorage.key(i).indexOf('trakttv.trending.cache') > -1) continue;
                    if (localStorage.key(i).indexOf('trakttv.lastupdated.trending') > -1) continue;
                    out.settings[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
                }
                // Store all the series
                while (serie = series.next()) {
                    out.series[serie.get('TVDB_ID')] = [];
                    out.series[serie.get('TVDB_ID')].push({
                        'displaycalendar': serie.get('displaycalendar', 0),
                        'autoDownload': serie.get('autoDownload', 0),
                        'customSearchString': serie.get('customSearchString'),
                        'ignoreGlobalQuality': serie.get('ignoreGlobalQuality'),
                        'ignoreGlobalIncludes': serie.get('ignoreGlobalIncludes'),
                        'ignoreGlobalExcludes': serie.get('ignoreGlobalExcludes'),
                        'searchProvider': serie.get('searchProvider'),
                        'ignoreHideSpecials': serie.get('ignoreHideSpecials'),
                        'customSearchSizeMin': serie.get('customSearchSizeMin'),
                        'customSearchSizeMax': serie.get('customSearchSizeMax'),
                        'dlPath': serie.get('dlPath'),
                        'customDelay': serie.get('customDelay')
                    })
                }
                // Store watched episodes for each serie
                return CRUD.executeQuery('select Series.TVDB_ID, Episodes.TVDB_ID as epTVDB_ID, Episodes.watchedAt, Episodes.downloaded from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.downloaded == 1 or  Episodes.watchedAt is not null').then(function(res) {
                    while (row = res.next()) {
                        out.series[row.get('TVDB_ID')].push({
                            'TVDB_ID': row.get('epTVDB_ID'),
                            'watchedAt': new Date(row.get('watchedAt')).getTime(),
                            'downloaded': 1
                        })
                    }
                    var blob = new Blob([angular.toJson(out, true)], {
                        type: 'text/json'
                    });
                    return URL.createObjectURL(blob);
                })
            })
        }
    };
    return service;
})

/**
 * add mixed case fontFamily if user enabled
 */
.run(['SettingsService', function(SettingsService) {
    if (SettingsService.get('display.mixedcase')) {
        function init() {
            var x = document.createElement("link");
            var y = document.createAttribute("rel");
            y.value = "stylesheet";
            x.setAttributeNode(y);
            var z = document.createAttribute("href");
            z.value = "css/main_2.css";
            x.setAttributeNode(z);
            document.head.appendChild(x);
        }
        window.onload = init;
    }
}])

/**
 * at start-up set up a timer to refresh DuckieTV a second after midnight, to force a calendar date refresh
 */
.run(["$injector", function($injector) {
    var today = new Date();
    var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    var timeToMidnight = (tommorow - today) + 1000; // a second after midnight
    var timer = setTimeout(function() {
        $injector.get('DuckietvReload').windowLocationReload();
    }, timeToMidnight);
}])

.run(["$rootScope", "$state", function($rootScope, $state) {
    $rootScope.$on('$stateChangeStart',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }
            Object.keys(toState.views).map(function(viewname) {
                var view = document.querySelector("[ui-view=" + viewname.split('@')[0] + "]");
                if (view) view.classList.add('ui-loading');
            });
        });

    $rootScope.$on('$stateChangeSuccess',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }
            Object.keys(toState.views).map(function(viewname) {
                var view = document.querySelector("[ui-view=" + viewname.split('@')[0] + "]");
                if (view) view.classList.remove('ui-loading');
            });
        });
}])

/**
 * at start-up set up a timer for the autoBackup
 */
.run(["$injector", "$http", "$filter", "SettingsService", "FavoritesService", "dialogs",
    function($injector, $http, $filter, SettingsService, FavoritesService, dialogs) {
        /*
         * creates timer to schedule an autoBackup
         */
        var scheduleAutoBackup = function() {
            setTimeout(function() {
                // wait for FavoritesService to be available
                if (FavoritesService.initialized == true) {
                    // only do the backup if there are shows in favorites.
                    if (FavoritesService.favoriteIDs.length !== 0) {
                        if (timeToNextBackup <= 0) {
                            console.info('Scheduled autoBackup run at ', new Date());
                            $injector.get('BackupService').createBackup().then(function(backupString) {
                                var backupTime = new Date();
                                dialogs.create('templates/dialogs/backup.html', 'backupDialogCtrl', {
                                    backupString: backupString,
                                    backupTime: backupTime
                                }, {
                                    size: 'lg'
                                });
                            });
                        }
                    } else {
                        console.info('autoBackup is not required as there are no shows in favourites yet.');
                    }
                } else {
                    setTimeout(function() {
                        scheduleAutoBackup();
                    }, 1000);
                }
            }, timeToNextBackup);
        };
        var autoBackupPeriod = SettingsService.get('autobackup.period');
        if (autoBackupPeriod === 'never') {
            console.warn('autoBackup is set to never be scheduled');
            return; // autoBackup is not requested
        }
        // fetch last run time
        var localDT = new Date().getTime();
        if (!localStorage.getItem('autobackup.lastrun')) {
            localStorage.setItem('autobackup.lastrun', 0);
        }
        // determine next run time
        var lastRun = new Date(parseInt(localStorage.getItem('autobackup.lastrun')));
        var nextBackupDT = null;
        switch (autoBackupPeriod) {
            case 'daily':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 1, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                break;
            case 'weekly':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 7, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                break;
            case 'monthly':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth() + 1, lastRun.getDate(), lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                break;
            default:
                console.error('unexpected autoBackupPeriod', autoBackupPeriod);
        }
        // schedule the timer for the next backup
        var timeToNextBackup = (nextBackupDT - localDT);
        if (timeToNextBackup > 0) {
            console.info('The next autoBackup is scheduled for', new Date(parseInt(nextBackupDT)));
        } else {
            timeToNextBackup = 0;
        }
        scheduleAutoBackup();
    }
])

/**
 * controller for the autoBackup dialogue
 */
.controller('backupDialogCtrl', ['$scope', "$uibModalInstance", "data",
    function($scope, $modalInstance, data) {
        $scope.backupString = data.backupString;
        $scope.backupTime = data.backupTime;

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        $scope.saved = function() {
            $modalInstance.dismiss('Canceled');
            localStorage.setItem('autobackup.lastrun', new Date().getTime());
        };
    }
])

/**
 * at start-up set up some formly custom types
 */
.run(["formlyConfig",
    function(formlyConfig) {
      /**
     * define a form wrapper for formly type=number to provide error message support.
     */
    formlyConfig.setWrapper([
      {
        template: [
            '<div class="formly-template-wrapper form-group"',
                'ng-class="{\'has-error\': options.validation.errorExistsAndShouldBeVisible}">',
                '<formly-transclude></formly-transclude>',
                '<div class="alert alert-danger"',
                    'ng-if="options.validation.errorExistsAndShouldBeVisible"',
                    'ng-messages="options.formControl.$error">',
                    '<div ng-message="{{::name}}" ng-repeat="(name, message) in ::options.validation.messages">',
                        '{{message(options.formControl.$viewValue, options.formControl.$modelValue, this)}}',
                    '</div>',
                '</div>',
            '</div>'
        ].join(' '),
        types: ['integer', 'delay']
        }
    ]);

    /**
     * define a custom extension to formly type=input, so the wrapper above gets tied to only type=integer instead of all of the input types.
     */
    formlyConfig.setType({
        name: "integer",
        extends: "input",
      defaultOptions: function(options) {
        return {
          templateOptions: {
            type: "number",
            pattern: "[0-9]{0,}",
            label: "",
            placeholder: ""
          }
        }
      }
    });

    /**
     * define a custom extension to formly type=input, so the wrapper above can be tied to it.
     */
    formlyConfig.setType({
        name: "delay",
        extends: "input",
      defaultOptions: function(options) {
        return {
          templateOptions: {
            type: "text",
            label: "",
            placeholder: ""
          }
        }
      }
    });

      /**
     * define a custom extension to formly type=input, which defines a html input type=file dialog, that fetches a directory path instead of a file.
     */
    formlyConfig.setType({
        name: 'directory',
        extends: 'input',
        template: [
            '&nbsp;',
            '{{model[options.key]}}',
            '<input type="file"',
                'downloadpath="model[options.key]"',
                'nwdirectory directory',
            '/>'
        ].join(' ')
    });

    /**
     * define a custom formly type=button.
     */
    formlyConfig.setType({
        name: 'button',
        template: [
            '<div>',
                '<button type="{{::to.type}}"',
                    'class="btn btn-{{::to.btnType}}"',
                    'ng-click="onClick($event)">',
                    '{{to.text}}',
                '</button>',
            '</div>'
        ].join(' '),
        wrapper: ['bootstrapLabel'],
        defaultOptions: {
            templateOptions: {
            btnType: 'default',
            type: 'button'
            },
            extras: {
            skipNgModelAttrsManipulator: true // <-- performance optimization because this type has no ng-model
            }
        },
        controller: ["$scope", function($scope) {
        $scope.onClick = onClick;
            function onClick($event) {
                if (angular.isString($scope.to.onClick)) {
                    return $scope.$eval($scope.to.onClick, {$event: $event});
                } else {
                    return $scope.to.onClick($event);
                }
            }
        }],
        apiCheck: function(check) {
            return {
                templateOptions: {
                    onClick: check.oneOfType([check.string, check.func]),
                    type: check.string.optional,
                    btnType: check.string.optional,
                    text: check.string
                }
            }
        }
    });
}]);

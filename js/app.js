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
 */
.filter('unsafe', ["$sce",
    function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    }
])

/**
 * Filter for calendar events as used by templates/datepicker.html for instance.
 */
.filter('filterEvents',
    function() {
        return function(events) {
            return events.filter(function(event) {
                if (!event.serie) return false;
                if (event.serie.displaycalendar == 0) return false;
                else return true;
            })
        }
    }
)

/**
 * at start-up set up a timer to refresh DuckieTV a second after midnight, to force a calendar date refresh
 */
.run([function() {
    var today = new Date();
    var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    var timeToMidnight = (tommorow - today) + 1000; // a second after midnight
    var timer = setTimeout(function() {
        window.location.reload();
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
 * setting platform specific defaults (uTorrent for windows, uTorrent Web UI or non-windows)
 */
.run(['SettingsService', function(SettingsService) {
    if (!localStorage.getItem('torrenting.client')) {
        if (navigator.platform.toLowerCase().indexOf('win') !== -1) {
            localStorage.setItem('torrenting.client', 'uTorrent'); // default for windows platforms
            SettingsService.set('torrenting.client', 'uTorrent'); // for use in templates
        } else {
            localStorage.setItem('torrenting.client', 'uTorrent Web UI'); // default for non-windows platforms
            SettingsService.set('torrenting.client', 'uTorrent Web UI'); // for use in templates
        }
    } else {
        if (localStorage.getItem('torrenting.client') === 'uTorrent' && navigator.platform.toLowerCase().indexOf('win') === -1) {
            localStorage.setItem('torrenting.client', 'uTorrent Web UI'); // override for non-windows platforms prior to #592
            SettingsService.set('torrenting.client', 'uTorrent Web UI'); // for use in templates
        }
    }
}])

/**
 * at start-up set up some formly custom types
 */
.run(["formlyConfig",
    function(formlyConfig) {
        /**
         * define a form wrapper for formly type=number to provide error message support.
         */
        formlyConfig.setWrapper([{
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
        }]);

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
                        return $scope.$eval($scope.to.onClick, {
                            $event: $event
                        });
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
    }
]);
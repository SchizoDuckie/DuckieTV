/*
 * Controller for the language settings tab
 */
DuckieTV.controller('LanguageCtrl', ['$scope', 'SettingsService', 'LocaleRegistry',
  function($scope, SettingsService, LocaleRegistry) {
    $scope.activeLocale = SettingsService.get('application.locale')
    $scope.clientLocale = SettingsService.get('client.determinedlocale')

    // Set up the language list used in settings/display template
    $scope.languageList = LocaleRegistry.selectable

    // Change localization an translations, reloads translation table.
    $scope.setLocale = function(lang) {
      $scope.activeLocale = SettingsService.changeLanguage(lang)
      window.location.reload()
    }

    // test if determined locale is one of our supported languages
    $scope.isSupported = function(lang) {
      return LocaleRegistry.isSupported(lang)
    }
  }
])

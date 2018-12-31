DuckieTV.controller('SubtitlesCtrl', ['OpenSubtitles', 'SettingsService',
  function(OpenSubtitles, SettingsService) {
    var vm = this
    var allLanguages = OpenSubtitles.getLangages()
    var reverseLanguages = {}

    Object.keys(allLanguages).map(function(key) {
      reverseLanguages[allLanguages[key]] = key
    })

    vm.languages = Object.keys(allLanguages).map(function(key) {
      return allLanguages[key]
    })
    vm.codes = OpenSubtitles.getShortCodes()

    vm.enabled = SettingsService.get('subtitles.languages')

    vm.isEnabled = function(code) {
      return vm.enabled.indexOf(reverseLanguages[code]) > -1
    }

    vm.getShortCode = function(lang) {
      return vm.codes[reverseLanguages[lang]]
    }

    vm.getEnabledLanguages = function() {
      vm.enabledLanguages = vm.enabled.map(function(code) {
        return allLanguages[code]
      }).join(', ')
      return vm.enabledLanguages
    }

    vm.selectNone = function() {
      SettingsService.set('subtitles.languages', [])
      vm.enabled = []
      vm.enabledLanguages = ''
    }

    vm.toggleSubtitle = function(language) {
      console.debug('togglesubtitle', language, reverseLanguages[language])
      var lang = reverseLanguages[language]
      if (vm.enabled.indexOf(lang) === -1) {
        vm.enabled.push(lang)
      } else {
        vm.enabled.splice(vm.enabled.indexOf(lang), 1)
      }

      SettingsService.set('subtitles.languages', vm.enabled)
      vm.getEnabledLanguages()
    }

    vm.getEnabledLanguages()
  }
])

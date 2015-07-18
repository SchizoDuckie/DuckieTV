DuckieTV.controller('SubtitlesCtrl', ['OpenSubtitles', 'SettingsService',
    function(OpenSubtitles, SettingsService) {
        var vm = this;
        var allLanguages = OpenSubtitles.getLangages();
        var reverseLanguages = {};

        Object.keys(allLanguages).map(function(key) {
            reverseLanguages[allLanguages[key]] = key;
        });

        this.languages = Object.keys(allLanguages).map(function(key) {
            return allLanguages[key];
        });
        this.codes = OpenSubtitles.getShortCodes();

        this.enabled = SettingsService.get('subtitles.languages');

        this.isEnabled = function(code) {
            return this.enabled.indexOf(reverseLanguages[code]) > -1;
        };

        this.getShortCode = function(lang) {
            return this.codes[reverseLanguages[lang]];
        };

        this.getEnabledLanguages = function() {
            this.enabledLanguages = this.enabled.map(function(code) {
                return allLanguages[code];
            }).join(', ');
            return this.enabledLanguages;
        };

        this.selectNone = function() {
            SettingsService.set('subtitles.languages', []);
            this.enabled = [];
            this.enabledLanguages = '';
        };

        this.toggleSubtitle = function(language) {
            console.debug('togglesubtitle', language, reverseLanguages[language]);
            var lang = reverseLanguages[language];
            if (this.enabled.indexOf(lang) === -1) {
                this.enabled.push(lang);
            } else {
                this.enabled.splice(this.enabled.indexOf(lang), 1);
            }
            SettingsService.set('subtitles.languages', this.enabled);
            this.getEnabledLanguages();
        };

        this.getEnabledLanguages();

    }
]);
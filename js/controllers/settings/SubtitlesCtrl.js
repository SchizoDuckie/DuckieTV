DuckieTV.controller('SubtitlesCtrl', ['OpenSubtitles', 'SettingsService',
    function(OpenSubtitles, SettingsService) {
        var vm = this;

        this.languages = OpenSubtitles.getLangages();
        this.codes = OpenSubtitles.getShortCodes();

        this.enabled = SettingsService.get('subtitles.languages');

        this.isEnabled = function(code) {
            return this.enabled.indexOf(code) > -1;
        };

        this.getShortCode = function(code) {
            return this.codes[code];
        };

        this.getEnabledLanguages = function() {
            this.enabledLanguages = this.enabled.map(function(code) {
                return vm.languages[code];
            }).join(', ');
            return this.enabledLanguages;
        };

        this.selectNone = function() {
            SettingsService.set('subtitles.languages', []);
            this.enabled = [];
            this.enabledLanguages = '';
        };

        this.toggleSubtitle = function(language) {
            console.log('togglesubtitle', language);
            if (this.enabled.indexOf(language) === -1) {
                this.enabled.push(language);
            } else {
                this.enabled.splice(this.enabled.indexOf(language), 1);
            }
            SettingsService.set('subtitles.languages', this.enabled);
            this.getEnabledLanguages();
        };

        this.getEnabledLanguages();

    }
]);
DuckieTV.controller('SubtitlesCtrl', ['OpenSubtitles', 'SettingsService',
    function(OpenSubtitles, SettingsService) {

        this.languages = OpenSubtitles.getLangages();
        this.enabled = SettingsService.get('subtitles.languages');

        this.isEnabled = function(code) {
            return this.enabled.indexOf(code) > -1;
        };

        this.toggleSubtitle = function(language) {
            console.log('togglesubtitle', language);
            if (this.enabled.indexOf(language) === -1) {
                this.enabled.push(language);
            } else {
                this.enabled.splice(this.enabled.indexOf(language), 1);
            }
            SettingsService.set('subtitles.languages', this.enabled);
            console.log(this.enabled);
        };

    }
]);
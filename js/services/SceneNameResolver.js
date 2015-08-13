/**
 * Scene name provider
 * Resolves TheTvDB ID's into something that you can use on search engines.
 */
DuckieTV.factory('SceneNameResolver', ["$q", "$http", "SceneXemResolver",
    function($q, $http, SceneXemResolver) {

        var self = this;
        // credits to Sickbeard's exception list https://raw.github.com/midgetspy/sb_tvdb_scene_exceptions/gh-pages/exceptions.txt
        // filters applied:
        // - Remove :
        // - Remove \(([12][09][0-9]{2})\) (all years between 19* and 20* within () )
        // - replace \' with '
        // - replace surrounding " with '
        // remove (US)
        // line sort

        var episodesWithDateFormat = null;

        var exceptions = null;

        return {
            /**
             * Return the scene name of the provided TVDB_ID if it's in the list.
             */
            getSceneName: function(tvdbID, name) {
                tvdbID = parseInt(tvdbID);
                return (tvdbID in exceptions) ? exceptions[tvdbID].replace(/\(([12][09][0-9]{2})\)/, '').replace('!', '').replace(' and ', ' ').replace(/\'/g, '') : name;
            },

            getSearchStringForEpisode: function(serie, episode) {
                if (serie.TVDB_ID in episodesWithDateFormat) {
                    var parts = episode.firstaired_iso.split(/([0-9]{4})-([0-9]{2})-([0-9]{2})T.*/);
                    if ("undefined" == typeof(moment)) {
                        moment = require('./js/vendor/moment.min');
                    }
                    return moment.tz(episode.firstaired_iso, serie.timezone).format(episodesWithDateFormat[serie.TVDB_ID]);
                } else {

                    return SceneXemResolver.getEpisodeMapping(serie, episode);
                }
            },

            initialize: function() {
                $http.get('SceneNameExceptions.json').then(function(result) {
                    exceptions = result.data;
                    return exceptions;
                });

                $http.get('SceneDateExceptions.json').then(function(result) {
                    episodesWithDateFormat = JSON.parse(result.data.split('*/')[1]);
                    return exceptions;
                });
            },
            /**
             * @todo: fetch updates, store in localstorage, make initialize check localstorage.
             */
            updateCheck: function() {
                //
            }
        };

    }
])

.run(["SceneNameResolver", "SettingsService",
    function(SceneNameResolver, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            SceneNameResolver.initialize();
        }
    }
]);
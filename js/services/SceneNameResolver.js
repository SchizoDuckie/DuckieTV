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

        var episodesWithDateFormat = {
            70366: "EEE, MMM D, YYYY", // Days of our lives:  Thu, Nov 6, 2014 
            71256: "YYYY.MM.DD", // The Daily Show : 2014.11.13.
            71998: "YYYY.MM.DD", // Jimmy Kimmel Live: 2014.11.13
            72194: "YYYY.MM.DD", // The Ellen DeGeneres Show: 2014.11.13 
            72231: "YYYY MM DD", // Real Time With Bill Maher
            72289: "YYYY MM DD", // 2020 US 2015 06 05
            75332: "DD MMM YY", // General Hospital : 20 Nov 14
            77075: "YYYY-MM-DD", // Jeopardy! 2014-05-27
            79274: "YYYY.MM.DD", // The Colbert Report: 2014.11.13 
            85355: "YYYY.MM.DD", // Late Night with Jimmy Fallon: 2014.11.13
            194751: "YYYY MM DD", // Conan 2015 02 17
            261676: "YYYY MM DD", // wwe superstars: 2014 11 20
            270262: "YYYY MM DD", // Late Night with Seth Meyers: 2014.11.13 
            274099: "YYYY.MM.DD" // @midnight: 2014.11.13
        };

        var exceptions = null;
        var fetching = null;

        function fetchExceptions() {
            return $q(function(resolve, reject) {
                if (exceptions !== null) {
                    resolve(exceptions);
                }
                return $http.get('SceneNameExceptions.json').then(function(results) {
                    console.info("fetched scene name exceptions!");
                    exceptions = results;
                    resolve(eceptions);
                });
            });
        }

        return {
            /** 
             * Return the scene name of the provided TVDB_ID if it's in the list.
             */
            getSceneName: function(tvdbID, name) {
                return fetchExceptions().then(function(exceptions) {
                    return (tvdbID in exceptions) ? exceptions[tvdbID].replace(/\(([12][09][0-9]{2})\)/, '').replace('!', '').replace(' and ', ' ').replace(/\'/g, '') : name;
                });
            },

            getSearchStringForEpisode: function(serie, episode) {
                if (serie.TVDB_ID in episodesWithDateFormat) {
                    var parts = episode.firstaired_iso.split(/([0-9]{4})-([0-9]{2})-([0-9]{2})T.*/);
                    if ("undefined" == typeof(moment)) {
                        moment = require('./js/vendor/moment.min');
                    }
                    return moment.tz(episode.firstaired_iso, serie.timezone).format(episodesWithDateFormat[serie.TVDB_ID]);
                } else {
                    //return SceneXemResolver.getEpisodeMapping(serie, episode);
                    return episode.getFormattedEpisode();
                }
            }
        };

    }
]);
/**
 * Service to fetch subtiles for an episode
 */
DuckieTV.factory('OpenSubtitles', ["xmlrpc",
    function(xmlrpc) {
        var self = this,
            token = null;

        xmlrpc.config({
            hostName: "http://api.opensubtitles.org", // Default is empty
            pathName: "/xml-rpc", // Default is /rpc2
            401: function() {
                console.log("You shall not pass !");
            },
            404: function() {
                console.log("Subtitle not found");
            },
            500: function() {
                console.log("Something went wrong :(");
            }
        });

        var parseSubtitles = function(data, query) {
            var output = [];

            data.data.map(function(sub) {

                if (sub.SubFormat !== 'srt') {
                    return;
                }

                if (query.season && query.episode) {
                    if (parseInt(sub.SeriesIMDBParent) !== parseInt(query.imdbid.replace('tt', '')) || sub.SeriesSeason.toString() !== query.season.toString() || sub.SeriesEpisode.toString() !== query.episode.toString()) {
                        return;
                    }
                }

                sub.url = sub.SubDownloadLink.replace('.gz', '.srt');

                output.push(sub);

            });

            return output;
        }


        var login = function() {
            return xmlrpc.callMethod('LogIn', ['', '', 'en', 'DuckieTV v1.00']).then(function(result) {
                self.token = result.token;
                return self.token;
            })
        }

        var service = {
            searchEpisode: function(serie, episode) {
                return service.search({
                    imdbid: serie.IMDB_ID.replace('tt', ''),
                    season: episode.seasonnumber,
                    episode: episode.episodenumber
                });
            },
            searchFilename: function(filename) {
                return service.search({
                    tag: filename
                })
            },
            search: function(options) {
                return login().then(function(token) {
                    options.sublanguageid = 'all'
                    return xmlrpc.callMethod('SearchSubtitles', [token, [options]]).then(function(results) {
                        return parseSubtitles(results, options);
                    })
                });
            }
        };

        return service;
    }
]);
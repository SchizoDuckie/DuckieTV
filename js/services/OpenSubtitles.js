/**
 * Service to fetch subtiles for an episode
 */
DuckieTV.factory('OpenSubtitles', ["xmlrpc", "SettingsService",
    function(xmlrpc, SettingsService) {
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
            if (!data.data) return output;
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
        };


        var login = function() {
            return xmlrpc.callMethod('LogIn', ['', '', 'en', 'DuckieTV v1.00']).then(function(result) {
                self.token = result.token;
                return self.token;
            });
        };

        var languages = {
            'alb': 'Albanian',
            'ara': 'Arabic',
            'baq': 'Basque',
            'bul': 'Bulgarian',
            'cat': 'Catalan',
            'chi': 'Chinese (simplified)',
            'cze': 'Czech',
            'dan': 'Danish',
            'dut': 'Dutch',
            'eng': 'English',
            'epo': 'Esperanto',
            'est': 'Estonian',
            'fin': 'Finnish',
            'fre': 'French',
            'geo': 'Georgian',
            'ger': 'German',
            'glg': 'Galician',
            'ell': 'Greek',
            'heb': 'Hebrew',
            'hin': 'Hindi',
            'hrv': 'Croatian',
            'hun': 'Hungarian',
            'ice': 'Icelandic',
            'ind': 'Indonesian',
            'ita': 'Italian',
            'jpn': 'Japanese',
            'khm': 'Khmer',
            'kor': 'Korean',
            'mac': 'Macedonian',
            'may': 'Malay',
            'nor': 'Norwegian',
            'oci': 'Occitan',
            'per': 'Persian',
            'pol': 'Polish',
            'por': 'Portuguese',
            'rus': 'Russian',
            'scc': 'Serbian',
            'sin': 'Sinhalese',
            'slo': 'Slovak',
            'slv': 'Slovenian',
            'spa': 'Spanish',
            'swe': 'Swedish',
            'tgl': 'Tagalog',
            'tha': 'Thai',
            'tur': 'Turkish',
            'ukr': 'Ukrainian',
            'vie': 'Vietnamese',
            'rum': 'Romanian',
            'pob': 'Brazilian',
            'zht': 'Chinese (traditional)'
        };

        var service = {
            getLangages: function() {
                return languages;
            },
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
                });
            },
            search: function(options) {
                return login().then(function(token) {
                    var configuredLang = SettingsService.get('subtitles.languages');
                    options.sublanguageid = configuredLang.length === 0 ? 'all' : configuredLang.join(',');
                    return xmlrpc.callMethod('SearchSubtitles', [token, [options]]).then(function(results) {
                        return parseSubtitles(results, options);
                    });
                });
            },
            searchString: function(query) {
                return login().then(function(token) {
                    var options = {
                            query: query
                        },
                        configuredLang = SettingsService.get('subtitles.languages');
                    options.sublanguageid = configuredLang.length === 0 ? 'all' : configuredLang.join(',');
                    return xmlrpc.callMethod('SearchSubtitles', [token, [options]]).then(function(results) {
                        return parseSubtitles(results, options);
                    });
                });
            }
        };

        return service;
    }
]);
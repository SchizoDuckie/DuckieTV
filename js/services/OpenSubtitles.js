/**
 * Service to fetch subtiles for an episode
 */
DuckieTV.factory('OpenSubtitles', ["xmlrpc", "SettingsService",
    function(xmlrpc, SettingsService) {
        var self = this,
            token = null;

        xmlrpc.config({
            hostName: "https://api.opensubtitles.org", // Default is empty
            pathName: "/xml-rpc", // Default is /rpc2
            401: function() {
                console.warn("You shall not pass !");
            },
            404: function() {
                console.info("Subtitle not found");
            },
            500: function() {
                console.error("Something went wrong :(");
            }
        });

        var parseSubtitles = function(data, query) {
            var output = [];
            if (data && 'data' in data) {
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
            } else {
                return output;
            }
        };


        var login = function() {
            return xmlrpc.callMethod('LogIn', ['', '', 'en', 'DuckieTV v1.00']).then(function(result) {
                if (result && 'token' in result) {
                    self.token = result.token;
                    return self.token;
                } else {
                    return null;
                }
            });
        };

        var languages = {
            alb: 'Albanian',
            ara: 'Arabic',
            baq: 'Basque',
            pob: 'Brazilian',
            bul: 'Bulgarian',
            cat: 'Catalan',
            chi: 'Chinese (simplified)',
            zht: 'Chinese (traditional)',
            hrv: 'Croatian',
            cze: 'Czech',
            dan: 'Danish',
            dut: 'Dutch',
            eng: 'English',
            est: 'Estonian',
            fin: 'Finnish',
            fre: 'French',
            glg: 'Galician',
            geo: 'Georgian',
            ger: 'German',
            ell: 'Greek',
            heb: 'Hebrew',
            hin: 'Hindi',
            hun: 'Hungarian',
            ice: 'Icelandic',
            ind: 'Indonesian',
            ita: 'Italian',
            jpn: 'Japanese',
            khm: 'Khmer',
            kor: 'Korean',
            mac: 'Macedonian',
            may: 'Malay',
            nor: 'Norwegian',
            per: 'Persian',
            pol: 'Polish',
            por: 'Portuguese',
            rum: 'Romanian',
            rus: 'Russian',
            scc: 'Serbian',
            sin: 'Sinhalese',
            slo: 'Slovak',
            slv: 'Slovenian',
            spa: 'Spanish',
            swe: 'Swedish',
            tgl: 'Tagalog',
            tha: 'Thai',
            tur: 'Turkish',
            ukr: 'Ukrainian',
            vie: 'Vietnamese'
        };

        var shortCodes = {
            alb: "al",
            ara: "eg",
            baq: "es",
            pob: "br",
            bul: "bg",
            cat: "es",
            chi: "cn",
            zht: "cn",
            hrv: "hr",
            cze: "cz",
            dan: "dk",
            dut: "nl",
            eng: "gb",
            est: "ee",
            fin: "fi",
            fre: "fr",
            glg: "es",
            geo: "ge",
            ger: "de",
            ell: "gr",
            heb: "il",
            hin: "in",
            hun: "hu",
            ice: "is",
            ind: "id",
            ita: "it",
            jpn: "jp",
            khm: "kh",
            kor: "kr",
            mac: "mk",
            may: "my",
            nor: "no",
            per: "ir",
            pol: "pl",
            por: "pt",
            rum: "ro",
            rus: "ru",
            scc: "rs",
            sin: "lk",
            slo: "sk",
            slv: "si",
            spa: "es",
            swe: "se",
            tgl: "ph",
            tha: "th",
            tur: "tr",
            ukr: "ua",
            vie: "vn"
        };

        var service = {
            getLangages: function() {
                return languages;
            },
            getShortCodes: function() {
                return shortCodes;
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
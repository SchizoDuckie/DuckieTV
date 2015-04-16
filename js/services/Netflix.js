DuckieTV.factory('Netflix', ["$http",
    function($http) {
        return {
            findShow: function(title) {
                return $http.get('http://www.netflix.com/api/desktop/search/instantsearch?esn=www&term=' + title).then(function(result) {
                    return result.data.galleryVideos.items[0];
                })
            },
            findEpisode: function(serieID, episodeTitle) {
                return $http.get('http://www.netflix.com/WiMovie/' + serieID).then(function(result) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(result.data, "text/html");
                    var episodes = doc.querySelectorAll('.episodes .episode');
                    target = Array.prototype.filter.call(episodes, function(episodeNode) {
                        return episodeNode.querySelector('div.title').innerText.trim().toLowerCase() == episodeTitle.toLowerCase();
                    })
                    return target.length > 0 ? target[0].querySelector('a.playButton').href : false;
                })
            },
            isLoggedIn: function() {
                return $http.get('http://www.netflix.com/YourAccount').then(function(result) {
                        console.log("logged in? ", result.data.indexOf('login-form'));
                        return result.data.indexOf('login-form') > -1 ? false : true;
                    },
                    function(error) {
                        console.log("Nog loggedin!");
                        return false;
                    })
            }
        }
    }
]);
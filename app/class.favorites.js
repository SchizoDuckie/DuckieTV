var Favorites = klass({
    faves: [],
    downloaded: {},
    today: [],
    target: '#favorites',
    element: '#favoriteslist',
    
    initialize: function() {
        $(document.body).on('click', 'button.addtofavorites', this.add.bind(this));
        $(document.body).on('click', 'input.removefromfaves', this.remove.bind(this));
        this.element = $(this.element);
        this.read();
    },
    
    add: function(e) {
        var parent = $(e.target).parent('li');
        var id = parent.attr('data-name');
        if (!this.has(id)) {
            this.faves.push({
                id: parent.attr('data-id'),
                name: parent.attr('data-name'),
                banner: parent.find('img').attr("src"),
                overview: parent.find('p').text(),
                nextepisode: 'fetching...',
                nextairdate: 'fetching...',
                date: 'fetching...'
            });
            this.save();
            window.tvDB.findEpisodes(parent.attr('data-id'), function(epis) {
                console.log("Found episodes for ", id, " after adding!");
            });
        
        }
        this.show();
    },
    
    has: function(id) {
        for (var i = 0; i < this.faves.length; i++) {
            if (this.faves[i].id == id)
                return true;
        }
        return false;
    },
    
    remove: function(e) {
        var id = $(e.target).parent('div[data-name]').attr('data-id');
        localStorage.removeItem("serie." + id);
        this.faves = this.faves.filter(function(obj) {
            return obj.id != id;
        });
        this.save();
        this.show();
    },
    
    setNextEpisode: function(show, info) {
        for (var i = 0; i < this.faves.length; i++) {
            if (this.faves[i].id == show) {
                this.faves[i].nextepisode = info;
                var next = new Date(Date.parse(info.firstaired));
                this.faves[i].nextepisode.date = next > new Date() ? 'in ' + humaneDate(next) : humaneDate(next);
                this.save();
                this.element.html(ich.showFavorites({favorites: this.faves}));
            }
        }
    },

    /**
     * Set today's episode and do an automagich tpb search for the manet link so we can show it in the notification
     */
    setTodaysEpisode: function(id, name, today, callback) {
        if(today) {
            if(!this.getDownloaded(id, today)) {
                window.thePirateBay.search(name + " S"+today.season+"E"+today.episode, function(result) {
                    if(!result.error) {
                        this.today.push({ id: id, name: name, today: today, piratebay: result });
                    }
                    callback();
                }.bind(this), 1);
            } else { // already downloaded.
                callback();
            }
        } else {
            callback();
        }
    },
    
    read: function() {
        var faves = localStorage.getItem("favorites");
        var downloaded = localStorage.getItem("downloaded");
        if (faves) this.faves = JSON.parse(faves);
        if (downloaded) this.downloaded = JSON.parse(downloaded);
        this.today = [];
    },
    
    save: function() {
        localStorage.setItem("favorites", JSON.stringify(this.faves));
        localStorage.setItem("downloaded", JSON.stringify(this.downloaded));
    },
    
    show: function() {
        this.read();
        window.location.hash = this.target;
        var processed = 0;
        for (var i = 0; i < this.faves.length; i++) {
            if (!this.faves[i].escaped)
                this.faves[i].escaped = this.faves[i].name.replace(/\'/g, "\'");
            var showID = this.faves[i].id;
            var showName = this.faves[i].name;

            window.tvDB.findEpisodes(showID, function(result) {
                window.faves.setNextEpisode(showID, window.tvDB.findNextEpisode(result.episodes));
                window.faves.setTodaysEpisode(showID, showName, window.tvDB.findTodaysEpisode(result.episodes), function() {
                    processed++;
                    console.log("processed: ", processed, this.faves.length);
                    if(processed == this.faves.length ) {
                        window.GUI.notifyUpdates(window.faves.today);
                    }
                }.bind(this));
            }.bind(this));
        }
        this.element.html(ich.showFavorites({favorites: this.faves}));
        $(document.body).append(ich.showFavorite({favorites: this.faves}));
        $("#favorites").show();
    },

    showToday: function() {
        var today = localStorage.getItem("today");
        if(today) today = JSON.parse(today);
        console.log("TOdays episodes: ", today);
        $('#episodes').append(ich.showEpisodes({episodes: today})); 
    },
    
    getDownloaded: function(show, episode) {
        if (!this.downloaded[show]) {
            return false;
        }
        return this.downloaded[show].indexOf(episode) > -1;
    },
    
    setDownloaded: function(show, episode) {
        if (!this.downloaded[show]) {
            this.downloaded[show] = [];
        }
        this.downloaded[show].push(episode);
        this.save();
    }
});
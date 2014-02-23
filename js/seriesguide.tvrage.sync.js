
angular.module('SeriesGuide.tvrage.sync',['SeriesGuide.tvrage'])
/**
 * Matches existing episodes for a serie to their TVRage_ID and synchronizes episode numbers, airdates and titles
 */
.provider('TVRageSyncService', function() {
	var self = this;
	this.TVRAGE = null;
	this.matchToTvRage = function(serie, episodes, TVRage) {
		console.debug("Fetch TVRage info for serie!");
		self.TVRage.findEpisodes(serie.TVRage_ID).then(function(tvRageEpisodes) {
			
			for(var current,i=0; i<episodes.length; i++) {
				var existing = episodes[i];
				
				// the names match with ampersands changed to and
				// or just the text without non-word characters matches (slightly different spelling)
				// or the episode title has a prefix on tvrage
				// or the episode title is different on tvrage
				current = tvRageEpisodes.filter(function(el) { 
					return (
					  (existing.firstaired == "" && parseInt(el.season,10) == existing.seasonnumber && parseInt(el.episode,10) == existing.episodenumber) ||
					  (el.title.toLowerCase().trim() == existing.episodename.toLowerCase().trim()) ||
					  (existing.episodename.length > 0 && el.title.toLowerCase().match(/([a-z])+/g).join('') == existing.episodename.toLowerCase().match(/([a-z])+/g).join('')) ||
		 			  (el.title.toLowerCase().trim() == existing.episodename.replace('and', '&').toLowerCase().trim()) ||
		 			  (el.airdate == existing.firstaired && parseInt(existing.episodenumber,10) == parseInt(el.episode,10)) ||
		 			  (el.title.length > 0 && existing.episodename.length > 0 && (el.title.indexOf(existing.episodename) > -1 || existing.episodename.indexOf(el.title) > -1 ))
		 			);
				});
				
				
				if(current.length > 0) {
					current = current[0];
					existing.episodenumber = current.episode;
					existing.seasonnumber = current.season;
					existing.firstaired = current.airdate;
					existing.episodename = current.title;
				
					CRUD.FindOne('Episode', {ID_Episode: existing.ID_Episode }).then(function(episode) {
						episode.set('episodenumber', this.episodenumber);
						episode.set('seasonnumber', this.seasonnumber);
						episode.set('episodename', this.episodename);
						episode.set('firstaired', this.firstaired);
						episode.Persist()
					}.bind(angular.copy(existing)));
				} else {
					console.log("Could not match on title or episodenumber and airdate!", existing, tvRageEpisodes)
				}
			}
		});
	};

	/**
	 * Either update directly when TVRage_ID is known, or fetch that first and then match. 
	 */
	this.resolveTVRageIDAndMatch = function(serie, episodes) {
		if(!serie.TVRage_ID) {
			this.TVRage.findSeriesID(serie.name).then(function(id) {
				CRUD.FindOne(Serie, { ID_Serie : serie.ID_Serie }).then(function(entity) {
					entity.set('TVRage_ID', id);
					entity.Persist();
				});
				serie.TVRage_ID = id;

				self.matchToTvRage(serie, episodes);
			});
		} else {
			self.matchToTvRage(serie, episodes);
		}
	}

	this.$get = function(TVRage) {
		self.TVRage = TVRage;
		return {
			syncEpisodes: function(serie, episodes) {
				self.resolveTVRageIDAndMatch(serie, episodes);
			}
		}
	}

})

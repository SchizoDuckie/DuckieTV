
angular.module('DuckieTV.tvrage.sync',['DuckieTV.tvrage'])
/**
 * Matches existing episodes for a serie to their TVRage_ID and synchronizes episode numbers, airdates and titles
 */
.provider('TVRageSyncService', function() {
	var self = this;
	this.TVRAGE = null;


	this.matchToTvRage = function(serie, episodes, scope) {

		var matchSeason = function(el,existing) {
			return parseInt(el.season,10) == parseInt(existing.seasonnumber,10)
		}

		var matchEpisode = function(el,existing) {
			return parseInt(el.episode,10) == parseInt(existing.episodenumber,10)
		}

		var matchFirstAired = function(el, existing) {
			return (existing.firstaired == "" && matchSeason(el,existing) && matchEpisode(el,existing));
		}

		/**
		 * Check if the episode name matches either exact(ignore case)
		 * or match by ignoring all interpunction.
		 */
		var matchByEpisodeName = function(el, existing) {
			var a = el.title.toLowerCase().trim();
			var b = existing.episodename.toLowerCase().trim().replace(' and ', ' & ');
			var aMatch = a.match(/([a-z])+/g);
			var bMatch = a.match(/([a-z])+/g);
			return (
				(a != null && b != null && a == b) ||
				(a != null && b != null &&
				 aMatch != null && bMatch != null &&
				 aMatch.join('') == bMatch.join('')
				)
			);
		}

		// only use this when seasonnumbers are messed up on thetvdb.
		// important for series like pawn stars that use a hopeless year/episodenumber format there.
		var matchByAirdateAndEpisodeNumber = function(el, existing) {
			return  (el.airdate == existing.firstaired && parseInt(existing.episodenumber,10) == parseInt(el.episode,10))
		}
		 			 

		var matchByTitleSubString = function(el, existing) {
			return (el.title.length > 0 && existing.episodename.length > 0 && (el.title.indexOf(existing.episodename) > -1 || existing.episodename.indexOf(el.title) > -1 ));
		}
		
		var updateExisting = function(existing, update) {
			console.log("Updating existing: ", existing, update);
			existing.episodenumber = update.episode;
			existing.seasonnumber = update.season;
			existing.firstaired = update.airdate;
			existing.episodename = update.title;
		
			CRUD.FindOne('Episode', {ID_Episode: existing.ID_Episode }).then(function(episode) {
				episode.set('episodenumber', this.episodenumber);
				episode.set('seasonnumber', this.seasonnumber);
				episode.set('episodename', this.episodename);
				episode.set('firstaired', this.firstaired);
				episode.Persist()
			}.bind(angular.copy(existing)));	 
		}

		var createUnmatchedEpisodes = function(serie,episodes, scope) {
			var pq = [];
			for(var i=0; i<episodes.length; i++) {
				var epi = new Episode();
				epi.set('episodenumber', episodes[i].episode);
				epi.set('seasonnumber', episodes[i].season);
				epi.set('firstaired', episodes[i].airdate);
				epi.set('episodename', episodes[i].title);
				epi.set('TVDB_ID', serie.TVDB_ID);
				epi.set('ID_Serie', serie.ID_Serie);
				pq.push(epi.Persist());
			}
			Promise.all(pq).then(function() {
				console.log("All new Episodes updated");
				console.log(scope);
				scope.$broadcast('episodes:updated');
			}, function(err) {
				console.log("ERROR persisting new episodes!", err);
			})
		}

		self.TVRage.findEpisodes(serie.TVRage_ID).then(function(tvRageEpisodes) {
			var updated = {};
			for(var updateable,i=0; i<episodes.length; i++) {
				var existing = episodes[i];
				console.log("Checking if there are updates for S%sE%s %s", existing.seasonnumber, existing.episodenumber, existing.episodename);

				updateable = tvRageEpisodes.filter(function(el) { return  matchSeason(el, existing) && matchEpisode(el, existing); });
			
				if(updateable.length > 0) {
					console.log("Found an updateable! ", updateable[0].season, updateable[0].episode, updateable[0].airdate, updateable[0].title);
					updateExisting(existing, updateable[0]);
					updated[['S',updateable[0].season,'E',updateable[0].episode].join('')] = updateable;
				} else {
					console.log("Could not match on seasonnumber and episode S%sE%s %s", existing.seasonnumber, existing.episodenumber, existing.episodename);
				}
			}
			console.log("Updated episodes! ", Object.keys(updated).join(' - '));
			var unMatched = tvRageEpisodes.filter(function(el) {
				return (!('S'+el.season+'E'+el.episode in updated));
			});
			console.log("There are more TVRAGE episodes than current episodes! \n", unMatched.map(function(el) { return ('S'+el.season+'E'+el.episode) }).join(' \n '), unMatched, episodes);
			createUnmatchedEpisodes(serie, unMatched, scope);
		});
	};

	/**
	 * Either update directly when TVRage_ID is known, or fetch that first and then match. 
	 */
	this.resolveTVRageIDAndMatch = function(serie, episodes, scope) {
		if(!serie.TVRage_ID) {
			this.TVRage.findSeriesID(serie.name).then(function(id) {
				CRUD.FindOne(Serie, { ID_Serie : serie.ID_Serie }).then(function(entity) {
					entity.set('TVRage_ID', id);
					entity.Persist();
				});
				serie.TVRage_ID = id;
				self.matchToTvRage(serie, episodes, scope);
			});
		} else {
			self.matchToTvRage(serie, episodes, scope);
		}
	}

	this.$get = function(TVRage) {
		self.TVRage = TVRage;
		return {
			syncEpisodes: function(serie, episodes, scope) {
				self.resolveTVRageIDAndMatch(serie, episodes, scope);
			}
		}
	}

})

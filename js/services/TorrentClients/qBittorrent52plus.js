/** qBittorrent 5.2+ adapter using API-key authentication. */
DuckieTorrent.factory('qBittorrent52plusAPI', ['qBittorrentAPI', 'qBittorrentAuthStrategies', function(qBittorrentAPI, authStrategies) {
  var qBittorrent52plusAPI = function() {
    qBittorrentAPI.call(this, authStrategies.apiKey)
  }
  qBittorrent52plusAPI.extends(qBittorrentAPI, {})
  return qBittorrent52plusAPI
}])

DuckieTorrent.factory('qBittorrent52plus', ['qBittorrentClientFactory', 'qBittorrent52plusAPI', function(qBittorrentClientFactory, qBittorrent52plusAPI) {
  return qBittorrentClientFactory.create({
    name: 'qBittorrent 5.2+',
    API: qBittorrent52plusAPI,
    configMappings: {
      server: 'qbittorrent52plus.server',
      port: 'qbittorrent52plus.port',
      apikey: 'qbittorrent52plus.apikey'
    }
  })
}])

DuckieTorrent.run(['DuckieTorrent', 'qBittorrent52plus', 'SettingsService', function(DuckieTorrent, qBittorrent52plus, SettingsService) {
  if (SettingsService.get('torrenting.enabled')) DuckieTorrent.register('qBittorrent 5.2+', qBittorrent52plus)
}])

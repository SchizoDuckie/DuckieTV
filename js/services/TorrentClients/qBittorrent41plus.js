/** qBittorrent 4.1+ adapter using cookie-session authentication. */
DuckieTorrent.factory('qBittorrent41plusAPI', ['qBittorrentAPI', 'qBittorrentAuthStrategies', function(qBittorrentAPI, authStrategies) {
  var qBittorrent41plusAPI = function() {
    qBittorrentAPI.call(this, authStrategies.session)
  }
  qBittorrent41plusAPI.extends(qBittorrentAPI, {})
  return qBittorrent41plusAPI
}])

DuckieTorrent.factory('qBittorrent41plus', ['qBittorrentClientFactory', 'qBittorrent41plusAPI', function(qBittorrentClientFactory, qBittorrent41plusAPI) {
  return qBittorrentClientFactory.create({
    name: 'qBittorrent 4.1+',
    API: qBittorrent41plusAPI,
    configMappings: {
      server: 'qbittorrent32plus.server',
      port: 'qbittorrent32plus.port',
      username: 'qbittorrent32plus.username',
      password: 'qbittorrent32plus.password',
      use_auth: 'qbittorrent32plus.use_auth'
    },
    endpoints: { login: '/api/v2/auth/login' }
  })
}])

DuckieTorrent.run(['DuckieTorrent', 'qBittorrent41plus', 'SettingsService', function(DuckieTorrent, qBittorrent41plus, SettingsService) {
  if (SettingsService.get('torrenting.enabled')) DuckieTorrent.register('qBittorrent 4.1+', qBittorrent41plus)
}])

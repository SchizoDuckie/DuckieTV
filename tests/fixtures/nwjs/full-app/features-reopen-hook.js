'use strict'

function finish(result) { require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2)); nw.App.quit() }
async function waitForInjector() { for (var attempt = 0; attempt < 100; attempt++) { var injector = angular.element(document).injector(); if (injector) return injector; await new Promise(function(resolve) { setTimeout(resolve, 50) }) } throw new Error('Angular injector did not start') }
window.addEventListener('load', function() {
  window.DuckieTVStorageReady.then(async function() {
    var injector = await waitForInjector()
    var backup = JSON.parse(await (await injector.get('BackupService').createBackup()).text())
    var normalized = injector.get('BackupCodec').normalize(backup)
    var episode = (await CRUD.executeQuery('SELECT watched,downloaded,watchedAt,magnetHash FROM Episodes WHERE TRAKT_ID=97003')).rows[0]
    var series = (await CRUD.executeQuery('SELECT name,displaycalendar,autoDownload FROM Series WHERE TRAKT_ID=97001')).rows[0]
    var backedUp = normalized.series.find(function(item) { return item.identity.id === 97001 })
    finish({ pass: series.name === 'Feature Matrix' && series.displaycalendar === 1 && series.autoDownload === 1 && episode.watched === 1 && episode.downloaded === 1 && Number(episode.watchedAt) === 1700000000000 && episode.magnetHash === 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' && injector.get('SettingsService').get('feature.matrix.setting') === 'exact-value' && backedUp && backedUp.episodes.length === 1 })
  }).catch(function(error) { finish({ pass: false, error: String(error.stack || error) }) })
})
setTimeout(function() { finish({ pass: false, timeout: true }) }, 30000)

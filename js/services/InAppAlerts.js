DuckieTV.factory('InAppAlerts', ['$rootScope', '$timeout', 'SettingsService', function($rootScope, $timeout, SettingsService) {
  var items = []
  var icons = {
    success: 'glyphicon-ok-sign',
    error: 'glyphicon-exclamation-sign',
    warning: 'glyphicon-warning-sign',
    info: 'glyphicon-info-sign'
  }

  function dismiss(item) {
    var index = items.indexOf(item)
    if (index === -1) return
    if (item.timer) $timeout.cancel(item.timer)
    items.splice(index, 1)
    $rootScope.$applyAsync()
  }

  function show(type, message) {
    if (!SettingsService.get('notifications.inapp') || typeof message !== 'string' || !message.trim()) return
    if (items.length >= 4) dismiss(items[0])
    if (!Object.prototype.hasOwnProperty.call(icons, type)) type = 'info'
    var item = { type: type, icon: icons[type], message: message }
    items.push(item)
    item.timer = $timeout(function() {
      item.timer = null
      dismiss(item)
    }, 7000)
    $rootScope.$applyAsync()
  }

  $rootScope.$watch(function() { return SettingsService.get('notifications.inapp') }, function(enabled) {
    if (!enabled) items.slice().forEach(dismiss)
  })

  return { items: items, show: show, dismiss: dismiss }
}])

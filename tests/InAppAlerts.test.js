describe('InAppAlerts', function() {
  var alerts, $timeout, $rootScope, enabled

  beforeEach(module('DuckieTV', function($provide) {
    enabled = true
    $provide.value('SettingsService', { get: function(key) { return key === 'notifications.inapp' && enabled } })
  }))

  beforeEach(inject(function(InAppAlerts, _$timeout_, _$rootScope_) {
    alerts = InAppAlerts
    $timeout = _$timeout_
    $rootScope = _$rootScope_
  }))

  it('dismisses individual messages and expires the rest independently', function() {
    alerts.show('success', 'Episode updated')
    alerts.show('warning', 'Episode updated')
    $timeout.flush(4000)
    alerts.show('error', 'Update failed')
    alerts.dismiss(alerts.items[0])
    expect(alerts.items.map(function(item) { return item.type })).toEqual(['warning', 'error'])
    $timeout.flush(3000)
    expect(alerts.items.map(function(item) { return item.type })).toEqual(['error'])
    $timeout.flush(4000)
    expect(alerts.items).toEqual([])
  })

  it('keeps the latest four alerts in order when more arrive', function() {
    for (var i = 1; i <= 6; i++) alerts.show('info', String(i))
    expect(alerts.items.map(function(item) { return item.message })).toEqual(['3', '4', '5', '6'])
  })

  it('clears active alerts on opt-out and displays new messages after re-enabling', function() {
    alerts.show('info', 'First')
    $rootScope.$digest()
    enabled = false
    $rootScope.$digest()
    alerts.show('info', 'Second')
    expect(alerts.items).toEqual([])
    enabled = true
    alerts.show('success', 'Third')
    expect(alerts.items.map(function(item) { return item.message })).toEqual(['Third'])
  })
})

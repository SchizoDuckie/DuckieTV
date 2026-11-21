describe('calendar navigation', function() {
  var calendarEvents, root, scope, element, compile

  beforeEach(module('DuckieTV', function($provide, $compileProvider) {
    $compileProvider.debugInfoEnabled(true)
    calendarEvents = { setVisibleDays: jasmine.createSpy('setVisibleDays') }
    $provide.value('CalendarEvents', calendarEvents)
  }))

  beforeEach(inject(function($rootScope, $compile, $templateCache) {
    root = $rootScope
    scope = root.$new()
    compile = $compile
    $templateCache.put('templates/datepicker.html', '<div></div>')
  }))

  afterEach(function() {
    scope.$destroy()
    element.remove()
  })

  it('moves one month from a date that does not occur in the target month', function() {
    scope.selected = new Date(2024, 0, 31)
    element = compile('<div date-picker="selected" view="date"></div>')(scope)
    root.$digest()
    var picker = element.isolateScope()
    picker.next()
    expect(picker.date).toEqual(new Date(2024, 1, 29))

    root.$broadcast('calendar:setdate', new Date(2025, 2, 31))
    picker.prev()
    expect(picker.date).toEqual(new Date(2025, 1, 28))
  })

  it('responds to reset and resize only while its calendar view is mounted', function() {
    element = compile('<div><calendar ng-if="visible" event-service="CalendarEvents" view="date"></calendar></div>')(scope)
    scope.visible = true
    root.$digest()
    var mounted = element[0].querySelector('calendar')
    var zoom = spyOn(angular.element(mounted).scope(), 'zoom')
    root.$broadcast('sidepanel:sizeChange', true)
    expect(zoom).toHaveBeenCalled()

    scope.visible = false
    root.$digest()
    zoom.calls.reset()
    calendarEvents.setVisibleDays.calls.reset()
    window.dispatchEvent(new Event('resize'))
    root.$broadcast('sidepanel:sizeChange', false)
    root.$broadcast('calendar:setdate', new Date(2024, 0, 15))
    expect(zoom).not.toHaveBeenCalled()
    expect(calendarEvents.setVisibleDays).not.toHaveBeenCalled()

    scope.visible = true
    root.$digest()
    calendarEvents.setVisibleDays.calls.reset()
    root.$broadcast('calendar:setdate', new Date(2024, 0, 15))
    expect(calendarEvents.setVisibleDays.calls.count()).toBe(1)
  })
})

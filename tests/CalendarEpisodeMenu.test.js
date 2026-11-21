describe('calendar episode context menu', function() {
  var templates = ['templates/event.html', 'templates/event/eventName.html']
  var markup, scope, element, autoDownload, torrenting

  beforeAll(async function() {
    markup = await Promise.all(templates.map(function(path) {
      return fetch('/base/' + path).then(function(response) { return response.text() })
    }))
  })

  beforeEach(module('DuckieTV', function($provide) {
    torrenting = true
    autoDownload = jasmine.createSpy('autoDownload')
    $provide.value('AutoDownloadService', { autoDownload: autoDownload })
    $provide.value('SettingsService', { get: function(key) { return key === 'torrenting.enabled' && torrenting } })
  }))

  beforeEach(inject(function($compile, $rootScope, $templateCache) {
    templates.forEach(function(path, index) { $templateCache.put(path, markup[index]) })
    scope = $rootScope.$new()
    scope.show = { TVDB_ID: 11, name: 'Series' }
    scope.episode = {
      ID_Episode: 12,
      hasAired: function() { return true },
      isLeaked: function() { return false },
      isWatched: function() { return false },
      getAirTime: function() { return '20:00' },
      getFormattedEpisode: function() { return 'S01E01' }
    }
    element = $compile('<calendar-event serie="show" episode="episode" count="count"></calendar-event>')(scope)
    angular.element(document.body).append(element)
    scope.$digest()
  }))

  afterEach(function() {
    scope.$destroy()
    element.remove()
  })

  function rightClick() {
    var event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    element[0].querySelector('.eventNameInner').dispatchEvent(event)
    return event.defaultPrevented
  }

  it('downloads the clicked episode only after the menu action is selected', function() {
    expect(rightClick()).toBe(true)
    expect(autoDownload).not.toHaveBeenCalled()
    document.querySelector('.context-menu a').click()
    expect(autoDownload).toHaveBeenCalledOnceWith(scope.show, scope.episode, true)
    expect(document.querySelector('.context-menu')).toBeNull()
  })

  it('keeps the native menu on grouped and unavailable entries', function() {
    scope.count = 3
    scope.$digest()
    expect(rightClick()).toBe(false)
    scope.count = undefined
    scope.episode.hasAired = function() { return false }
    scope.$digest()
    expect(rightClick()).toBe(false)
    scope.episode.isLeaked = function() { return true }
    torrenting = false
    expect(rightClick()).toBe(false)
    torrenting = true
    expect(rightClick()).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(document.querySelector('.context-menu')).toBeNull()
    expect(autoDownload).not.toHaveBeenCalled()
  })
})

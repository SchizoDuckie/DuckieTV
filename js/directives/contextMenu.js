// Source: https://github.com/Templarian/ui.bootstrap.contextMenu

/** Usage:
 * [string/function, function, optional function]
 * menuOptions = function () {
 *    return [
 *       ['name', action, enabled]
 *    ];
 * };
 *
 * serieOptions = function (serie) {
 *    return [
 *       ['Remove serie', function() { remove(serie) }],
 *       [$filter(translate)(thingy), function() { doThing(serie) }, function() { return false; }]
 *    ];
 * };
 * Note: you can add , null, between options to add a divider
 **/

DuckieTV.directive('contextMenu', [function () {
  var renderContextMenu = function ($scope, event, options, model) {
    var $ = angular.element
    var currentTarget = $(event.currentTarget)
    currentTarget.addClass('context')
    var $contextMenu = $('<div>')
    $contextMenu.addClass('dropdown clearfix context-menu')
    var $ul = $('<ul>')
    $ul.addClass('dropdown-menu')
    $ul.attr({ 'role': 'menu' })
    function close() {
      currentTarget.removeClass('context')
      $contextMenu.remove()
      document.removeEventListener('keydown', onKeyDown)
      unbindDestroy()
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') close()
    }
    var unbindDestroy = $scope.$on('$destroy', close)
    document.addEventListener('keydown', onKeyDown)
    angular.forEach(options, function (item, i) {
      var $li = $('<li>')
      if (item === null) {
        $li.addClass('divider')
      } else {
        var $a = $('<a>')
        $a.attr({ tabindex: '-1', href: '#' })
        var text = typeof item[0] === 'string' ? item[0] : item[0].call($scope, $scope, event, model)
        $a.text(text)
        $li.append($a)
        var enabled = angular.isDefined(item[2]) ? item[2].call($scope, $scope, event, text, model) : true
        if (enabled) {
          $li.on('click', function ($event) {
            $event.preventDefault()
            $scope.$apply(function () {
              close()
              item[1].call($scope, $scope, event, model)
            })
          })
        } else {
          $li.on('click', function ($event) {
            $event.preventDefault()
          })
          $li.addClass('disabled')
        }
      }
      $ul.append($li)
    })
    $contextMenu.append($ul)
    $(document.body).append($contextMenu)
    var viewport = $contextMenu[0].getBoundingClientRect()
    var menu = $ul[0].getBoundingClientRect()
    $ul.css({
      left: Math.max(0, Math.min(event.clientX, viewport.width - menu.width)) + 'px',
      top: Math.max(0, Math.min(event.clientY, viewport.height - menu.height)) + 'px'
    })
    $contextMenu.on('mousedown', function (e) {
      if (e.target === $contextMenu[0]) close()
    }).on('contextmenu', function (event) {
      event.preventDefault()
      close()
    })
  }
  return function ($scope, element, attrs) {
    element.on('contextmenu', function (event) {
      var options = $scope.$eval(attrs.contextMenu)
      if (!Array.isArray(options)) throw new Error('"' + attrs.contextMenu + '" is not an array')
      if (options.length) {
        event.stopPropagation()
        event.preventDefault()
        renderContextMenu($scope, event, options, $scope.$eval(attrs.model))
      }
    })
  }
}])

DuckieTV.directive('seriesGrid', function() {
  return {
    restrict: 'A',
    controllerAs: 'grid',
    controller: ['$scope', 'SettingsService', function($scope, SettingsService) {
      var posterWidth, posterHeight, postersPerRow, centeringOffset, oldClientWidth
      var container = document.querySelector('[series-grid]')
      var seriesGrid = container.querySelector('.series-grid')

      function recalculate() {
        if (SettingsService.get('library.seriesgrid') == false) {
          return scrollToActive()
        }

        var isMini = container.classList.contains('miniposter')
        var maxPosters = container.getAttribute('max-posters') ? parseInt(container.getAttribute('max-posters')) : 0
        posterWidth = isMini ? 140 : 175 // Includes paddings
        posterHeight = isMini ? 197 : 247 // Includes paddings
        oldClientWidth = seriesGrid.clientWidth
        postersPerRow = Math.floor(seriesGrid.clientWidth / posterWidth)
        centeringOffset = (seriesGrid.clientWidth - (postersPerRow * posterWidth)) / 2

        if (maxPosters != 0) {
          seriesGrid.style.height = (Math.ceil(maxPosters / postersPerRow) * posterHeight) + 'px'
        }

        $scope.$applyAsync()
        scrollToActive()
      }

      var observer = new MutationObserver(function() {
        recalculate()
      })

      // configuration of the observer:
      var config = {
        attributes: true
      }

      observer.observe(container, config)
      observer.observe(document.querySelector('sidepanel'), config)

      this.getPosition = function(idx, max) {
        return 'transform: translate3d(' + getLeft(idx, max) + 'px, ' + getTop(idx) + 'px, 0px)'
      }

      var getLeft = function(idx, max) {
        if (idx === 0 && oldClientWidth != seriesGrid.clientWidth) {
          recalculate()
        }

        var rowCentering = 0
        var leftovers = max - (max % postersPerRow)
        if (max < postersPerRow || idx >= leftovers) { // if we're on the last line
          var postersInRow = max < postersPerRow ? max : max - leftovers
          rowCentering = (seriesGrid.clientWidth / 2) - ((postersInRow * posterWidth) / 2) - rowCentering
          var positionInRow = postersInRow - (max - idx)
          return rowCentering + (positionInRow * posterWidth)
        } else {
          return centeringOffset + rowCentering + ((idx % postersPerRow) * posterWidth)
        }
      }

      var getTop = function(idx) {
        if (idx === 0 && oldClientWidth != seriesGrid.clientWidth) {
          recalculate()
        }

        idx = idx + 1
        return (Math.ceil(idx / postersPerRow) * posterHeight) - posterHeight
      }

      var scrollToActive = function() {
        var activeSerie = seriesGrid.querySelector('.serieheader.active')

        if (activeSerie) {
          setTimeout(() => {
            activeSerie.scrollIntoView({ block: 'end', behavior: 'smooth' })
          }, 700)
        }
      }
    }]
  }
})

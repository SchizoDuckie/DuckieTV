/**
 * A <background-rotator channel="'event:channel'"> directive.
 * Usage:
 * Put <background-rotator tag anywhere with a channel parameter
 * directive waits until a new event has been broadcasted with the full url to an image
 * preloads new image
 * Cross-fades between current loaded image and the new image
 */
DuckieTV.directive('backgroundRotator', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'E',
      scope: {
        channel: '='
      },
      templateUrl: 'templates/backgroundRotator.html',
      link: function($scope) {
        $scope.format = ('chrome' in window) ? 'webp' : 'png'
        $scope.bg1 = false
        $scope.bg2 = false
        $scope.bg1on = false
        $scope.bg2on = false

        $scope.bgItem = null
        $scope.bgUrl = null
        var cooldown = false
        $scope.getSetting = $rootScope.getSetting

        load = function(url) {
          var img = document.createElement('img')
          img.onload = function() {
            var target = $scope.bg1on ? 'bg2' : 'bg1'
            $scope[target] = img.src
            $scope[target + 'on'] = true
            $scope[(target == 'bg1' ? 'bg2on' : 'bg1on')] = false
            $scope.$applyAsync()

            updateItemDetails()
          }

          img.src = url
        }

        $rootScope.$on($scope.channel, function(event, item) {
          if (!cooldown) {
            const url = item?.fanart

            if (url && $scope.bgUrl != url) {
              $scope.bgItem = item
              $scope.bgUrl = url
              load(url)
            }

            cooldown = true
            setTimeout(function() { cooldown = false }, 1300)
          }
        })

        function updateItemDetails() {
          if (!$scope.bgItem) {
            return
          }

          const name = $scope.bgItem.name?.slice(0, 30)
          const year = new Date($scope.bgItem.firstaired)?.getFullYear()

          if (name && year) {
            $scope.itemDetails = `${name} (${year})`
          } else if (name) {
            $scope.itemDetails = name
          }
        }
      }
    }
  }
])

  .directive('kc', ['$document', 'SettingsService',
    function($document, SettingsService) {
      return {
        link: function(scope) {
          var kk = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]

          var k = 0

          var handler = function(e) {
            if (e.keyCode === kk[k++]) {
              if (k === kk.length) {
                document.body.classList.add('kc')
                enableEgg()
              }
            } else {
              k = 0
            }
          }
          $document.on('keydown', handler)
          if (SettingsService.get('kc.always')) {
            document.body.classList.add('kc')
          }

          var zz = 0

          magic = function(o, t) {
            return Math.floor(Math.random() * (t - o + 1)) + o
          }
          enableEgg = function() {
            angular.element(document.body).append('<div class="contaner">')
            snow = function() {
              column = magic(0, $document[0].body.offsetWidth)
              if ($document[0].body.offsetWidth / 90 * 1.3 > zz) {
                zz++
                angular.element(document.querySelector('.contaner')).append('<div class="duckie" style="left:' + column + 'px;"><img src="img/logo/icon64-inverted.png"/>')
              } else {
                clearInterval(eggTimer)
              }
            }
            eggTimer = setInterval(function() {
              snow()
            }, 200)
          }
        }
      }
    }
  ])

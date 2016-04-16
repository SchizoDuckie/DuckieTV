/**
 * angular-lazy-load
 *
 * Copyright(c) 2014 Paweł Wszoła <wszola.p@gmail.com>
 * MIT Licensed
 *
 * @author Paweł Wszoła (wszola.p@gmail.com)
 *
 * Somewhat heavily modified by DuckieTV team
 */

angular.module('angularLazyImg', []);

angular.module('angularLazyImg').factory('LazyImgMagic', ['$window', '$rootScope', 'lazyImgHelpers', function($window, $rootScope, lazyImgHelpers) {

    var winDimensions, $win, images, isListening;
    var checkImagesT, saveWinOffsetT, containers, checking;
    // Offset to load images just out of view, higher value = greater area that can be loaded at once that's out of view
    var offset = 220;

    images = [];
    isListening = false;
    $win = angular.element($window);
    winDimensions = lazyImgHelpers.getWinDimensions();
    saveWinOffsetT = lazyImgHelpers.throttle(function() {
		winDimensions = lazyImgHelpers.getWinDimensions();
    }, 60);
    containers = [];

    function checkImages() {
    	// If there's no images to load don't bother checking
    	if (images.length === 0) { 
    		stopListening();
    		return;
    	}
		for(var i = images.length - 1; i >= 0; i--) {
			var image = images[i];
			if (image && lazyImgHelpers.isElementInView(image.$elem[0], offset, winDimensions)) {
				loadImage(image);
				images.splice(i, 1);
			}
		}
    }

    checkImagesT = lazyImgHelpers.throttle(checkImages, 120); // ms to throttle scroll events

    function listen(param) {
		containers.forEach(function (container) {
			container[param]('scroll', checkImagesT);
			container[param]('touchmove', checkImagesT);
		});
    }

    function startListening() {
		isListening = true;
		setTimeout(function() {
			checkImages();
			listen('on');
		}, 1);
    }

    function stopListening() {
		isListening = false;
		listen('off');
    }

    function removeImage(image) {
		var index = images.indexOf(image);
		if(index !== -1) {
			images.splice(index, 1);
		}
    }
    // Loads the image and adds the loading/error classes on the element
	function loadImage(photo) {
		var img = new Image();
		photo.$elem.addClass("img-loading");
		img.onerror = function() {
			photo.$elem.removeClass("img-loading");
			photo.$elem.addClass("img-load-error");
			$rootScope.$emit('lazyImg:error', photo);
		};
		img.onload = function() {
			setPhotoSrc(photo.$elem, photo.src);
			photo.$elem.removeClass("img-loading");;
			$rootScope.$emit('lazyImg:success', photo);
		};
		img.src = photo.src;
	}
	// Sets the loaded image on the element or if altMode is enabled, on the child img (div) element
	function setPhotoSrc($elem, src) {
		if ($elem[0].nodeName.toLowerCase() === 'img') {
			$elem[0].src = src;
		} else {
		if ($elem[0].attributes['alt-lazy'].value == 1) {
				$elem.find('div').css('background-image', 'url("' + src + '")');
			} else {
				$elem.css('background-image', 'url("' + src + '")');
			}
		}
	}

    // PHOTO
    function Photo($elem) {
		this.$elem = $elem;
    }

	Photo.prototype.setSource = function(source) {
		this.src = source;
		images.unshift(this);
		if (!isListening){ startListening(); }
	};

	Photo.prototype.removeImage = function() {
		removeImage(this);
		if(images.length === 0){ stopListening(); }
	};

	Photo.prototype.checkImages = function() {
		// For some reason this function gets spammed when changing poster size so a timeout is required.
		if (!checking) {
			checking = true;
			checkImages();
			setTimeout(function() {
				checking = false;
			}, 100);
		}
	};

	Photo.addContainer = function(container) {
		stopListening();
		containers.push(container);
		startListening();
	};

	Photo.removeContainer = function(container) {
		stopListening();
		containers.splice(containers.indexOf(container), 1);
		startListening();
	};

	Photo.prototype.useFallback = function() {
		this.$elem.removeClass("img-loading");
		this.$elem.addClass("img-load-error");
	};

	return Photo;
  }
]);

angular.module('angularLazyImg').factory('lazyImgHelpers', ['$window', function($window) {
    function getWinDimensions() {
		return {
			height: $window.innerHeight,
			width: $window.innerWidth
		};
    }

	function isElementInView(elem, offset, winDimensions) {
		var rect = elem.getBoundingClientRect();
		var bottomline = winDimensions.height + offset;
		return (rect.top >= 0 && rect.top <= bottomline ||
				rect.bottom <= bottomline && rect.bottom >= 0 - offset
		);
	}

    // http://remysharp.com/2010/07/21/throttling-function-calls/
    function throttle(fn, threshhold, scope) {
      var last, deferTimer;
      return function () {
        var context = scope || this;
        var now = +new Date(),
            args = arguments;
        if (last && now < last + threshhold) {
          clearTimeout(deferTimer);
          deferTimer = setTimeout(function () {
            last = now;
            fn.apply(context, args);
          }, threshhold);
        } else {
          last = now;
          fn.apply(context, args);
        }
      };
    }

	return {
		isElementInView: isElementInView,
		getWinDimensions: getWinDimensions,
		throttle: throttle
	};
  }
]);

angular.module('angularLazyImg')

.directive('lazyImg', ['$rootScope', 'LazyImgMagic', function ($rootScope, LazyImgMagic) {
	return {
		restrict: 'A',
		link: function(scope, element, attributes) {
			var lazyImage = new LazyImgMagic(element);
			attributes.$observe('lazyImg', function (newSource) {
				if (newSource) {
					lazyImage.setSource(newSource);
				} else {
					lazyImage.useFallback();
				}
			});
			scope.$on('$destroy', function () {
				lazyImage.removeImage();
			});
			$rootScope.$on('lazyImg.runCheck', function () {
				lazyImage.checkImages();
			});
			$rootScope.$on('lazyImg:refresh', function () {
				setTimeout(function() {
					lazyImage.checkImages();
				}, 580);
			});
		}
	};
}])

// Directive to specify custom containers, this is needed for the seriesList
.directive('lazyImgcont', ['LazyImgMagic', function (LazyImgMagic) {
	return {
		restrict: 'A',
		link: function(scope, element, attributes) {
			LazyImgMagic.addContainer(element);
			scope.$on('$destroy', function() {
				LazyImgMagic.removeContainer(element);
			});
		}
	};
}]);
/*
	Copyright (c) 2014 Colin Rotherham, http://colinr.com
	https://github.com/colinrotherham
*/

var CRD = CRD || {};

CRD.Slideshow = function(userConfig, callbackEnd, callbackStart) {
    'use strict';

    var self = this,

        // Transition prefixes + default
        prefixes = ['ms', 'O', 'Moz', 'Webkit', ''],
        prefix = '',
        style,

        /*
		Default configuration
		----------------------------------- */

        config = {
            next: 'button.next',
            previous: 'button.previous',
            markers: '.markers',
            numbers: '.numbers',

            // Classes
            classStrip: 'strip',
            classSlide: 'slide',
            classActive: 'sticky',
            classDisabled: 'disabled',
            classTouch: 'touch',

            // How many to step next/prev by
            step: 1,

            // Adjust timings
            delay: 3000,
            interval: 5000,
            time: 400,

            // Custom display type
            display: 'block',

            // Allow infinite looping, auto-play or carousel style?
            canLoop: false,
            isManual: true,
            isCarousel: true
        },

        element, slides, strip, markers, markerButtons, numbers, buttons, buttonPrev, buttonNext,
        timeoutStart, timeoutSlide, timeoutResize, requestFrame,
        count, indexStart, indexOffset,
        isBusy, isFrameRequested, isScrolling, isPrev, isTouch,

        /*
		Other checks
		----------------------------------- */

        // CSS transitions?
        isCSS = (function() {
            var css = document.body.style,
                i = prefixes.length;

            // Check vendor prefixes
            while (i--) {
                if (typeof css[prefixes[i] + 'Transition'] === 'string') {
                    prefix = prefixes[i];
                    break;
                }
            }
            return !!prefix;
        })(),

        // Has requestAnimationFrame support?
        isRAF = (function() {
            return !!(window.requestAnimationFrame && window.cancelAnimationFrame);
        })();


    /*
		Update config values
		----------------------------------- */

    function updateConfig(newConfig) {
        $.each(newConfig, function(name, value) {
            config[name] = value;
        });

        // Use config-provided touch settings or detect?
        isTouch = typeof config.isTouch !== 'undefined' ?
            !!config.isTouch : ('ontouchstart' in window) || navigator.msPointerEnabled || window.DocumentTouch && document instanceof DocumentTouch;
    }


    /*
		Start the slideshow
		----------------------------------- */

    function init() {
        element = $(config.slideshow);
        slides = element.find('.' + config.classSlide);
        strip = element.find('.' + config.classStrip);

        // Number of slides
        count = slides.length;

        if (!element.length || count < 2)
            return;

        // Expose slide strip's CSS
        style = strip[0].style;

        var slide = slides.first(),
            slideWidth = (100 / count) + '%';

        // Set widths
        strip.outerWidth((count * 100) + '%');
        slides.outerWidth(slideWidth);

        // Test buggy jQuery width calculations, use .width() instead
        if (!slide.width() || (slide.get(0).style.width.slice(0, 4) !== slideWidth.slice(0, 4)))
            slides.width(slideWidth);

        // Find center point and initial offset
        indexStart = (config.canLoop) ? Math.floor((count - 1) / 2) : 0;
        indexOffset = 0;

        initEvents();
        initMarkers();
        initSlides();
        initPositions();

        // Kick off touch support
        if (isTouch) initTouch();

        // Set button & marker state
        updateNextPrev();

        // Expose internal elements
        self.element = element;
        self.strip = strip;
        self.slides = slides;

        // Enabled
        element.removeClass(config.classDisabled);

        // Focus & hashchange management
        $(window).on('hashchange', initSlides);
    }

    function start() {
        if (!config.isManual)
            timeoutSlide = offload(function() {
                change();
            }, config.interval);
    }

    function stop() {
        clearTimeout(timeoutStart);
        clearTimeout(timeoutSlide);
    }

    function offload(fn, time) {
        return setTimeout(fn, time || 0);
    }


    /*
		Jump to next or specific slide
		----------------------------------- */

    function next(event) {
        change.call(this, event, {
            isPrev: false
        });
    }

    function prev(event) {
        change.call(this, event, {
            isPrev: true
        });
    }

    function change(event, options) {
        var index = self.index,
            time = (config.isCarousel) ? config.time : 0;

        // Ignore when busy
        if (!isBusy) {
            // Remember direction for later
            isPrev = options && options.isPrev;

            // Determine next slide (optionally override)
            setNextSlide.call(this, options && options.slide);

            // Proceed if not current slide
            if (!self.slide.is(self.slideNext)) {
                // Run optional transition callback?
                var proceed = (callbackStart) ?
                    callbackStart.call(self, event) : true;

                // Don't run if callback has returned false
                if (proceed || typeof proceed === 'undefined') {
                    isBusy = true;
                    stop();

                    // On hash change, no transition time
                    if (event && event.type === 'hashchange')
                        time = 0;

                    transition(getIndexOffset(index), time, function() {
                        transitionEnd(event);
                    });
                }
            }
        }

        // Start slideshow again?
        if (!event) start();

        // Stop default action
        else event.preventDefault();
    }

    function transition(index, time, complete, touchX) {
        // Transition when frame is available
        function onFrame() {
            // Frame arrived
            isFrameRequested = false;

            if (!index && index !== 0)
                index = getIndexOffset(self.index);

            time = time || 0;

            // Move using CSS transition
            if (isCSS && config.isCarousel) {
                touchX = touchX || 0;

                // Callback when complete
                if (time && complete)
                    strip.one(prefix.toLowerCase() + 'TransitionEnd transitionend', complete);

                // Move using CSS animation
                style[prefix + 'Transition'] = (time) ? time / 1000 + 's' : '';
                style[prefix + 'Transform'] = 'translateX(' + (getTransitionX(index, true) - touchX) * -1 + '%)';

                // No transition time, run callback immediately
                if (!time && complete)
                    complete();
            }

            // Move using jQuery
            else strip.stop(true, true).animate({
                left: getTransitionX(index) + '%'
            }, time, complete);
        }

        // Request next frame when using touch
        if (isRAF && typeof touchX !== 'undefined') {
            isFrameRequested = true;
            requestFrame = requestAnimationFrame(onFrame);
        }

        // Or run immediately (lower performance)
        else onFrame();
    }

    function transitionEnd(event) {
        // This is now the current slide
        self.slide = self.slideNext;
        isBusy = false;

        // Update sticky class
        slides.removeClass(config.classActive);
        self.slide.addClass(config.classActive);

        // Zero transition time
        style[prefix + 'Transition'] = '';

        // Restore original positions
        if (config.canLoop) initPositions();

        updateNextPrev();

        if (event) {
            // Click or hash change, focus active slide
            if (event.type === 'click' || event.type === 'hashchange')
                offload(function() {
                    self.slide.focus();
                });

            // Run optional transitionEnd callback?
            if (callbackEnd) callbackEnd.call(self, event);
        }
    }

    function setNextSlide(override) {
        var target = $(this),
            index = self.index,
            indexLast = count - 1,
            step = target.is(buttons) ? config.step : 1;

        // Prepare specific slide by index
        if (typeof override !== 'undefined') {
            isPrev = (override < index) ? true : false;
            index = override;
        }

        // Prepare next
        else if (!isPrev) {
            index = index + step;
            index = (index >= indexLast) ? (config.canLoop ? getIndexWrapped(index) : indexLast) : index;
        }

        // Prepare prev
        else {
            index = index - step;
            index = (index <= 0) ? (config.canLoop ? getIndexWrapped(index) : 0) : index;
        }

        self.slideNext = slides.eq(index);
        self.index = index;
    }

    function isEnd() {
        return !config.canLoop && ((isPrev && self.index === 0) || (!isPrev && self.index === count - 1));
    }


    /*
		Update markers + buttons
		----------------------------------- */

    function updateMarkers(event) {
        if (markers) {
            // Clicked so update
            if (event) {
                // Change to the correct slide
                change.call(this, event, {
                    slide: markerButtons.index(this)
                });
            } else {
                // Highlight the right marker
                markerButtons.removeAttr('class').eq(self.index).addClass(config.classActive);
            }
        }

        if (numbers) {
            numbers.html('<strong>' + (self.index + 1) + '</strong>/<strong>' + count + '</strong>');
        }
    }

    function updateNextPrev() {
        var button, buttonClass = config.classDisabled;

        // Skip when looping is on
        if (!config.canLoop) {
            buttons.removeClass(buttonClass);

            switch (self.index) {
                case 0:
                    button = buttonPrev;
                    break;

                case count - 1:
                    button = buttonNext;
                    break;
            }

            if (button) button.addClass(buttonClass);
        }

        updateMarkers();
    }


    /*
		Utility methods
		----------------------------------- */

    function getTransitionX(index, isRelative) {
        // Present percentage relative to entire strip width?
        return (isRelative) ? index * (100 / count) : index * -100;
    }

    function getIndexWrapped(index) {
        // Wrap index if it goes out of bounds
        if (index >= count) index = index - count;
        if (index < 0) index = count + index;

        return index;
    }

    function getIndexOffset(index) {
        return getIndexWrapped(self.index + (config.canLoop ? indexStart - index : 0));
    }

    function getPositionOffset(index) {
        return getIndexWrapped(config.canLoop ? index - indexStart + self.index : index);
    }


    /*
		Initial setup
		----------------------------------- */

    function initSlides(event) {
        var slide, index;

        // Default to 1st slide with active class
        if (!self.slide) {
            self.slide = slides.filter('.' + config.classActive).first();
            self.index = slides.index(self.slide);
        }

        // Grab slide matching hash
        if (location.hash) {
            slide = slides.filter(location.hash);
            index = slides.index(slide);

            if (slide.length && self.index !== index)
                change(event, {
                    slide: index
                });
        }

        // No? Grab 1st slide instead
        if (!self.slide.length) {
            self.index = 0;
            self.slide = slides.eq(self.index);
        }

        // Reset browser trying to jump to slide before transition
        offload(function() {
            //element.scrollTop(0);
            //element.scrollLeft(0);
        });
    }

    function initPositions() {
        var i = count,
            slide,
            xOld, xNew;

        // Loops slides, fix positions
        while (i--) {
            slide = slides.eq(getPositionOffset(i));

            xOld = slide.data('x');
            xNew = getTransitionX(i, true) + '%';

            // Only set position if it's changed
            if (xNew !== xOld) slide.css({
                'left': xNew,
                'display': config.display
            }).attr('tabindex', '-1').data('x', xNew);
        }

        // Move strip
        transition((config.canLoop) ? indexStart : self.index);
    }

    function initMarkers() {
        // Skip when no marker config
        if (config.markers) {
            // Add the markers
            markers = $(config.markers).on('click touchend', 'button', updateMarkers);

            // Create marker links
            var i = count;
            while (i--) {
                markers.prepend($('<button>' + (i + 1) + '</button>'));
            }

            // Find the new links, wire up, add
            markerButtons = markers.find('button');
        }

        // Skip when no number config
        if (config.numbers) {
            // Add the numbers
            numbers = $(config.numbers).text('1/9');
        }
    }

    function initEvents() {
        // Listen for mouse movement
        element.mouseenter(stop).mouseleave(start);

        // Wire up next/previous
        buttonNext = $(config.next).on('click touchend', next);
        buttonPrev = $(config.previous).on('click touchend', prev);

        // Both buttons
        buttons = buttonPrev.add(buttonNext);

        // Start the slideshow timer
        timeoutStart = offload(start, config.delay);
    }


    /*
		Initial setup, touch support
		----------------------------------- */

    function initTouch() {
        var touch, delta,

            // Listen for these events
            eventsTouchStart = 'touchstart pointerdown MSPointerDown',
            eventsTouchMove = 'touchmove pointermove MSPointerMove',
            eventsTouchEnd = 'touchend touchleave touchcancel MSPointerUp MSPointerOut MSPointerCancel pointerup pointerleave pointercancel';

        function begin(event) {
            var ignoreTouch = buttons || markers && markers.add(buttons),
                originalEvent = event.originalEvent,
                touches = originalEvent.touches && originalEvent.touches[0] || originalEvent;

            // Don't track touches on markers or next/prev
            if (ignoreTouch.has(event.target).length || ignoreTouch.is(event.target)) return;

            // If busy, end transition now
            if (isBusy) transitionEnd();

            // Log touch start, empty delta
            touch = {
                x: touches.pageX || touches.screenX,
                y: touches.pageY || touches.screenY,
                time: +new Date()
            };
            delta = {};

            // Reset scroll detection
            isScrolling = undefined;

            element.on(eventsTouchMove, move);
            element.on(eventsTouchEnd, end);
        }

        function move(event) {
            var originalEvent = event.originalEvent,
                touches = originalEvent.touches && originalEvent.touches[0] || originalEvent;

            // Waiting for frame, or multiple touch points or pinch-zoom
            if (isFrameRequested || touches.length > 1 || originalEvent.scale && originalEvent.scale !== 1)
                return;

            // Movement since touch
            delta = {
                x: (touches.pageX || touches.screenX) - touch.x,
                y: (touches.pageY || touches.screenY) - touch.y
            };

            // Are we scrolling? i.e. Moving up/down more than left/right
            if (typeof isScrolling === 'undefined')
                isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));

            // If tracking touch, block scrolling
            if (!isScrolling) {
                event.preventDefault();
                stop();

                // Swiping forward or backwards?
                isPrev = delta.x > 0;

                // Mark as busy
                isBusy = true;

                // Add resistance to first and last slide
                if (!config.canLoop && isEnd())
                    delta.x = delta.x / (Math.abs(delta.x) / self.width + 1);

                // Override strip X relative to touch moved
                transition(null, null, null, (delta.x / self.width) * (100 / count));
            }
        }

        function end() {
            if (!isScrolling) {
                var duration = +new Date() - touch.time,
                    distance = Math.abs(delta.x),
                    isEnough = duration < 250 && distance > 20 || distance > self.width / 3;

                // No longer busy
                isBusy = false;

                // Alear frame request ready for final frame
                if (isRAF)
                    cancelAnimationFrame(requestFrame);

                // Progress to next slide
                if (isEnough && !isEnd())
                    change.call(this, event, {
                        isPrev: isPrev
                    });

                // Stay on slide
                else if (distance > 0) {
                    // Offset requested position?
                    transition(null, config.time);
                }
            }

            element.off(eventsTouchMove, move);
            element.off(eventsTouchEnd, end);
        }

        function click(event) {
            // Prevent click being registered after valid swipe
            if (!isScrolling && isBusy) event.preventDefault();
        }

        function updateWidth(event) {
            function set() {
                self.width = element.outerWidth();
            }

            if (timeoutResize) clearTimeout(timeoutResize);
            timeoutResize = offload(set, (event) ? 300 : 0);
        }

        // For smooth animation, touch must use carousel mode
        config.isCarousel = true;

        // Wait for touches + tell CSS touch is enabled
        element.on(eventsTouchStart, begin).on('click', click).addClass(config.classTouch);

        // Track slideshow size for movement calculations
        updateWidth();
        $(window).resize(updateWidth);
    }


    /*
		Update config from user
		----------------------------------- */

    updateConfig(userConfig || {});


    /*
		Expose internals
		----------------------------------- */

    self.init = init;

    self.start = start;
    self.stop = stop;
    self.next = next;
    self.prev = prev;

    self.change = change;
    self.transition = transition;

    // Make helper methods public
    self.getTransitionX = getTransitionX;
    self.getIndexWrapped = getIndexWrapped;
    self.getIndexOffset = getIndexOffset;
    self.getPositionOffset = getPositionOffset;

    // Allow config override after init
    self.updateConfig = updateConfig;
};
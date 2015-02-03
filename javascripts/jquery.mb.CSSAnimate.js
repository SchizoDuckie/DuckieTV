/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.CSSAnimate.js                                                                                                                    _
 _ last modified: 16/09/14 0.10                                                                                                                     _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2014. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/

/*
 * version: 1.6.4
 *  params:

 @opt        -> the CSS object (ex: {top:300, left:400, ...})
 @duration   -> an int for the animation duration in milliseconds
 @delay      -> an int for the animation delay in milliseconds
 @ease       -> ease  ||  linear || ease-in || ease-out || ease-in-out  ||  cubic-bezier(<number>, <number>,  <number>,  <number>)
 @callback   -> a callback function called once the transition end

 example:

 jQuery(this).CSSAnimate({top:t, left:l, width:w, height:h, transform: 'rotate(50deg) scale(.8)'}, 2000, 100, "ease-out", callback;})
 */

/*Browser detection patch*/
var nAgt = navigator.userAgent;
if (!jQuery.browser) {
	jQuery.browser = {};
	jQuery.browser.mozilla = !1;
	jQuery.browser.webkit = !1;
	jQuery.browser.opera = !1;
	jQuery.browser.safari = !1;
	jQuery.browser.chrome = !1;
	jQuery.browser.msie = !1;
	jQuery.browser.ua = nAgt;
	jQuery.browser.name = navigator.appName;
	jQuery.browser.fullVersion = "" + parseFloat(navigator.appVersion);
	jQuery.browser.majorVersion = parseInt(navigator.appVersion, 10);
	var nameOffset, verOffset, ix;
	if (-1 != (verOffset = nAgt.indexOf("Opera")))jQuery.browser.opera = !0, jQuery.browser.name = "Opera", jQuery.browser.fullVersion = nAgt.substring(verOffset + 6), -1 != (verOffset = nAgt.indexOf("Version")) && (jQuery.browser.fullVersion = nAgt.substring(verOffset + 8)); else if (-1 != (verOffset = nAgt.indexOf("MSIE")))jQuery.browser.msie = !0, jQuery.browser.name = "Microsoft Internet Explorer", jQuery.browser.fullVersion = nAgt.substring(verOffset + 5); else if (-1 != nAgt.indexOf("Trident")) {
		jQuery.browser.msie = !0;
		jQuery.browser.name = "Microsoft Internet Explorer";
		var start = nAgt.indexOf("rv:") + 3, end = start + 4;
		jQuery.browser.fullVersion = nAgt.substring(start, end)
	} else-1 != (verOffset = nAgt.indexOf("Chrome")) ? (jQuery.browser.webkit = !0, jQuery.browser.chrome = !0, jQuery.browser.name = "Chrome", jQuery.browser.fullVersion = nAgt.substring(verOffset + 7)) : -1 != (verOffset = nAgt.indexOf("Safari")) ? (jQuery.browser.webkit = !0, jQuery.browser.safari = !0, jQuery.browser.name = "Safari", jQuery.browser.fullVersion = nAgt.substring(verOffset + 7), -1 != (verOffset = nAgt.indexOf("Version")) && (jQuery.browser.fullVersion = nAgt.substring(verOffset + 8))) : -1 != (verOffset = nAgt.indexOf("AppleWebkit")) ? (jQuery.browser.webkit = !0, jQuery.browser.name = "Safari", jQuery.browser.fullVersion = nAgt.substring(verOffset + 7), -1 != (verOffset = nAgt.indexOf("Version")) && (jQuery.browser.fullVersion = nAgt.substring(verOffset + 8))) : -1 != (verOffset = nAgt.indexOf("Firefox")) ? (jQuery.browser.mozilla = !0, jQuery.browser.name = "Firefox", jQuery.browser.fullVersion = nAgt.substring(verOffset + 8)) : (nameOffset = nAgt.lastIndexOf(" ") + 1) < (verOffset = nAgt.lastIndexOf("/")) && (jQuery.browser.name = nAgt.substring(nameOffset, verOffset), jQuery.browser.fullVersion = nAgt.substring(verOffset + 1), jQuery.browser.name.toLowerCase() == jQuery.browser.name.toUpperCase() && (jQuery.browser.name = navigator.appName));
	-1 != (ix = jQuery.browser.fullVersion.indexOf(";")) && (jQuery.browser.fullVersion = jQuery.browser.fullVersion.substring(0, ix));
	-1 != (ix = jQuery.browser.fullVersion.indexOf(" ")) && (jQuery.browser.fullVersion = jQuery.browser.fullVersion.substring(0, ix));
	jQuery.browser.majorVersion = parseInt("" + jQuery.browser.fullVersion, 10);
	isNaN(jQuery.browser.majorVersion) && (jQuery.browser.fullVersion = "" + parseFloat(navigator.appVersion), jQuery.browser.majorVersion = parseInt(navigator.appVersion, 10));
	jQuery.browser.version = jQuery.browser.majorVersion
}
jQuery.browser.android = /Android/i.test(nAgt);
jQuery.browser.blackberry = /BlackBerry/i.test(nAgt);
jQuery.browser.ios = /iPhone|iPad|iPod/i.test(nAgt);
jQuery.browser.operaMobile = /Opera Mini/i.test(nAgt);
jQuery.browser.windowsMobile = /IEMobile/i.test(nAgt);
jQuery.browser.mobile = jQuery.browser.android || jQuery.browser.blackberry || jQuery.browser.ios || jQuery.browser.windowsMobile || jQuery.browser.operaMobile;

jQuery.fn.CSSAnimate = function (opt, duration, delay, ease, callback) {

	// jQuery.support.CSStransition
// to verify that CSS3 transition is supported (or any of its browser-specific implementations)
	jQuery.support.CSStransition = (function () {
		var thisBody = document.body || document.documentElement;
		var thisStyle = thisBody.style;
		return thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined;
	})();


	function uncamel(str) {
		return str.replace(/([A-Z])/g, function(letter) { return '-' + letter.toLowerCase(); });
	}

	function setUnit(i, units) {
		if ((typeof i === "string") && (!i.match(/^[\-0-9\.]+$/))) {
			return i;
		} else {
			return "" + i + units;
		}
	}

	return this.each(function () {

		var el = this;
		var $el = jQuery(this);
		el.id = el.id || "CSSA_" + new Date().getTime();

		var event = event || {type:"noEvent"};

		if(el.CSSAIsRunning && el.eventType == event.type && !jQuery.browser.msie && jQuery.browser.version<=9){
			el.CSSqueue = function(){
				$el.CSSAnimate(opt, duration, delay, ease, callback);
			};
			return;
		}

		el.CSSqueue=null;
		el.eventType = event.type;


		if ($el.length === 0 || !opt) {
			return;
		}

		el.CSSAIsRunning = true;

		if (typeof duration == "function") {
			callback = duration;
			duration = jQuery.fx.speeds["_default"];
		}

		if (typeof delay == "function") {
			callback = delay;
			delay = 0;
		}
		if (typeof ease == "function") {
			callback = ease;
			ease = "cubic-bezier(0.65,0.03,0.36,0.72)";
		}

		if (typeof duration == "string") {
			for (var d in jQuery.fx.speeds) {
				if (duration == d) {
					duration = jQuery.fx.speeds[d];
					break;
				} else {
					duration = jQuery.fx.speeds["_default"];
				}
			}
		}

		if(!duration)
			duration = jQuery.fx.speeds["_default"];

		if (!jQuery.support.CSStransition) {

			for (var o in opt) {

				if (o === "transform") {
					delete opt[o];
				}
				if (o === "filter") {
					delete opt[o];
				}
				if (o === "transform-origin") {
					delete opt[o];
				}

				if (opt[o] === "auto") {
					delete opt[o];
				}

				if (o === "x") {
					var val = opt[o];
					var key = "left";
					opt[key] = val;
					delete opt[o];
				}

				if (o === "y") {
					var val = opt[o];
					var key = "top";
					opt[key] = val;
					delete opt[o];
				}

				if (o === "-ms-transform" || o === "-ms-filter") {
					delete opt[o];
				}

			}

			if (!callback || typeof callback === "string")
				callback = "linear";

			$el.delay(delay).animate(opt, duration, callback);
			return;
		}

		var cssEase = {
			'default':       'ease',
			'in':             'ease-in',
			'out':            'ease-out',
			'in-out':         'ease-in-out',
			'snap':           'cubic-bezier(0,1,.5,1)',
			'easeOutCubic':   'cubic-bezier(.215,.61,.355,1)',
			'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
			'easeInCirc':     'cubic-bezier(.6,.04,.98,.335)',
			'easeOutCirc':    'cubic-bezier(.075,.82,.165,1)',
			'easeInOutCirc':  'cubic-bezier(.785,.135,.15,.86)',
			'easeInExpo':     'cubic-bezier(.95,.05,.795,.035)',
			'easeOutExpo':    'cubic-bezier(.19,1,.22,1)',
			'easeInOutExpo':  'cubic-bezier(1,0,0,1)',
			'easeInQuad':     'cubic-bezier(.55,.085,.68,.53)',
			'easeOutQuad':    'cubic-bezier(.25,.46,.45,.94)',
			'easeInOutQuad':  'cubic-bezier(.455,.03,.515,.955)',
			'easeInQuart':    'cubic-bezier(.895,.03,.685,.22)',
			'easeOutQuart':   'cubic-bezier(.165,.84,.44,1)',
			'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
			'easeInQuint':    'cubic-bezier(.755,.05,.855,.06)',
			'easeOutQuint':   'cubic-bezier(.23,1,.32,1)',
			'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
			'easeInSine':     'cubic-bezier(.47,0,.745,.715)',
			'easeOutSine':    'cubic-bezier(.39,.575,.565,1)',
			'easeInOutSine':  'cubic-bezier(.445,.05,.55,.95)',
			'easeInBack':     'cubic-bezier(.6,-.28,.735,.045)',
			'easeOutBack':    'cubic-bezier(.175, .885,.32,1.275)',
			'easeInOutBack':  'cubic-bezier(.68,-.55,.265,1.55)'
		};

		if (cssEase[ease])
			ease = cssEase[ease];

		var sfx = "";
		var transitionEnd = "transitionEnd";
		if (jQuery.browser.webkit || jQuery.browser.opera) {
			sfx = "-webkit-";
			transitionEnd = "webkitTransitionEnd";
		} else if (jQuery.browser.mozilla) {
			sfx = "-moz-";
			transitionEnd = "transitionend";
		}  else if (jQuery.browser.msie) {
			sfx = "-ms-";
			transitionEnd = "msTransitionEnd";
		}

		var prop = [];
		for (var o in opt) {
			var key = o;
			if (key === "transform") {
				key = sfx + "transform";
				opt[key] = opt[o];
				delete opt[o];
			}

			if (key === "filter") {
				key = sfx + "filter";
				opt[key] = opt[o];
				delete opt[o];
			}

			if (key === "transform-origin" || key === "origin") {
				key = sfx + "transform-origin";
				opt[key] = opt[o];
				delete opt[o];
			}

			/**
			 * Translate
			 * */

			if (key === "x") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" translateX("+setUnit(opt[o],"px")+")");
				delete opt[o];
			}

			if (key === "y") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" translateY("+setUnit(opt[o],"px")+")");
				delete opt[o];
			}

			if (key === "z") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" translateZ("+setUnit(opt[o],"px")+")");
				delete opt[o];
			}

			/**
			 * Rotate
			 * */
			if (key === "rotate") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" rotate("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			if (key === "rotateX") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" rotateX("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			if (key === "rotateY") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" rotateY("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			if (key === "rotateZ") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" rotateZ("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			/**
			 * Scale
			 * */
			if (key === "scale") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" scale("+setUnit(opt[o],"")+")");
				delete opt[o];
			}

			if (key === "scaleX") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" scaleX("+setUnit(opt[o],"")+")");
				delete opt[o];
			}

			if (key === "scaleY") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" scaleY("+setUnit(opt[o],"")+")");
				delete opt[o];
			}

			if (key === "scaleZ") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" scaleZ("+setUnit(opt[o],"")+")");
				delete opt[o];
			}

			/**
			 * Skew
			 * */

			if (key === "skew") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" skew("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			if (key === "skewX") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" skewX("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			if (key === "skewY") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" skewY("+setUnit(opt[o],"deg")+")");
				delete opt[o];
			}

			/**
			 * Perspective
			 * */
			if (key === "perspective") {
				key = sfx + "transform";
				opt[key] = opt[key] || "";
				opt[key]+= (" perspective("+setUnit(opt[o],"px")+")");
				delete opt[o];
			}

			if(prop.indexOf(key)<0)
				prop.push(uncamel(key));
		}

		var properties = prop.join(",");

		function endTransition () {

			$el.off(transitionEnd+"."+el.id);
			clearTimeout(el.timeout);
			$el.css(sfx + "transition", "");
			if (typeof callback == "function") {
				callback.apply(el);
			}

			el.called = true;
			el.CSSAIsRunning = false;

			if(typeof el.CSSqueue == "function"){
				el.CSSqueue();
				el.CSSqueue = null;
			}
		};

		var css ={};
		$.extend(css,opt);

		css[sfx + "transition-property"] = properties;
		css[sfx + "transition-duration"] = duration + "ms";
		css[sfx + "transition-delay"] = delay + "ms";
		css[sfx + "transition-timing-function"] = ease;
		//css[sfx + "transition-style"] = "preserve-3d";
		//css[sfx + "backface-visibility"] = "hidden";

		setTimeout(function(){
			$el.one(transitionEnd+"."+el.id, endTransition);
			$el.css(css);
		},1);

		//if there's no transition than call the callback anyway
		el.timeout = setTimeout(function () {

			if ($el.called || !callback) {
				$el.called = false;
				el.CSSAIsRunning = false;
				return;
			}

			$el.css(sfx + "transition", "");
			callback.apply(el);

			el.CSSAIsRunning = false;
			if(typeof el.CSSqueue == "function"){
				el.CSSqueue();
				el.CSSqueue = null;
			}
		}, duration + delay + 300);

	})
};

$.fn.css3 = function(opt){
	return this.each(function(){
		$(this).CSSAnimate(opt,1,0,null);
	})
};

/**
 * dial gauge directive for AngularJS
 *
 * Author: Chris Jackson
 *
 * License: MIT
 *
 * this module has been quacked (hacked) for DuckieTV. 
 * v0.1.5.1 now ng-strict-di compliant.
 * v0.1.5.2 color gradient bug squashed.
 * v0.1.5.3 value is displayed to 1 fixed decimal place.
 * v0.1.5.4 fix bar color going white when ngModel > scaleMax.
 * v0.1.5.5 Introduced scaleMaxRelative as a dynamic way to adjust the scale to always show ngModel proportionally to the next multiple.
 */
angular.module('angular-dialgauge', [
    'ngSanitize'
])
    .directive('ngDialGauge', ["$window", "$sce", "$interval", function ($window, $sce, $interval) {
        return {
            restrict: 'E',                  // Use as element
            scope: {                        // Isolate scope
                ngModel: '=',
                scaleMin: '@',
                scaleMax: '@',
                scaleMaxRelative: '@',
                rotate: '@',
                angle: '@',
                units: '@',
                title: '@',
                dialWidth: '@',
                borderWidth: '@',
                borderOffset: '@',
                borderColor: '@',
                trackColor: '@',
                barColor: '@',
                barColorEnd: '@',
                barWidth: '@',
                barAngle: '@',
                scaleOffset: '@',
                lineCap: '@',
                scaleMinorColor: '@',
                scaleMinorWidth: '@',
                scaleMinorLength: '@',
                scaleMinorSteps: '@',
                scaleMajorColor: '@',
                scaleMajorWidth: '@',
                scaleMajorLength: '@',
                scaleMajorSteps: '@',
                percent: '@',
                options: '=?'
            },
            template: '' +
            '<div style="width:100%;height:100%;" ng-bind-html="gauge"></div>',
            controller: ["$scope", "$element", function ($scope, $element) {
                // Define variables for this gauge
                var radDeg = 180 / Math.PI;
                var staticPath = "";
                var pathRadius = 0;
                var valueScale = 0;
                var startAngle = 0;
                var endAngle = 0;
                var knobAngle = 0;
                var fullAngle = 0;
                var valWindow = null;
                var currentValue = null;
                var intermediateValue = null;
                var timer = null;
                var height;
                var width;
                var relative = false;
                var scaling = '';


                var defaults = {                     // Default settings
                    scaleMin: 0,
                    scaleMax: 100,
                    scaleMaxRelative: false,
                    rotate: 180,
                    angle: 225,
                    units: "",
                    title: "",
                    dialWidth: 3,
                    borderWidth: 1,
                    borderOffset: 2,
                    borderColor: "#a0a0a0",
                    trackColor: '#c0c0c0',
                    barColor: 'red',
                    barColorEnd: '',
                    barWidth: 3,
                    barAngle: 0,
                    scaleOffset: 3,
                    lineCap: 'round',
                    scaleMinorColor: '#c0c0c0',
                    scaleMinorWidth: 0.5,
                    scaleMinorLength: 3,
                    scaleMinorSteps: 36,
                    scaleMajorColor: '#c0c0c0',
                    scaleMajorWidth: 1,
                    scaleMajorLength: 5,
                    scaleMajorSteps: 9,
                    percent: false
                };

                // Set default configuration
                var cfg = {};
                parseParameters({});


                var rect = $element[0].getBoundingClientRect();
                var center = Math.floor(Math.min(rect.width, rect.height) / 2);
                height = width = center * 2;

                $scope.getElementDimensions = function () {
                    var rect = $element[0].getBoundingClientRect();
                    return {'h': rect.height, 'w': rect.width};
                };

                $scope.$watch($scope.getElementDimensions, function (newValue, oldValue) {
                    if(newValue == null) {
                        return;
                    }

                    var c = Math.floor(Math.min(newValue.w, newValue.h) / 2);

                    // Update the static path for the gauge if it's changed
                    if (c != center) {
                        center = c;
                        height = width = center * 2;

                        if(relative) {
                            center = 50;
                            scaling = 'transform="scale(' + (height / 100) + ')"';
                        }
                        staticPath = createStaticPath();
                        updateBar(currentValue);
                    }
                }, true);


                // Add a watch on the options structure.
                // If anything changes, update the static path
                $scope.$watch('options', function() {
                    parseParameters($scope.options);

                    // Update the static path for the gauge
                    staticPath = createStaticPath();
                    updateBar(currentValue);
                });

                // Add a watch on all configuration variables.
                // If anything changes, update the static path
                $scope.$watch([
                    'rotate',
                    'angle',
                    'scaleMin',
                    'scaleMax',
                    'lineCap',
                    'barWidth',
                    'barColor',
                    'barColorEnd',
                    'barAngle',
                    'trackColor',
                    'scaleOffset',
                    'scaleMinorSteps',
                    'scaleMajorColor',
                    'scaleMajorWidth',
                    'scaleMajorLength',
                    'scaleMajorSteps',
                    'scaleMinorLength',
                    'scaleMinorWidth',
                    'scaleMinorColor',
                    'dialWidth',
                    'borderWidth',
                    'borderOffset',
                    'borderColor',
                    'units',
                    'percent',
                    'title'
                ], function () {
                    parseParameters($scope);

                    // Update the static path for the gauge
                    staticPath = createStaticPath();
                    updateBar(currentValue);
                });

                // Set a watch on the model so we can update the dynamic part of the gauge
                $scope.$watch("ngModel", function (value) {
                    // The gauge isn't updated immediately.
                    // We use a timer to update the gauge dynamically
                    if (currentValue == null) {
                        currentValue = value;
                        updateBar(value);
                        return;
                    }
                    if (timer != null) {
                        $interval.cancel(timer);
                        timer = null;
                    }
                    intermediateValue = currentValue;
                    currentValue = value;
                    timer = $interval(function () {
                            var step = (currentValue - intermediateValue) / 10;
                            if (Math.abs(step) < valWindow) {
                                intermediateValue = currentValue;
                                $interval.cancel(timer);
                            }
                            else {
                                intermediateValue += step;
                            }
                            updateBar(intermediateValue);
                        },
                        20, 100);
                });

                // Create the static part of the gauge
                function createStaticPath() {
                    // Sanity check
                    if (center <= 0) {
                        return;
                    }

//                    console.log("Centre", center, cfg.dialWidth);
                    var radius = center - cfg.dialWidth;
//                    console.log("Radius", radius);

//                    console.log("This is", this);

                    // Sanitise the rotation
                    // Rotation should start at the top, so we need to subtract 90 degrees
                    var rotate = cfg.rotate - 90;
                    if (rotate < 0) {
                        rotate += 360;
                    }
                    rotate = rotate + (360 - cfg.angle) / 2;

                    // Calculate start and end angles - in radians
                    startAngle = rotate / radDeg;
                    if (startAngle > Math.PI * 2) {
                        startAngle -= Math.PI * 2;
                    }
                    endAngle = startAngle + cfg.angle / radDeg;
                    if (endAngle > (Math.PI * 2)) {
                        endAngle -= (Math.PI * 2);
                    }

                    // Calculate the scaling factor for the value
                    // This accounts for the actual scale from the user, the rotation angle,
                    // and the conversion to radians
                    valueScale = cfg.scaleMax / (cfg.scaleMax - cfg.scaleMin) * cfg.angle /
                    radDeg;

                    // Keep all the static parts of the path separately cached
                    var path = "";

                    // Draw the BORDER
                    if (cfg.borderWidth != 0) {
                        radius -= Math.ceil(cfg.borderWidth / 2);

                        // This is currently a full circle - maybe it should be an arc?
                        path += '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" ' +
                        'style="stroke:' + cfg.borderColor + ';' +
                        'stroke-width:' + cfg.borderWidth + ';' +
                        'fill:transparent;' +
                        '"/>';

                        radius -= Math.ceil(cfg.borderWidth / 2);
                        radius -= cfg.borderOffset;
                    }

                    // Calculate the maximum scale size
                    var scaleLength = 0;
                    if (cfg.scaleMinorLength != 0 || cfg.scaleMajorLength != 0) {
                        scaleLength = Math.max(cfg.scaleMajorLength, cfg.scaleMinorLength);
                    }

                    // Draw the minor scale
                    if (cfg.scaleMinorLength != 0) {
                        path += '<path d="';
                        var scaleAngle = startAngle;
                        var inner = radius - scaleLength;
                        var outer = inner + cfg.scaleMinorLength;
                        var scaleSteps = cfg.scaleMinorSteps;
                        var scaleInc = cfg.angle / scaleSteps / radDeg;
                        do {
                            var cos = Math.cos(scaleAngle);
                            var sin = Math.sin(scaleAngle);

                            path += ' M' + (center + (cos * inner)) + ' ' + (center + (sin * inner));
                            path += ' L' + (center + (cos * outer)) + ' ' + (center + (sin * outer));

                            scaleAngle += scaleInc;
                            if (scaleAngle > (Math.PI * 2)) {
                                scaleAngle -= (Math.PI * 2);
                            }
                        }
                        while (scaleSteps-- > 0);

                        path += '" ';
                        path += 'stroke="' + cfg.scaleMinorColor + '" ' +
                        'stroke-width="' + cfg.scaleMinorWidth + '" ' +
                        '/>';
                    }

                    // Draw the major scale
                    if (cfg.scaleMajorLength != 0) {
                        path += '<path d="';
                        var scaleAngle = startAngle;
                        var inner = radius - scaleLength;
                        var outer = inner + cfg.scaleMajorLength;
                        var scaleSteps = cfg.scaleMajorSteps;
                        var scaleInc = cfg.angle / scaleSteps / radDeg;
                        do {
                            var cos = Math.cos(scaleAngle);
                            var sin = Math.sin(scaleAngle);

                            path += ' M' + (center + (cos * inner)) + ' ' + (center + (sin * inner));
                            path += ' L' + (center + (cos * outer)) + ' ' + (center + (sin * outer));

                            scaleAngle += scaleInc;
                            if (scaleAngle > (Math.PI * 2)) {
                                scaleAngle -= (Math.PI * 2);
                            }
                        }
                        while (scaleSteps-- > 0);

                        path += '" ';
                        path += 'stroke="' + cfg.scaleMajorColor + '" ' +
                        'stroke-width="' + cfg.scaleMajorWidth + '" ' +
                        '/>';
                    }

                    // Alter the radius to account for the scale
                    if (scaleLength !== 0) {
                        radius -= scaleLength;
                        radius -= cfg.scaleOffset;
                    }

                    // Draw the TRACK
                    radius -= cfg.barWidth / 2;
                    pathRadius = radius;
                    if (cfg.trackColor != "none") {
                        var arc = getArc(radius, startAngle + 0.0000001, endAngle - 0.0000001);
                        path += '<path d="M' + arc.sX + ' ' + arc.sY;
                        path +=
                            ' A ' + radius + ' ' + radius + ',0,' + arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                        path += 'stroke="' + cfg.trackColor + '" ' +
                        'stroke-linecap="' + cfg.lineCap + '" ' +
                        'stroke-width="' + cfg.barWidth + '" ' +
                        'fill="transparent"' +
                        '/>';
                    }

                    if (cfg.title) {
                        path += '<text text-anchor="middle" x="' + center + '" y="' + (center + 20) +
                        '" class="dialgauge-title">' + cfg.title + '</text>';
                    }

                    return path;
                }

                // Update the dynamic part of the gauge
                function updateBar(newValue) {
                    // Sanity check the value
                    var value = newValue;
                    if (newValue === undefined) {
                        value = cfg.scaleMin;
                    }
                    else if (value > cfg.scaleMax) {
                        if (cfg.scaleMaxRelative) {
                            cfg.scaleMax = cfg.scaleMax * 10;
                        } else {
                            value = cfg.scaleMax;
                        }
                    }
                    else if (value < cfg.scaleMin) {
                        value = cfg.scaleMin;
                    }
                    var valueForColor = value;

                    // Turn value into a percentage of the max angle
                    value = (value - cfg.scaleMin) / cfg.scaleMax;
                    value = value * valueScale;

                    // Create the bar.
                    // If we've specified a barAngle, then only a small knob is required
                    // Otherwise we start from the beginning
                    var start, end;
                    if (cfg.barAngle !== 0) {
                        start = value - knobAngle;
                        if (start < 0) {
                            start = 0;
                        }
                        end = start + (knobAngle * 2);
                        if (end > fullAngle) {
                            end = fullAngle;
                            start = end - (knobAngle * 2);
                        }

                        start = start + startAngle;
                        if (start > Math.PI * 2) {
                            start -= Math.PI * 2;
                        }
                        end = end + startAngle;
                    }
                    else {
                        start = startAngle;
                        end = value + startAngle;
                    }
                    if (end > Math.PI * 2) {
                        end -= Math.PI * 2;
                    }

                    var color;
                    // Calculate the bar color
                    if (typeof cfg.barColor === "string") {
                        color = cfg.barColor;
                    }
                    else {
                        var A = color2rgb(cfg.barColor[0]);
                        var B = color2rgb(cfg.barColor[1]);
                        var gradient = [];
                        for (var c = 0; c < 3; c++) {
                            gradient[c] = A[c] + (B[c] - A[c]) * valueForColor / cfg.scaleMax;
                        }

                        color = rgb2color(gradient);
                    }

                    var arc = getArc(pathRadius, start, end);

                    var path = "";
                    path += '<path d="M' + arc.sX + ' ' + arc.sY;
                    path +=
                        ' A ' + pathRadius + ' ' + pathRadius + ',0,' + arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                    path += 'stroke="' + color + '" ' +
                    'stroke-linecap="' + cfg.lineCap + '" ' +
                    'stroke-width="' + cfg.barWidth + '" ' +
                    'fill="transparent"' +
                    '/>';

                    if (newValue) {
                        path += '<text text-anchor="middle" x="' + center + '" y="' + center + '">' +
                        '<tspan class="dialgauge-value">' + newValue.toFixed(1) + '</tspan>';
                    }

                    if (cfg.units != undefined) {
                        path += '<tspan dx="3" class="dialgauge-unit">' + cfg.units + '</tspan>';
                    }
                    path += '</text>';


                    $scope.gauge =
                        $sce.trustAsHtml('<svg width="100%" height="100%"><g ' + scaling +'>' + staticPath + path +
                        '</g></svg>');
                }

                // Calculate the start and end positions
                // Also calculate the large-arc flag.
                // This is 1 for long, and 0 for short arc
                function getArc(radius, startAngle, endAngle) {
                    var startX = center + (Math.cos(startAngle) * radius);
                    var startY = center + (Math.sin(startAngle) * radius);
                    var endX = center + (Math.cos(endAngle) * radius);
                    var endY = center + (Math.sin(endAngle) * radius);
                    var dir = 0;

                    if (startAngle > endAngle && (Math.PI * 2 - startAngle + endAngle) > Math.PI) {
                        dir = 1;
                    }
                    else if (endAngle - startAngle < Math.PI) {
                        dir = 0;
                    }
                    else if (startAngle + endAngle > Math.PI) {
                        dir = 1;
                    }

                    return {sX: startX, sY: startY, eX: endX, eY: endY, dir: dir};
                }

                function parseParameters(cfgObject) {
                    if(cfgObject == null) {
                        return;
                    }

                    for (var key in defaults) {
//                        console.log("Checking ", key);

                        if (cfgObject[key] !== undefined) {
                            cfg[key] = cfgObject[key];
                        }
                        else if (cfg[key] === undefined) {
                            cfg[key] = defaults[key];
                        }
                        // Convert any numerics into numbers!
                        if (typeof defaults[key] === 'number') {
                            cfg[key] = Number(cfg[key]);
                            if (isNaN(cfg[key])) {
                                cfg[key] = 0;
                            }
                        }
                        else if (typeof defaults[key] === 'boolean' &&  typeof cfg[key] !== 'boolean') {
                            cfg[key] = cfg[key] === 'true' ? true : false;
                        }
                    }

                    if (cfg.barColorEnd.length !== 0) {
                        var color = [];
                        color[0] = cfg.barColor;
                        color[1] = cfg.barColorEnd;
                        cfg.barColor = color;
                    }

                    relative = cfg.percent;
                    if(relative == true) {

                    }

                    knobAngle = cfg.barAngle / radDeg / 2;
                    fullAngle = cfg.angle / radDeg;

                    // Calculate the minimum step used when moving the pointer
                    // If the step is below this value, then we set to the final value
                    valWindow = (cfg.scaleMax - cfg.scaleMin) / 2000
                }

                // Color #FF00FF format to Array(255,0,255)
                function color2rgb(color) {
                    var r = parseInt(color.substr(1, 2), 16);
                    var g = parseInt(color.substr(3, 2), 16);
                    var b = parseInt(color.substr(5, 2), 16);
                    return new Array(r, g, b);
                }

                // The color of Array (255,0255) format to#FF00FF
                function rgb2color(rgb) {
                    var s = "#";
                    for (var i = 0; i < 3; i++) {
                        var c = Math.round(rgb[i]).toString(16);
                        if (c.length == 1)
                            c = '0' + c;
                        s += c;
                    }
                    return s.toUpperCase();
                }
            }]
        };
    }])
;


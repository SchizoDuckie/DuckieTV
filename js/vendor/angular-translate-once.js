/**
 * 1.0.4
 * https://github.com/ajwhite/angular-translate-once
 *
 */
(function () {
  'use strict';
  var MODULE_NAME = 'pascalprecht.translate',
      DIRECTIVE_NAME = 'translateOnce',
      ATTRS = ['value', 'title', 'alt', 'placeholder'],
      getNamedDirectiveFromAttribute,
      createDirective;

  getNamedDirectiveFromAttribute = function (attribute) {
    return DIRECTIVE_NAME + attribute.charAt(0).toUpperCase() + attribute.slice(1);
  };

  createDirective = function (attribute) {
    var namedDirective = getNamedDirectiveFromAttribute(attribute);
    angular.module(MODULE_NAME).directive(namedDirective, ['$parse', '$translate',
    angular.bind(undefined, TranslateOnceAttributeDirective, attribute)]);
  };

  /**
   * Translate Once Attributes
   * Translate a key once for a given attribute
   * <a translate-once-title="TRANSLATION_TITLE"><a>
   */
  function TranslateOnceAttributeDirective (attribute, $parse, $translate) {
    var namedDirective = getNamedDirectiveFromAttribute(attribute);
    return {
      restrict: 'A',
      priority: -2,
      link: function (scope, element, attrs) {
        var translateValues = {};
        // if we have custom values, interpret them
        if (attrs.translateValues) {
          translateValues = $parse(attrs.translateValues)(scope);
        }
        // queue the translation
        $translate(attrs[namedDirective], translateValues).then(function (translation) {
          // update the element with the translation
          element.attr(attribute, translation);
        });
      }
    };
  }

  /**
   * Translate Once
   * Translate the key once
   */
  function TranslateOnceDirective ($compile, $parse, $translate) {
    return {
      restrict: 'A',
      priority: -1,
      link: function (scope, element, attrs) {
        var translateValues = {},
            translationKey = attrs[DIRECTIVE_NAME];

        // if the attribute doesn't have a value, use the element's text
        if (!translationKey) {
          translationKey = element.text().trim();
        }

        // if we have custom values, interpret them
        if (attrs.translateValues) {
          translateValues = $parse(attrs.translateValues)(scope);
        }

        // queue the translation
        $translate(translationKey, translateValues).then(function (translation) {
          // update the element with the translation
          element.html(translation);

          // if the flag for compiling is set, compile it
          if (attrs.hasOwnProperty('translateCompile')) {
            // compile the element with the scope
            $compile(element.contents())(scope);
          }
        });
      }
    };
  }

  // generate the `translate-once-{attr}` directives
  ATTRS.forEach(function (attr) {
    createDirective(attr);
  });

  angular.module(MODULE_NAME)
    .directive(DIRECTIVE_NAME, [
      '$compile',
      '$parse',
      '$translate',
      TranslateOnceDirective
    ]);
}).apply(this);

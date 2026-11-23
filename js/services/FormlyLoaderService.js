/**
 * Load Angular Formly definitions from JSON and bind controller-provided
 * values and functions to the fields at runtime.
 */
DuckieTV.factory('FormlyLoader', ['$http', '$parse', function($http, $parse) {
  var config = {
    basePath: 'templates/formly-forms/'
  }

  /**
   * Replace references beginning with $mappings. in the response's own fields.
   * Assign the mapped values directly so callbacks retain their identity.
   * Example:
   *
   *
   *   {
   *      "key": "leecherProperty",
   *      "className": "cseProperty col-xs-3",
   *      "type": "select",
   *      "templateOptions": {
   *          "required": true,
   *          "label": "Attribute",
   *          "valueProp": "name",
   *          "options": "$mappings.options.attributeWhitelist"
   *      },
   *      "asyncValidators": "$mappings.validators.attributeSelector"
   *  }
   *
   */
  function processMappings(field, mappings) {
    if (!angular.isObject(field)) return field

    Object.keys(field).forEach(function(key) {
      if (angular.isString(field[key]) && field[key].indexOf('$mappings.') === 0) {
        var getter = $parse(field[key].substring('$mappings.'.length))
        field[key] = getter(mappings)
      } else if (angular.isObject(field[key])) {
        field[key] = processMappings(field[key], mappings)
      }
    })
    return field
  }

  var service = {
    /**
     * Configure base path to load forms from.
     * @param string path
     */
    setBasePath: function(path) {
      config.basePath = path
    },
    /**
     * Load a form using only this call's mappings. Overlapping requests can
     * finish in either order without taking values from one another.
     * @param {string} form Name of the JSON template without its extension.
     * @param {Object} [mappings] Values and functions referenced by the template.
     * @returns {Promise<Array>} The resolved Formly field definitions.
     */
    load: function(form, mappings) {
      mappings = mappings || {}
      return $http.get(config.basePath + form + '.json').then(function(result) {
        return result.data.map(function(field) {
          return processMappings(field, mappings)
        })
      })
    }
  }

  return service
}])

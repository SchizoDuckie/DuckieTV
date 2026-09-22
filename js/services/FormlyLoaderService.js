/**
 *
 * Angular-Formly file-loader companion module by SchizoDuckie
 *
 * Store your formly-forms in .json files and load them at runtime to keep your controller clean
 * Usage: <todo:link to jsbin here>
 *
 */
DuckieTV.factory('FormlyLoader', ['$http', '$parse', function($http, $parse) {
  var config = {
    basePath: 'templates/formly-forms/'
  }

  /**
   * Recursively process the properties of the json file loaded.
   * Find properties that are strings and start with $mappings.
   * Resolve each mapping from the object captured by the current load request.
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
     * Load a form from json and process the mappings supplied for this request.
     * @param string form name of the form to load (wrapped between basepath and  .json)
     * @param object mappings values and functions referenced by the form
     * @returns Promise(form config)
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

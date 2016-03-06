/**
 *
 * Angular-Formly file-loader companion module by SchizoDuckie
 *
 * Store your formly-forms in .json files and load them at runtime to keep your controller clean
 *
 * Usage: <todo:link to jsbin here>
 *
 *
 */
DuckieTV.service('FormlyLoader', ["$http", "$parse", function($http, $parse) {

    var config = {
        basePath: 'templates/formly-forms/',
        mappings: {}
    };

    /** 
     * Recursively process the formly form's fieldGroup, process individual formly elements when no fieldgroups found
     */
    function recursivePropertyMap(field) {
        if (field.fieldGroup) {
            field.fieldGroup = field.fieldGroup.map(recursivePropertyMap);
            return field;
        }
        return processMappings(field);

    }

    /**
     * Recursively process the properties of the json file loaded.
     * Find properties that are strings and start with $mappings.
     * If this is a property registered with setMapping, it will grab the value of it via $parse
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
    function processMappings(field) {
        Object.keys(field).map(function(key) {
            if (angular.isObject(field[key])) {
                field[key] = processMappings(field[key]);
            } else if (field[key].toString().indexOf('$mappings') === 0) {
                var getter = $parse(field[key].split('$mappings.')[1]);
                field[key] = getter(config.mappings);
            }
        });
        return field;
    }


    var service = {
        /**
         * Configure base path to load forms from.
         * @param string path
         */
        setBasePath: function(path) {
            config.basePath = path;
        },
        /**
         * Load a form from json and process the registered mappings.
         * @param string form name of the form to load (wrapped between basepath and  .json)
         * @returns Promise(form config)
         */
        load: function(form) {
            return $http.get(config.basePath + form + '.json').then(function(result) {
                return result.data.map(recursivePropertyMap);
            });
        },
        /**
         * Register a property and an object that you will target at any point in your formly json config to have them
         * automagically swapped out at load.
         * This prevents duplication in your forms (for for instance repeating properties and validators) and allows you
         * to map javascript functions while still storing your form as json.
         *
         * usage:
         *
         * // In your controller before FormlyLoader.load('myFormName')
         *
         * FormlyLoader.setMapping('modelOptions', {
         *   keyup: {
         *       "updateOn": "keyup",
         *       "debounce": 200
         *   }
         *  });
         *
         * // In your myFormName.json:
         *
         * {
         *   "className": "row",
         *   "fieldGroup": [{
         *       "key": "leecherSelector",
         *       "className": "cseSelector col-xs-6",
         *       "type": "input",
         *       "templateOptions": {
         *           "required": true,
         *           "label": "Leechers Selector (element that has the 'leechers')",
         *           "type": "text"
         *       },
         *       "asyncValidators": "$mappings.validators.propertySelector",
         *       "modelOptions": "$mappings.modelOptions.keyup"
         *  }
         *
         * @param string key mapping key to register
         * @param object mappings to register for the key
         *
         */
        setMapping: function(key, option) {
            config.mappings[key] = option;
        }

    };

    return service;


}]);
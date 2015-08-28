/**
 * Formly loader and config mapper.
 * use setMapping and $parse strings to map individual properties to functions and arrays to remove duplicaton.
 *
 *
 * Example in customSearchEngineCtrl.js
 *
 */
DuckieTV.factory('FormlyLoader', function($http, $parse) {

    var config = {
        basePath: 'templates/formly-forms/',
        mappings: {}
    };

    function recursivePropertyMap(field) {
        if (field.fieldGroup) {
            field.fieldGroup = field.fieldGroup.map(recursivePropertyMap);
            return field;
        }
        return processMappings(field);

    }

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
        setBasePath: function(path) {
            config.basePath = path;
        },

        setMapping: function(key, option) {
            config.mappings[key] = option;
        },

        load: function(form) {
            return $http.get(config.basePath + form + '.json').then(function(result) {
                return result.data.map(recursivePropertyMap);
            });
        }

    };

    return service;


});
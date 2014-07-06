angular.module('DuckieTV.providers.filereader', [])

/**
 * FileReader Provider and directive
 * Allows to read the contents of a file upload field to string
 */
.factory('FileReader', function($q) {

    var onLoad = function(reader, deferred, $scope) {
        return function() {
            $scope.$apply(function() {
                deferred.resolve(reader.result);
            });
        };
    };

    var onError = function(reader, deferred, $scope) {
        return function() {
            $scope.$apply(function() {
                deferred.reject(reader.result);
            });
        };
    };

    var onProgress = function(reader, $scope) {
        return function(event) {
            $scope.$broadcast("fileProgress", {
                total: event.total,
                loaded: event.loaded
            });
        };
    };

    var getReader = function(deferred, $scope) {
        var reader = new FileReader();
        reader.onload = onLoad(reader, deferred, $scope);
        reader.onerror = onError(reader, deferred, $scope);
        reader.onprogress = onProgress(reader, $scope);
        return reader;
    };

    var readAsText = function(file, $scope) {
        var deferred = $q.defer();

        var reader = getReader(deferred, $scope);
        reader.readAsText(file);

        return deferred.promise;
    };

    return {
        readAsText: readAsText
    };


}).directive('fileInput', function($parse) {
    return {
        restrict: "EA",
        template: "<input type='file' />",
        replace: true,
        link: function(scope, element, attrs) {

            var modelGet = $parse(attrs.fileInput);
            var modelSet = modelGet.assign;
            var onChange = $parse(attrs.onChange);

            var updateModel = function() {
                console.log("UPDATE!");
                scope.$apply(function() {
                    modelSet(scope, element[0].files[0]);
                    onChange(scope);
                });
            };

            element.bind('change', updateModel);
        }
    };
})
/**
 * FileReader Provider and directive
 * Allows to read the contents of a file upload field to string
 */
DuckieTV.factory('FileReader', ["$q",
        function($q) {
	// Fires when the while file blob has been read
    var onLoad = function(reader, deferred, $scope) {
        return function() {
            $scope.$apply(function() {
                deferred.resolve(reader.result);
            });
        };
    };
    // Fires when an error has occured during the reading of a file
    var onError = function(reader, deferred, $scope) {
        return function() {
            $scope.$apply(function() {
                deferred.reject(reader.result);
            });
        };
    };
    // Handle file reading progress. 
    // Catching this with a $scope.$watch for fileProgress 
    // is only really useful for showing a progresbar on large file reads
    var onProgress = function(reader, $scope) {
        return function(event) {
            $scope.$broadcast("fileProgress", {
                total: event.total,
                loaded: event.loaded
            });
        };
    };

    /** 
     *  Create a new fileReader and hook an existing promise to it's event handlers
     */
    var getReader = function(deferred, $scope) {
        var reader = new FileReader();
        reader.onload = onLoad(reader, deferred, $scope);
        reader.onerror = onError(reader, deferred, $scope);
        reader.onprogress = onProgress(reader, $scope);
        return reader;
    };

    /** 
     * Read a file as text. Creates a FileReader instance and resolves a promise when
     * the file has been read.
     */
    var readAsText = function(file, $scope) {
        var deferred = $q.defer();
        var reader = getReader(deferred, $scope);
        reader.readAsText(file);
        return deferred.promise;
    };

    // return only the public readAsText function
    return {
        readAsText: readAsText
    };
}])

/** 
 * The <file-input> directive provides a file upload box that
 * can read the contents of the file selected into a string.
 *
 * When a file is selected, it fires it's onChange event and can
 * then return the contents of the file via FileReader.readAsText(fileName)
 */
.directive('fileInput', ["$parse", function($parse) {
    return {
        restrict: "EA",
        template: "<input type='file' />",
        replace: true,
        link: function(scope, element, attrs) {

            var modelGet = $parse(attrs.fileInput);
            var modelSet = modelGet.assign;
            var onChange = $parse(attrs.onChange);

            var updateModel = function() {
                //console.debug("UPDATE!");
                scope.$apply(function() {
                    modelSet(scope, element[0].files[0]);
                    onChange(scope);
                });
            };
            
            element.bind('change', updateModel);
        }
    };
}])
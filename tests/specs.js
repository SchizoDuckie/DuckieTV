 /** karma conf with json fixtures


 basePath: '../',

files: [
      ... 
      'test/vendor/jasmine-jquery.js',
      'test/unit/\*\*/
 /* .js ',

     {pattern: '
      test / mock
 /*.json', watched: true, served: true, included: false}
    ],

     */



 describe('FavoritesService test', function() {
     var $scope, ctrl, $timeout;

     /* declare our mocks out here
      * so we can use them through the scope
      * of this describe block.
      */
     var someServiceMock;
     module('DuckieTV');

     var $httpBackend, createController, scope;

     beforeEach(inject(function($injector, $rootScope, $controller) {

         $httpBackend = $injector.get('$httpBackend');
         jasmine.getJSONFixtures().fixturesPath = './mock/';

         $httpBackend.whenGET('http://api.trakt.tv/show/summary.json/dc6cdb4bcbc5cb9f2b666202a10353d6/257655/extended').respond(
             getJSONFixture('arrow.json')
         );

     }));


     // This function will be called before every "it" block.
     // This should be used to "reset" state for your tests.
     beforeEach(function() {
         // Create a "spy object" for our someService.
         // This will isolate the controller we're testing from
         // any other code.
         // we'll set up the returns for this later 
         someServiceMock = jasmine.createSpyObj('someService', ['someAsyncCall']);

         // load the module you're testing.
         module('myApp');

         // INJECT! This part is critical
         // $rootScope - injected to create a new $scope instance.
         // $controller - injected to create an instance of our controller.
         // $q - injected so we can create promises for our mocks.
         // _$timeout_ - injected to we can flush unresolved promises.
         inject(function($rootScope, $controller, $q, _$timeout_) {
             // create a scope object for us to use.
             $scope = $rootScope.$new();

             // set up the returns for our someServiceMock
             // $q.when('weee') creates a resolved promise to "weee".
             // this is important since our service is async and returns
             // a promise.
             someServiceMock.someAsyncCall.andReturn($q.when('weee'));

             // assign $timeout to a scoped variable so we can use 
             // $timeout.flush() later. Notice the _underscore_ trick
             // so we can keep our names clean in the tests.
             $timeout = _$timeout_;

             // now run that scope through the controller function,
             // injecting any services or other injectables we need.
             // **NOTE**: this is the only time the controller function
             // will be run, so anything that occurs inside of that
             // will already be done before the first spec.
             ctrl = $controller('MainCtrl', {
                 $scope: $scope,
                 someService: someServiceMock
             });
         });
     });


     /* Test 1: The simplest of the simple.
      * here we're going to test that some things were
      * populated when the controller function whas evaluated. */
     it('should start with foo and bar populated', function() {

         //just assert. $scope was set up in beforeEach() (above)
         expect($scope.foo).toEqual('foo');
         expect($scope.bar).toEqual('bar');
     });


     /* Test 2: Still simple.
      * Now let's test a simple function call. */
     it('should add !!! to foo when test1() is called', function() {
         //set up.
         $scope.foo = 'x';

         //make the call.
         $scope.test1();

         //assert
         expect($scope.foo).toEqual('x!!!');
     });


     /* Test 3: Testing a $watch()
      * The important thing here is to call $apply()
      * and THEN test the value it's supposed to update. */
     it('should update baz when bar is changed', function() {
         //change bar
         $scope.bar = 'test';

         //$apply the change to trigger the $watch.
         $scope.$apply();

         //assert
         expect($scope.baz).toEqual('testbaz');
     });


     /* Test 4: Testing an asynchronous service call.
     Since we've mocked the service to return a promise
     (just like the original service did), we need to do a little
     trick with $timeout.flush() here to resolve our promise so the
     `then()` clause in our controller function fires. 
     
     This will test to see if the `then()` from the promise is wired up
     properly. */
     it('should update fizz asynchronously when test2() is called', function() {
         // just make the call
         $scope.test2();

         // asser that it called the service method.
         expect(someServiceMock.someAsyncCall).toHaveBeenCalled();

         // call $timeout.flush() to flush the unresolved dependency from our
         // someServiceMock.
         $timeout.flush();

         // assert that it set $scope.fizz
         expect($scope.fizz).toEqual('weee');
     });
 });
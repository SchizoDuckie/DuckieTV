/**
 * Note: This version requires Angular UI Bootstrap >= v0.6.0 
 */

//== Controllers =============================================================//

angular.module('dialogs.controllers',['ui.bootstrap.modal'])

	/**
	 * Error Dialog Controller 
	 */
	.controller('errorDialogCtrl',['$scope','$modalInstance','header','msg',function($scope,$modalInstance,header,msg){
		//-- Variables -----//
		
		$scope.header = (angular.isDefined(header)) ? header : 'Error';
		$scope.msg = (angular.isDefined(msg)) ? msg : 'An unknown error has occurred.';
		
		//-- Methods -----//
		
		$scope.close = function(){
			$modalInstance.close();
			$scope.$destroy();
		}; // end close
	}]) // end ErrorDialogCtrl
	
	/**
	 * Wait Dialog Controller 
	 */
	.controller('waitDialogCtrl',['$scope','$modalInstance','$timeout','header','msg','progress',function($scope,$modalInstance,$timeout,header,msg,progress){
		//-- Variables -----//
		
		$scope.header = (angular.isDefined(header)) ? header : 'Please Wait...';
		$scope.msg = (angular.isDefined(msg)) ? msg : 'Waiting on operation to complete.';
		$scope.progress = (angular.isDefined(progress)) ? progress : 100;
		
		//-- Listeners -----//
		
		// Note: used $timeout instead of $scope.$apply() because I was getting a $$nextSibling error
		
		// close wait dialog
		$scope.$on('dialogs.wait.complete',function(){
			$timeout(function(){ $modalInstance.close(); $scope.$destroy();});
		}); // end on(dialogs.wait.complete)
		
		// update the dialog's message
		$scope.$on('dialogs.wait.message',function(evt,args){
			$scope.msg = (angular.isDefined(args.msg)) ? args.msg : $scope.msg;
		}); // end on(dialogs.wait.message)
		
		// update the dialog's progress (bar) and/or message
		$scope.$on('dialogs.wait.progress',function(evt,args){
			$scope.msg = (angular.isDefined(args.msg)) ? args.msg : $scope.msg;
			$scope.progress = (angular.isDefined(args.progress)) ? args.progress : $scope.progress;
		}); // end on(dialogs.wait.progress)
		
		//-- Methods -----//
		
		$scope.getProgress = function(){
			return {'width': $scope.progress + '%'};
		}; // end getProgress
	}]) // end WaitDialogCtrl
	
	/**
	 * Notify Dialog Controller 
	 */
	.controller('notifyDialogCtrl',['$scope','$modalInstance','header','msg',function($scope,$modalInstance,header,msg){
		//-- Variables -----//
		
		$scope.header = (angular.isDefined(header)) ? header : 'Notification';
		$scope.msg = (angular.isDefined(msg)) ? msg : 'Unknown application notification.';
		
		//-- Methods -----//
		
		$scope.close = function(){
			$modalInstance.close();
			$scope.$destroy();
		}; // end close
	}]) // end WaitDialogCtrl
	
	/**
	 * Confirm Dialog Controller 
	 */
	.controller('confirmDialogCtrl',['$scope','$modalInstance','header','msg',function($scope,$modalInstance,header,msg){
		//-- Variables -----//
		
		$scope.header = (angular.isDefined(header)) ? header : 'Confirmation';
		$scope.msg = (angular.isDefined(msg)) ? msg : 'Confirmation required.';
		
		//-- Methods -----//
		
		$scope.no = function(){
			$modalInstance.dismiss('no');
		}; // end close
		
		$scope.yes = function(){
			$modalInstance.close('yes');
		}; // end yes
	}]); // end ConfirmDialogCtrl / dialogs.controllers
	
	
//== Services ================================================================//

angular.module('dialogs.services',['ui.bootstrap.modal','dialogs.controllers'])

	/**
	 * Dialogs Service 
	 */
	.factory('$dialogs',['$modal',function($modal){
		return {
			error : function(header,msg,static){
				return $modal.open({
					templateUrl : '/dialogs/error.html',
					controller : 'errorDialogCtrl',
					backdrop: (static ? 'static' : true),
					keyboard: (static ? false: true),
					resolve : {
						header : function() { return angular.copy(header); },
						msg : function() { return angular.copy(msg); }
					}
				}); // end modal.open
			}, // end error
			
			wait : function(header,msg,progress,static){
				return $modal.open({
					templateUrl : '/dialogs/wait.html',
					controller : 'waitDialogCtrl',
					backdrop: (static ? 'static' : true),
					keyboard: (static ? false: true),
					resolve : {
						header : function() { return angular.copy(header); },
						msg : function() { return angular.copy(msg); },
						progress : function() { return angular.copy(progress); }
					}
				}); // end modal.open
			}, // end wait
			
			notify : function(header,msg,static){
				return $modal.open({
					templateUrl : '/dialogs/notify.html',
					controller : 'notifyDialogCtrl',
					backdrop: (static ? 'static' : true),
					keyboard: (static ? false: true),
					resolve : {
						header : function() { return angular.copy(header); },
						msg : function() { return angular.copy(msg); }
					}
				}); // end modal.open
			}, // end notify
			
			confirm : function(header,msg,static){
				return $modal.open({
					templateUrl : '/dialogs/confirm.html',
					controller : 'confirmDialogCtrl',
					backdrop: (static ? 'static' : true),
					keyboard: (static ? false: true),
					resolve : {
						header : function() { return angular.copy(header); },
						msg : function() { return angular.copy(msg); }
					}
				}); // end modal.open
			}, // end confirm
			
			create : function(url,ctrlr,data,opts){
				opts = angular.isDefined(opts) ? opts : {};
				var k = (angular.isDefined(opts.keyboard)) ? opts.keyboard : true; // values: true,false
				var b = (angular.isDefined(opts.backdrop)) ? opts.backdrop : true; // values: 'static',true,false
				var w = (angular.isDefined(opts.windowClass)) ? opts.windowClass : 'dialogs-default'; // additional CSS class(es) to be added to a modal window
				return $modal.open({
					templateUrl : url,
					controller : ctrlr,
					keyboard : k,
					backdrop : b,
					windowClass: w,
					resolve : {
						data : function() { return angular.copy(data); }
					}
				}); // end modal.open
			} // end confirm
		};
	}]); // end $dialogs / dialogs.services
	
	
//== Module ==================================================================//

angular.module('dialogs',['dialogs.services','ngSanitize']) // requires angular-sanitize.min.js (ngSanitize) //code.angularjs.org/1.2.1/angular-sanitize.min.js

	// Add default templates via $templateCache
	.run(['$templateCache','$interpolate',function($templateCache,$interpolate){
    
    var startSym = $interpolate.startSymbol();
    var endSym = $interpolate.endSymbol();
    
		$templateCache.put('/dialogs/error.html','<div class="modal-header dialog-header-error"><button type="button" class="close" ng-click="close()">&times;</button><h4 class="modal-title text-danger"><span class="glyphicon glyphicon-warning-sign"></span> <span ng-bind-html="header"></span></h4></div><div class="modal-body text-danger" ng-bind-html="msg"></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="close()">Close</button></div>');
		$templateCache.put('/dialogs/wait.html','<div class="modal-header dialog-header-wait"><h4 class="modal-title"><span class="glyphicon glyphicon-time"></span> Please Wait</h4></div><div class="modal-body"><p ng-bind-html="msg"></p><div class="progress progress-striped active"><div class="progress-bar progress-bar-info" ng-style="getProgress()"></div><span class="sr-only">'+startSym+'progress'+endSym+'% Complete</span></div></div>');
		$templateCache.put('/dialogs/notify.html','<div class="modal-header dialog-header-notify"><button type="button" class="close" ng-click="close()" class="pull-right">&times;</button><h4 class="modal-title text-info"><span class="glyphicon glyphicon-info-sign"></span> '+startSym+'header'+endSym+'</h4></div><div class="modal-body text-info" ng-bind-html="msg"></div><div class="modal-footer"><button type="button" class="btn btn-primary" ng-click="close()">OK</button></div>');
		$templateCache.put('/dialogs/confirm.html','<div class="modal-header dialog-header-confirm"><button type="button" class="close" ng-click="no()">&times;</button><h4 class="modal-title"><span class="glyphicon glyphicon-check"></span> '+startSym+'header'+endSym+'</h4></div><div class="modal-body" ng-bind-html="msg"></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="yes()">Yes</button><button type="button" class="btn btn-primary" ng-click="no()">No</button></div>');
	}]); // end run / dialogs
	
	

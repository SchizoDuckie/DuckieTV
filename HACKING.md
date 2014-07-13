#Want to help on DuckieTV ? 
###Feel free to send pull requests!

DuckieTV is built with Angular.js and Bootstrap.css
On top of that, the following libraries (and their dependencies) are used (these are placed in the js/vendor folder):

- CreateReadUpdateDelete.js (Javascript Sqlite ORM) https://github.com/SchizoDuckie/CreateReadUpdateDelete.js/
- Dialogs.js (Modal dialogs for Angular.js) https://github.com/m-e-conroy/angular-dialog-service
- UI-Bootstrap.js (Bootstrap enhancements for angular.js) http://angular-ui.github.io/bootstrap/
- Datepicker.js (Somewhat modified, the basis for the calendar) https://github.com/g00fy-/angular-datepicker

Some Angular.js basics for those that are not familiar with it:

## A Service (module)
A service is a piece of code that has one responsibility to keep things modular.
They can be injected into factories and directives.

## A Factory (provider)
A factory is a service that gets instantiated only once (A singleton) 
Due to the way angular handles application cycles, a service may be unloaded from memory at will
A factory will not be unloaded.

## A Directive
Directives are angular.js's glue between HTML and Javascript. They are used in DuckieTV mainly to create custom
HTML tags and add behavior to those. Template variables that are explicitly added to $scope provide 
functions that can be accessed from HTML ng-* attributes and as variables between {{ }}

## A Template
Templates provide views based on $scope variables.


If you want to get a quick overview of how events work within DuckieTV check out events.md:
https://github.com/SchizoDuckie/DuckieTV/blob/angular/events.md
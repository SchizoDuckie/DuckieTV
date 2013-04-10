// css transitions are broken in chrome 26 on mac
// add css overrides if appropriate
if (navigator.appVersion.indexOf("Mac") != -1 && navigator.appVersion.indexOf("Chrome/26") != -1) {
    document.write('<link rel="stylesheet" href="static/css/osxstyle.css" />');
}

document.addEventListener('DOMContentLoaded', function() {
    
    window.tvDB = new tvDB();
    window.faves = new Favorites();
    window.thePirateBay = new ThePirateBay();
    window.GUI = new Gui();
    window.GUI.attachEvents();
    window.faves.show();

});
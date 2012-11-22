document.addEventListener('DOMContentLoaded', function() {
    
    window.tvDB = new tvDB();
    window.faves = new Favorites();
    window.thePirateBay = new ThePirateBay();
    window.GUI = new Gui();
    window.GUI.attachEvents();
    window.faves.show();

});
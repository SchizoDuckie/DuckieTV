/**
 * Loaded after defining the CRUD.entities.
 * Boots up CRUD.js database init procedure to the SQLiteAdapter
 */

CRUD.DEBUG = false;
if (localStorage.getItem('CRUD.DEBUG')) {
    CRUD.DEBUG = (localStorage.getItem('CRUD.DEBUG') === 'true') ? true : false;
};

CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome', {
    estimatedSize: 25 * 1024 * 1024
}));
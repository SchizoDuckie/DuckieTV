/**
 * Loaded after defining the CRUD.entities.
 * Boots up CRUD.js database init procedure.
 * Separated from CRUD.Entities.js so that it can be bypassed by the background page, which
 * loads CRUD.background.bootstrap.js to always use CRUD.SqliteAdapter
 */

CRUD.DEBUG = false;
if (localStorage.getItem('CRUD.DEBUG')) {
    CRUD.DEBUG = (localStorage.getItem('CRUD.DEBUG') === 'true') ? true : false;
};

/**
 * If we detect a background page connection possible, use the background adapter.
 * for other environments, run in the foreground
 */
if (('chrome' in window) && ('runtime' in chrome) && ('connect' in chrome.runtime) && ('getBackgroundPage' in chrome.runtime)) {
    var conn = new CRUD.BackgroundPageAdapter();
    conn.Init();
    CRUD.setAdapter(conn);
} else {
    CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome', {
        estimatedSize: 25 * 1024 * 1024
    }));
}
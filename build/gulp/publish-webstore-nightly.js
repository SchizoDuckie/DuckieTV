var gulp = require('gulp'),
    fs = require('fs'),
    spawn = require('child_process').spawn;

/**
 * Create a nightly build and immediately deploy it to the webstore
 */
gulp.task('nightly', function() {

    if (!process.env.USERNAME || !process.env.PWD) {
        console.log("No USERNAME and/or PWD environment variables defined for chrome webstore deployment! Not launching upload task");
    }

    nightly = true;
    var d = new Date();
    ver = [d.getFullYear() + '' + d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()].join('.');
    spawn("java", ["-Dwebdriver.chrome.driver=..\\chromedriver.exe", ' -jar ..\\selenium-server-standalone-2.43.1.jar'], {
        cwd: process.cwd()
    });
    gulp.start('deploy').start('publish-webstore-nightly');
});

/**
 * Upload to webstore through chrome web driver
 */
gulp.task('publish-webstore-nightly', function() {

    var changelog = fs.readFileSync('./README.md').toString();
    var start = changelog.indexOf('Changelog: \r\n==========');
    changelog = changelog.substring(start + 26).split('*')[0];

    var webdriverjs = require('webdriverio'),
        client = webdriverjs.remote({
            desiredCapabilities: {
                browserName: 'chrome',
            },
            logLevel: 'error'
        }).init();

    // i fucking love this
    client
        .url('https://chrome.google.com/webstore/developer/dashboard?hl=en&gl=NL') // login
    .waitFor('#Email')
        .setValue('#Email', process.env.USERNAME)
        .setValue('#Passwd', process.env.PWD || '');
    if (process.env.PWD) {
        client.click('#signIn'); // auto sign in if env user and pass provided
    }
    client.waitFor('form#cx-dash-form', 30000) // wait for redirect to dashboard
    .url('https://chrome.google.com/webstore/developer/edit/gelgiagalkgliccemepngfeahpmihnjp?hl=en&gl=NL') // new tab mode canary version
    .click('.cx-title input[type=button]') // hit upload new version
    .waitFor('#browse-btn') // wait for page to load
    .chooseFile('input[type=file]', '../deploy/newtab-nightly.zip') // select nightly
    .click('#upload-btn') // hit upload
    .waitFor('.id-publish', 30000) // wait for the redirect
    .execute(function(c) { // adjust the changelog to include last update from readme
        var el = document.querySelector('#cx-dev-edit-desc');
        var value = el.value.split("Changelog:");
        el.value = value[0] + "Changelog:\r\n* " + c.toString().trim() + "\r\n" + value[1].trim();
    }, [changelog])
        .click('.id-publish'); // hit the publish button
    //.end(); // close the browser
});
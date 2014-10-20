@echo off
echo DuckieTV Selenium launcher
echo get selenium server from http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.1.jar
echo and chromedriver from http://chromedriver.storage.googleapis.com/2.11/chromedriver_win32.zip
echo place both in the directory above DuckieTV 
java -Dwebdriver.chrome.driver=..\chromedriver.exe -jar ../selenium-server-standalone-2.43.1.jar 
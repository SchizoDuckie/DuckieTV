OPEN WEBSITE : https://chrome.google.com/webstore/developer/edit/cdfkaloficjmdjbgmckaddgfcghgidei?hl=en&gl=NL
WAIT FOR PROCESS : chrome : appear : 0 : 0
DELAY : 500
IF WINDOW EXISTS : Sign in - Google Accounts - Google Chrome : 0
MESSAGE BOX : Please select google account and sign in
DELAY : 500
WAIT FOR : Chrome Web Store - Google Chrome : appear : 0 : 0
WAIT FOR USER : 0 : 0 : 0 : 0
ENDIF
WAIT FOR : DuckieTV - 'Browser action' mode - Edit Item - Google Chrome : appear : 0 : 0
Keyboard : Tab : KeyPress
DELAY : 20
Keyboard : Tab : KeyPress
DELAY : 20
Keyboard : Tab : KeyPress
DELAY : 20
Keyboard : Tab : KeyPress
DELAY : 20
Keyboard : Space : KeyPress
WAIT FOR : Upload - Developer Dashboard - Google Chrome : appear : 0 : 0
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Space : KeyDown
DELAY : 84
Keyboard : Space : KeyUp
WAIT FOR : Open : appear : 0 : 0
TYPE TEXT : c:\xampp\htdocs\deploy\browseraction-latest.zip
Keyboard : Enter : KeyDown
DELAY : 83
Keyboard : Enter : KeyUp
WAIT FOR : Open : disappear : 0 : 0
Keyboard : Tab : KeyDown
DELAY : 69
Keyboard : Tab : KeyUp
DELAY : 712
Keyboard : Space : KeyDown
DELAY : 100
Keyboard : Space : KeyUp
WAIT FOR : DuckieTV - 'Browser action' mode - Edit Item - Google Chrome : appear : 0 : 0
OPEN WEBSITE : http://localhost/duckietv/changelog.php
WAIT FOR : Changelog : appear : 0 : 0
DELAY : 2000
Keyboard : ControlLeft : KeyDown
Keyboard : A : KeyPress
Keyboard : C : KeyPress
DELAY : 500
Keyboard : F4 : KeyPress
Keyboard : ControlLeft : KeyUp
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : Tab : KeyPress
Keyboard : ControlLeft : KeyDown
Keyboard : F : KeyPress
Keyboard : ControlLeft : KeyUp
TYPE TEXT : Changelog:
Keyboard : Escape : KeyPress
Keyboard : End : KeyPress
Keyboard : Down : KeyPress
Keyboard : Enter : KeyPress
PASTE

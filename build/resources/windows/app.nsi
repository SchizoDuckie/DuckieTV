;;; Define your application name
!define APPNAME "NWJS_APP_REPLACE_APPNAME"
!define APPNAMEANDVERSION "${APPNAME} NWJS_APP_REPLACE_VERSION"

;;; Main Install settings
Name "${APPNAMEANDVERSION}"
InstallDir "$APPDATA\${APPNAME}"
InstallDirRegKey HKLM "Software\${APPNAME}" ""
OutFile "NWJS_APP_REPLACE_EXE_NAME"

;;; Modern interface settings
!include "MUI.nsh"
!define MUI_ICON "NWJS_APP_REPLACE_INC_FILE_ICO"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APPNAME}.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "NWJS_APP_REPLACE_LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;;; Set languages (first is default language)
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_RESERVEFILE_LANGDLL

Section "${APPNAME}" Section1

	;;; Set Section properties
	SetOverwrite on

	;;; Set Section Files and Shortcuts
	SetOutPath "$INSTDIR\"
	File "NWJS_APP_REPLACE_INC_FILE_1"
	File "NWJS_APP_REPLACE_INC_FILE_2"
	File "NWJS_APP_REPLACE_INC_FILE_3"
	File "NWJS_APP_REPLACE_INC_FILE_4"
	File "NWJS_APP_REPLACE_INC_FILE_5"
	File "NWJS_APP_REPLACE_INC_FILE_6"
	File "NWJS_APP_REPLACE_INC_FILE_ICO"

	CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" $INSTDIR\NWJS_APP_REPLACE_ICO_FILE_NAME" 0
	CreateDirectory "$SMPROGRAMS\${APPNAME}"
	CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" $INSTDIR\NWJS_APP_REPLACE_ICO_FILE_NAME" 0
	CreateShortCut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" $INSTDIR\NWJS_APP_REPLACE_ICO_FILE_NAME" 0

SectionEnd

Section -FinishSection

	WriteRegStr HKLM "Software\${APPNAME}" "" "$INSTDIR"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$INSTDIR\uninstall.exe"
	WriteUninstaller "$INSTDIR\uninstall.exe"

SectionEnd

;;; Modern install component descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${Section1} ""
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;;; Uninstall section
Section Uninstall

	;;; Remove from registry...
	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
	DeleteRegKey HKLM "SOFTWARE\${APPNAME}"

	;;; Delete self
	Delete "$INSTDIR\uninstall.exe"

	;;; Delete Shortcuts
	Delete "$DESKTOP\${APPNAME}.lnk"
	Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
	Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"

	;;; Clean up ${APPNAME}
	RMDir /r /REBOOTOK $INSTDIR
	RMDir "$SMPROGRAMS\${APPNAME}"

SectionEnd

BrandingText "NWJS_APP_REPLACE_DESCRIPTION"

;;; eof
#!/bin/bash

#./build/nwjs-build.sh --src=/var/www/deploy/browseraction --output-dir=/var/www/deploy/binaries --name=DuckieTV --win-icon=/var/www/DuckieTV/img/favicon.ico --osx-icon=/var/www/DuckieTV/build/duckietv.icns --CFBundleIdentifier=tv.duckie --target="3" --version="1.1.2" --libudev --nw=0.12.2 --build
APPNAME="DuckieTV"
VERSION="1.1.2"
BASE_DIR="/var/www/deploy/browseraction/"
BUILD_DIR="/var/www/deploy/binaries/win"
OUTPUT_DIR="/var/www/deploy/binaries"
ICON="/var/www/DuckieTV/img/favicon-inverted.ico"
DATE=$(date +"%Y%m%d")
PLATFORM_INDICATOR="win-ia32"

rm -rf /var/www/deploy/TMP/win-ia32/
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

./nwjs-build.sh --src=$BASE_DIR --output-dir=$OUTPUT_DIR --name=$APPNAME --win-icon=$ICON --target="2" --version=$VERSION --libudev --nw=0.12.2 --build


cat <<EOF > $BUILD_DIR/$APPNAME.nsi
;;; Define your application name
!define APPNAME "${APPNAME}"
!define APPNAMEANDVERSION "${APPNAME} ${VERSION}"

;;; Main Install settings
Name "\${APPNAMEANDVERSION}"
InstallDir "\$APPDATA\\${APPNAME}"
InstallDirRegKey HKLM "Software\\${APPNAME}" ""
OutFile "${BUILD_DIR}/${APPNAME}-${VERSION}-setup.exe"

;;; Modern interface settings
!include "MUI.nsh"
!define MUI_ICON "${ICON}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "\$INSTDIR\DuckieTV.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;;; Set languages (first is default language)
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_RESERVEFILE_LANGDLL

Section "DuckieTV" Section1

	;;; Set Section properties
	SetOverwrite on

	;;; Set Section Files and Shortcuts
	SetOutPath "\$INSTDIR\"
	File "d3dcompiler_47.dll"
	File "libGLESv2.dll"
	File "pdf.dll"
	File "DuckieTV.nsi"
	File "nw.pak"
	File "libEGL.dll"
	File "ffmpegsumo.dll"
	File "icudtl.dat"
	File "DuckieTV.exe"

	CreateShortCut "\\$DESKTOP\DuckieTV.lnk" "\$INSTDIR\DuckieTV.exe"
	CreateDirectory "\$SMPROGRAMS\DuckieTV"
	CreateShortCut "\$SMPROGRAMS\DuckieTV\DuckieTV.lnk" "\$INSTDIR\DuckieTV.exe"
	CreateShortCut "\$SMPROGRAMS\DuckieTV\Uninstall.lnk" "\$INSTDIR\uninstall.exe"

SectionEnd

Section -FinishSection

	WriteRegStr HKLM "Software\\${APPNAME}" "" "\$INSTDIR"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "\$INSTDIR\uninstall.exe"
	WriteUninstaller "\$INSTDIR\uninstall.exe"

SectionEnd

;;; Modern install component descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT \${Section1} ""
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;;; Uninstall section
Section Uninstall

	;;; Remove from registry...
	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\\${APPNAME}"
	DeleteRegKey HKLM "SOFTWARE\\${APPNAME}"

	;;; Delete self
	Delete "\$INSTDIR\uninstall.exe"

	;;; Delete Shortcuts
	Delete "\$DESKTOP\\${APPNAME}.lnk"
	Delete "\$SMPROGRAMS\\${APPNAME}\\${APPNAME}.lnk"
	Delete "\$SMPROGRAMS\\${APPNAME}\Uninstall.lnk"

	;;; Clean up DuckieTV
	Delete "\$INSTDIR\d3dcompiler_47.dll"
	Delete "\$INSTDIR\libGLESv2.dll"
	Delete "\$INSTDIR\pdf.dll"
	Delete "\$INSTDIR\DuckieTV.nsi"
	Delete "\$INSTDIR\nw.pak"
	Delete "\$INSTDIR\libEGL.dll"
	Delete "\$INSTDIR\ffmpegsumo.dll"
	Delete "\$INSTDIR\icudtl.dat"
	Delete "\$INSTDIR\DuckieTV.exe"
	RMDir "\$INSTDIR\locales"

	;;; Remove remaining directories
	RMDir "\$SMPROGRAMS\\${APPNAME}"
	RMDir "\$INSTDIR\"

SectionEnd

BrandingText "The TV Show Tracker You've been waiting for"

EOF

cd $BUILD_DIR
#cp "${OUTPUT_DIR}/${APPNAME}-${DATE}-${PLATFORM_INDICATOR}.zip" .
unzip "${OUTPUT_DIR}/${APPNAME}-${DATE}-${PLATFORM_INDICATOR}.zip"
makensis "${APPNAME}.nsi"

zip -qq -m "${OUTPUT_DIR}/${APPNAME}-${VERSION}-windows-x32.zip" "${APPNAME}-${VERSION}-setup.exe";
#cd $OUTPUT_DIR
#rm -rf $BUILD_DIR

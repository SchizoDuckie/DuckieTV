#!/usr/bin/env bash
######################################################################
# nwjs shell build script                                            #
######################################################################
# For usage see: ./nwjs-build.sh --help                              #
######################################################################

SCRIPT_VER='1.0.4'

# Current working directory
WORKING_DIR="$(cd -P -- "$(dirname -- "$0")" && pwd -P)";

#determine if winresourcer is available (for embedding custom .ico in windows executable using Wine)
if ! command -v winresourcer >/dev/null 2>&1; then
    WINRESOURCER_AVAILABLE=false
else
    WINRESOURCER_AVAILABLE=true
fi

# LOCAL mode is usefull when:
#   * You're testing the script and you don't want to download NW archives every time
#   * You have the archives localy
# default is "FALSE"
LOCAL_NW_ARCHIVES_MODE=false
LOCAL_NW_ARCHIVES_PATH="${WORKING_DIR}/nwjs_download_cache"

# Default nwjs version
NW_VERSION='0.12.2';

# Base domain for nwjs download server
DL_URL="http://dl.nwjs.io"

# Temporary directory where all happens (relative to current directory where this script running from)
# This directory will be auto created
TMP="/var/www/deploy/TMP"

# Sorces directory path
PKG_SRC="/var/www/deploy/browseraction"

# Build target(s)
# 0 - linux-ia32
# 1 - linux-x64
# 2 - win-ia32
# 3 - win-x64
# 4 - osx-ia32
# 5 - osx-x64
TARGET="0 1 2 3 4 5"

# Final output directory (relative to current directory where this script running from)
RELEASE_DIR="/var/www/deploy/"

# Icons and other resources
OSX_RESOURCE_ICNS="../build/resources/osx/gisto.icns"
WIN_RESOURCE_ICO="../../app/icon.ico"

# Date on the package archive as PkgName-YYYYMMDD-OS-architecture.zip
DATE=$(date +"%Y%m%d")

# Name of your package
PKG_NAME="${USER}app"

# Package version
PKG_VERSION="1.0.0"

CFBundleIdentifier="com.${PKG_NAME}"

# Handle libudev on linux
LIBUDEV_HANDLER=false

# --------------------------------------------------------------------
# Guess you should not need to edit bellow this comment block
# Unless you really want/need to
# --------------------------------------------------------------------

ARR_OS[0]="linux-ia32"
ARR_OS[1]="linux-x64"
ARR_OS[2]="win-ia32"
ARR_OS[3]="win-x64"
ARR_OS[4]="osx-ia32"
ARR_OS[5]="osx-x64"

ARR_DL_EXT[0]="tar.gz"
ARR_DL_EXT[1]="tar.gz"
ARR_DL_EXT[2]="zip"
ARR_DL_EXT[3]="zip"
ARR_DL_EXT[4]="zip"
ARR_DL_EXT[5]="zip"

ARR_EXTRACT_COMMAND[0]="tar"
ARR_EXTRACT_COMMAND[1]="tar"
ARR_EXTRACT_COMMAND[2]="zip"
ARR_EXTRACT_COMMAND[3]="zip"
ARR_EXTRACT_COMMAND[4]="zip"
ARR_EXTRACT_COMMAND[5]="zip"

TXT_BOLD="\e[1m"
TXT_NORMAL="\e[1m"
TXT_RED="\e[31m"
TXT_BLUE="\e[34m"
TXT_GREEN="\e[32m"
TXT_YELLO="\e[93m"
TXT_RESET="\e[0m"
TXT_NOTE="\e[30;48;5;82m"

usage() {
cat <<EOF
NAME

    nwjs shell builder

SYNOPSIS

    nwjs-build.sh [-h|--help]
                  [--name=NAME] [--target="0 1 2 4 5"] [--version="X.X.X"]
                  [--output-dir=/FULL/PATH] [--src=/PATH/TO/DIR]
                  [--win-icon=/FULL/PATH]
                  [--CFBundleIdentifier=com.bundle.name] [--osx-icon=/FULL/PATH]
                  [--libudev]
                  [--nw=VERSION]
                  [--clean] [--build]

DESCRIPTION

    nwjs shell script builder for nwjs applications.
    This script can be easily integrated into your build process.
    It will download nwjs 32/64bit for Linux, Windows and OSX
    and build for all 3 platforms from given source directory

    Options can be set from within the script or via command line switches

OPTIONS

    -h, --help

            Show help and usage (You are looking at it)

    --version=PAKAGE_VERSION

            Set package version (defaults to ${PKG_VERSION})

    --name=NAME

            Set package name (defaults to ${PKG_NAME})

    --src=/PATH/TO/DIR

            Set path to source dir

    --target="2 3"

            Build for particular OS or all (defaults to ${TARGET})
            Available target:
                0 - linux-ia32
                1 - linux-x64
                2 - win-ia32
                3 - win-x64
                4 - osx-ia32
                5 - osx-x64

    --nw=VERSION

            Set nwjs version to use (defaults to ${NW_VERSION})

    --output-dir=/PATH/TO/DIR

            Change output directory (if not set - will output to "${RELEASE_DIR}")

    --win-icon=/PATH/TO/FILE

            (For Windows target only) Path to .ico file (if not set - default will be used)

    --osx-icon=/PATH/TO/FILE

            (For OSX target only) Path to .icns file (if not set - default will be used)

    --CFBundleIdentifier=com.bundle.name

            (For OSX target only) Name of the bundle’s Identifier, if not set - default will be used

    --libudev

            (For Linux target only) Use if you want the script to hanle the lack of libudev (linux targets)
            As mentioned here:
                https://github.com/nwjs/nw.js/wiki/The-solution-of-lacking-libudev.so.0

    --build

            Start the build process (IMPORTANT! Must be the last parameter of the command)

    --clean

            Clean and remove ${TMP} directory

EXAMPLES

    THE BARE MINIMUM TO BUILD:

        SHELL> ./nwjs-build.sh \\
                --src=${HOME}/projects/${PKG_NAME}/src \\
                --build

    BUILD FOR ALL TARGETS:

        SHELL> ./nwjs-build.sh \\
                --src=${HOME}/projects/${PKG_NAME}/src \\
                --output-dir=${HOME}/${PKG_NAME} \\
                --name=${PKG_NAME} \\
                --win-icon=${HOME}/projects/resorses/icon.ico \\
                --osx-icon=${HOME}/projects/resorses/icon.icns \\
                --CFBundleExecutable=com.bundle.name \\
                --target="0 1 2 3 4 5" \\
                --version="1.0.0" \\
                --libudev \\
                --nw=0.11.6 \\
                --build

    BUILD ONLY FOR WINDOWS 64 AND 32 BIT TARGETS:

        SHELL> ./nwjs-build.sh \\
                --src=${HOME}/projects/${PKG_NAME}/src \\
                --output-dir=${HOME}/${PKG_NAME} \\
                --name=${PKG_NAME} \\
                --win-icon=${HOME}/projects/resorses/icon.ico \\
                --target="2 3" \\
                --version="1.0.0" \\
                --build

    BUILD ONLY FOR OSX 32 BIT TARGET:

        SHELL> ./nwjs-build.sh \\
                --src=${HOME}/projects/${PKG_NAME}/src \\
                --output-dir=${HOME}/${PKG_NAME} \\
                --name=${PKG_NAME} \\
                --osx-icon=${HOME}/projects/resorses/icon.icns \\
                --target="4" \\
                --version="1.0.0" \\
                --build

    BUILD ONLY FOR ALL 64 BIT

        SHELL> ./nwjs-build.sh \\
                --src=${HOME}/projects/${PKG_NAME}/src \\
                --output-dir=${HOME}/${PKG_NAME} \\
                --name=${PKG_NAME} \\
                --osx-icon=${HOME}/projects/resorses/icon.icns \\
                --win-icon=${HOME}/projects/resorses/icon.ico \\
                --target="1 3 5 " \\
                --version="1.0.0" \\
                --libudev \\
                --build

LICENSE

    MIT

$(cat ${WORKING_DIR}/LICENSE)

EOF
}

NOTE () {
    printf "\n";
    printf "${TXT_NOTE} ${1} ${TXT_RESET} "
    printf "\n";
}

upper_case_word() {
    word=${1}
    therest=$(tr '[a-z]' '[A-Z]'<<<"${word:0:1}")
    echo "${therest}${word:1}"
}

clean() {
    rm -rf ${TMP};
    NOTE "Removed \"${TMP}\" directory and it's content";
}

extractme() {
    if [[ ${1} = "zip" ]]; then
        unzip -qq ${2} -d ${3};
    else
        tar xzf ${2} -C ${3};
    fi
}

split_string() {
	#USAGE: `split_string $string ,` - the comma here is the separator. Also see `man cut`
	echo "$1" | cut -d"$2" -f1;
}

make_bins() {
    mkdir -p ${RELEASE_DIR}
    local make_os=`split_string "${1}" "-"`;
    if [[ ${make_os} = "linux" ]]; then
        mk_linux ${1};
    elif [[ ${make_os} = "win" ]]; then
        mk_windows ${1};
    elif [[ ${make_os} = "osx" ]]; then
        mk_osx ${1};
    else
        printf "\nNo such target\n";
        exit 1;
    fi
}

mk_linux() {
cat ${TMP}/${ARR_OS[$i]}/nwjs/nw ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw > ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}
        rm ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw
        chmod +x ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}
        cp ${TMP}/${ARR_OS[$i]}/nwjs/{icudtl.dat,nw.pak} ${TMP}/${ARR_OS[$i]}/latest-git/
        cd ${TMP}/${1}/latest-git

        if [[ ${LIBUDEV_HANDLER} = "true" ]];then
        #libudev handler here
        mv ${PKG_NAME} ${PKG_NAME}-bin
cat << 'gisto_libudev_helper' >> ./${PKG_NAME}
#!/bin/bash
APP_WRAPPER="`readlink -f "${0}"`"
HERE="`dirname "${APP_WRAPPER}"`"
paths=(
  "/lib/x86_64-linux-gnu/libudev.so.1" # Ubuntu, Xubuntu, Mint
  "/usr/lib64/libudev.so.1" # SUSE, Fedora
  "/usr/lib/libudev.so.1" # Arch, Fedora 32bit
  "/lib/i386-linux-gnu/libudev.so.1" # Ubuntu 32bit
)

for i in "${paths[@]}"
do
  if [ -f ${i} ]
  then
    mkdir ${HERE}/lib
    ln -sf "$i" ${HERE}/lib/libudev.so.0
    break
  fi
done
export LD_LIBRARY_PATH=$([ -n "$LD_LIBRARY_PATH" ] && echo "$HERE:$HERE/lib:$LD_LIBRARY_PATH" || echo "$HERE:$HERE/lib")
exec -a "$0" "${HERE}/PACKAGE_NAME_PLACE_HOLDER-bin" "$@"
gisto_libudev_helper
        replace PACKAGE_NAME_PLACE_HOLDER ${PKG_NAME} -- ${PKG_NAME}
        chmod +x ./${PKG_NAME}
        fi

        zip -qq -r -m ${PKG_NAME}-${DATE}-${1}.zip *;
        mv ${PKG_NAME}-${DATE}-${1}.zip ${RELEASE_DIR};
        cd ${WORKING_DIR};
}

mk_windows() {
    if [[ -f "${WIN_RESOURCE_ICO}" ]];then
        cp ${WIN_RESOURCE_ICO} ${TMP}/${ARR_OS[$i]}/latest-git/
    fi
    # copy nw.exe to target
    cp ${TMP}/${ARR_OS[$i]}/nwjs/nw.exe ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.exe
    if [[ "$WINRESOURCER_AVAILABLE" = "true" ]];then
        # Run winresourcer (requires wine 1.7 and mono)
        winresourcer --operation=Update --exeFile=${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.exe --resourceType=Icongroup --resourceName:IDR_MAINFRAME --lang:1033 --resourceFile:${WIN_RESOURCE_ICO}
        # Remove iconfile
        ICONFILENAME="${WIN_RESOURCE_ICO##*/}"
        # cleanup now redundant icon
        rm ${TMP}/${ARR_OS[$i]}/latest-git/${ICONFILENAME}
    fi
    # append package.nw onto taget
    echo "Appendingpackage to exefile: ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw > ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.exe"
    cat ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw >> ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.exe
    cp ${TMP}/${ARR_OS[$i]}/nwjs/{icudtl.dat,nw.pak,*.dll} ${TMP}/${ARR_OS[$i]}/latest-git/
    rm ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw
    
    cd ${TMP}/${1}/latest-git
    zip -qq -r ${PKG_NAME}-${DATE}-${1}.zip *;
    mv ${PKG_NAME}-${DATE}-${1}.zip ${RELEASE_DIR};
    cd ${WORKING_DIR};
}

mk_osx() {
    cp -r ${TMP}/${ARR_OS[$i]}/nwjs/*.app ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.app;
    cp -r ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.app/Contents/Resources/app.nw;
    rm -r ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw

	# check if it is nwjs or node-webkit
	if [[ -d "${TMP}/${ARR_OS[$i]}/nwjs/nwjs.app" ]]; then
		CFBundleExecutable="nwjs"
	else
		CFBundleExecutable="node-webkit"
	fi

    if [[ -f "${OSX_RESOURCE_ICNS}" ]];then
        cp -r ${OSX_RESOURCE_ICNS} ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.app/Contents/Resources/
    else
        OSX_RESOURCE_ICNS="${TMP}/${ARR_OS[$i]}/nwjs/node-webkit.app/Contents/Resources/nw.icns"
    fi
    rm ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.app/Contents/Info.plist
cat << gisto_plist_helper >> ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.app/Contents/Info.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>$(upper_case_word ${PKG_NAME})</string>
	<key>CFBundleDocumentTypes</key>
	<array/>
	<key>CFBundleExecutable</key>
	<string>${CFBundleExecutable}</string>
	<key>CFBundleIconFile</key>
    <string>$(echo "${OSX_RESOURCE_ICNS}" | rev | cut -d"/" -f1 | rev)</string>
	<key>CFBundleIdentifier</key>
	<string>${CFBundleIdentifier}</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(upper_case_word ${PKG_NAME})</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>${PKG_VERSION}</string>
	<key>CFBundleVersion</key>
	<string>${PKG_VERSION}</string>
	<key>LSFileQuarantineEnabled</key>
	<true/>
	<key>LSMinimumSystemVersion</key>
	<string>10.6.0</string>
	<key>NSPrincipalClass</key>
	<string>NSApplication</string>
	<key>NSSupportsAutomaticGraphicsSwitching</key>
	<true/>
	<key>NSHumanReadableCopyright</key>
    <string>Copyright (c) $(date +"%Y") $(upper_case_word ${PKG_NAME})</string>
	<key>SCMRevision</key>
	<string>175484</string>
	<key>UTExportedTypeDeclarations</key>
	<array/>
</dict>
</plist>
gisto_plist_helper
    cd ${TMP}/${1}/latest-git
    zip -qq -r ${PKG_NAME}-${DATE}-${1}.zip *;
    mv ${PKG_NAME}-${DATE}-${1}.zip ${RELEASE_DIR};
    cd ${WORKING_DIR};
}

build() {
    for i in ${TARGET}; do
        mkdir -p ${TMP}/${ARR_OS[$i]}/latest-git;
        mkdir -p ${LOCAL_NW_ARCHIVES_PATH};
        NOTE 'WORKING';
        printf "Bulding ${TXT_BOLD}${TXT_YELLO}${PKG_NAME}${TXT_RESET} for ${TXT_BOLD}${TXT_YELLO}${ARR_OS[$i]}${TXT_RESET}\n"
        for DL_FILE in ${LOCAL_NW_ARCHIVES_PATH}/*-v${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]}; do
            if [[ -f "${DL_FILE}" || ${LOCAL_NW_ARCHIVES_MODE} = "TRUE" || ${LOCAL_NW_ARCHIVES_MODE} = "true" || ${LOCAL_NW_ARCHIVES_MODE} = "1" ]]; then
                NOTE 'NOTE';
                printf "File ${TXT_YELLO}nwjs-${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]}${TXT_RESET} is in the download cache\n- no need to re-download\n"
                cp ${LOCAL_NW_ARCHIVES_PATH}/*-v${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]} ${TMP};
            else
                wget -O ${LOCAL_NW_ARCHIVES_PATH}/nwjs-v${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]} ${DL_URL}/v${NW_VERSION}/node-webkit-v${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]} || wget -O ${LOCAL_NW_ARCHIVES_PATH}/nwjs-v${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]} ${DL_URL}/v${NW_VERSION}/nwjs-v${NW_VERSION}-${ARR_OS[$i]}.${ARR_DL_EXT[$i]};
            fi
            extractme "${ARR_EXTRACT_COMMAND[$i]}" "${DL_FILE}" "${TMP}/${ARR_OS[$i]}";
            mv ${TMP}/${ARR_OS[$i]}/*-v${NW_VERSION}-${ARR_OS[$i]} ${TMP}/${ARR_OS[$i]}/nwjs;

            if [[ `split_string "${ARR_OS[$i]}" "-"` = "osx" ]]; then
                cp -r ${PKG_SRC} ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw;
            else
                cd ${PKG_SRC};
                zip -qq -r ${PKG_NAME}.zip *;
                mv ${PKG_NAME}.zip ${TMP}/${ARR_OS[$i]}/latest-git/${PKG_NAME}.nw;
                cd ${WORKING_DIR};
            fi
            # Build binaries
            make_bins "${ARR_OS[$i]}";
        done
    done
    NOTE "DONE";
    printf "You will find your '${PKG_NAME}' builds in '${RELEASE_DIR}' directory\n";
}

### Arguments
while true; do
  case $1 in
    -h | --help )
        clear > /dev/null;
        usage | less;
        exit 0
        ;;
    --nw=* )
        NW_VERSION="${1#*=}";
        shift
        ;;
    --name=* )
        PKG_NAME="${1#*=}";
        shift
        ;;
    --version=* )
        PKG_VERSION="${1#*=}";
        shift
        ;;
    --output-dir=* )
        RELEASE_DIR="${1#*=}";
        shift
        ;;
    --src=* )
        PKG_SRC="${1#*=}"
        shift
        ;;
    --target=* )
        TARGET="${1#*=}"
        shift
        ;;
    --osx-icon=* )
        OSX_RESOURCE_ICNS="${1#*=}"
        shift
        ;;
    --CFBundleIdentifier=* )
        CFBundleIdentifier="${1#*=}"
        shift
        ;;
    --win-icon=* )
        WIN_RESOURCE_ICO="${1#*=}"
        shift
        ;;
    --clean )
        clean;
        exit 0
        ;;
    --local )
        LOCAL_NW_ARCHIVES_MODE=true
        shift
        ;;
    --libudev )
        LIBUDEV_HANDLER=true
        shift
        ;;
    --build )
        build;
        exit 0
        ;;
    -- )
        shift;
        break
        ;;
    -* )
        printf 'Hmmm, unknown option: "%s".\n' "${1}";
        exit 0
        ;;
    * )
        usage;
        break
        ;;
  esac
done
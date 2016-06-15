#!/usr/bin/env bash

# Exit on error
set -e

BUILD_DIR="/var/www/deploy"
CURRENT_DIR=`pwd`
WORKING_DIR="${BUILD_DIR}/TMP"
RELEASE_DIR="${BUILD_DIR}/binaries"
CONFIG_FILE="${CURRENT_DIR}/config.json"

if [[ "${2}" =~ "--config" ]]; then
    CONFIG_FILE="${2#*=}";
fi

get_value_by_key() {
    JSON_FILE=${CONFIG_FILE}
    KEY=${1}
    REGEX="(?<=\"${KEY}\":.\")[^\"]*"
    JSON_VALUE=$(cat ${JSON_FILE} | grep -Po ${REGEX})
    echo ${JSON_VALUE}
}

# Name of your package
PKG_NAME=$(get_value_by_key name)

if [[ ! -f "${WORKING_DIR}" ]]; then
    mkdir -p ${WORKING_DIR}
fi

architechture="ia32 x64"

usage() {
clear && cat <<EOF

NAME

    NWJS app pack script

DESCRIPTION

    Build installers for Windows, Linux and OSX

DEPENDENCIES

    Zip (all)
    tar (all)
    NSIS (Windows installer)
    ImageMagick (OSX installer)
    cpio (OSX installer)
    libxml2 (OSX installer)

USAGE

    $ ./pack.sh init - generate 'config.json' with interactive CMD

    $ ./pack.sh --windows - to build Windows installers

    $ ./pack.sh --linux - to build Linux installers

    $ ./pack.sh --osx - to build OSX installers

    $ ./pack.sh --all - to build installers for all systems

    $ ./pack.sh --all --config=/path/to/config.json - to build installers for all systems but using 'config.json' located in any other path than in root directory

    $ ./pack.sh --clean - removes the 'TMP' working directory

    $ ./pack.sh --clean all - removes the 'TMP' working directory and 'releases' directory (with all the content)

    Hooks:
    Place hooks in "./hooks/" directory
        - file name 'before.sh' will be executed befor each build
        - file name 'after.sh' will be executed after pack script is finished
        - file name 'after_build.sh' will be executed after each platform build is finished

EOF
}

init_config_file() {
  set -i
  read -e -p "Application name (no spaces): " CONF_NAME;
  read -e -p "Application version: " -i "1.0.0" CONF_VERSION;
  read -e -p "Application description: " -i "${CONF_NAME} v${CONF_VERSION} Application" CONF_DESCRIPTION;
  read -e -p "nwjs version to use: " -i "0.12.3" CONF_NW_VERSION;
  read -e -p "Application src directory path: " CONF_SRC;
  read -e -p "PNG icon path: " CONF_ICON_PNG;
  read -e -p "Windows icon (.ico) path: " CONF_ICON_WIN;
  read -e -p "OSX icon (.icns) path: " CONF_ICON_OSX;
  read -e -p "OSX .pkg background file path" CONF_osxBgPath
  read -e -p "OSX CFBundleIdentifier: " CONF_CFBundleIdentifier;
  read -e -p "License file path: " CONF_LICENSE;

cat << create_conf > config.json
{
  "name": "${CONF_NAME}",
  "description": "${CONF_DESCRIPTION}",
  "version": "${CONF_VERSION}",
  "nwjsVersion": "${CONF_NW_VERSION}",
  "src": "${CONF_SRC}",
  "iconPath": "${CONF_ICON_PNG}",
  "windowsIconPath": "${CONF_ICON_WIN}",
  "osxIconPath": "${CONF_ICON_OSX}",
  "osxBgPath": "${CONF_osxBgPath}",
  "CFBundleIdentifier": "${CONF_CFBundleIdentifier}",
  "license": "${CONF_LICENSE}"
}
create_conf
}

check_dependencies() {
    # Check if NSIS is present
    if [[ "`makensis`" =~ "MakeNSIS" && "`convert`" =~ "Version: ImageMagick" ]]; then
        echo 'OK';
    else
        echo 'NO';
    fi
}

pack_linux () {
    for arch in ${architechture[@]}; do
        cd ${WORKING_DIR}
        cp -r ${CURRENT_DIR}/resources/linux/PKGNAME-VERSION-Linux ${WORKING_DIR}/WORK_DIR/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}
        PKG_MK_DIR=${BUILD_DIR}/TMP/WORK_DIR/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}
        mv ${PKG_MK_DIR}/PKGNAME ${PKG_MK_DIR}/$(get_value_by_key name)
        mv ${PKG_MK_DIR}/$(get_value_by_key name)/PKGNAME ${PKG_MK_DIR}/$(get_value_by_key name)/$(get_value_by_key name)
        # replaces
        chmod a+rw \
            ${PKG_MK_DIR}/README \
            ${PKG_MK_DIR}/share/applications/$(get_value_by_key name).desktop \
            ${PKG_MK_DIR}/share/menu/$(get_value_by_key name); 
        replace -v \
            PKGNAME "$(get_value_by_key name)" \
            PKGDESCRIPTION "$(get_value_by_key description)" \
            PKGVERSION $(get_value_by_key version) \
            -- ${PKG_MK_DIR}/setup \
            ${PKG_MK_DIR}/README \
            ${PKG_MK_DIR}/share/applications/$(get_value_by_key name).desktop \
            ${PKG_MK_DIR}/share/menu/$(get_value_by_key name); 
        # app file
        cp ${BUILD_DIR}/TMP/WORK_DIR/linux-${arch}/latest-git/* ${PKG_MK_DIR}/$(get_value_by_key name)/
        # make the tar
        echo "tar -C ${BUILD_DIR}/TMP/WORK_DIR/ -czf $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}.tar.gz $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}"
        tar -C ${BUILD_DIR}/TMP/WORK_DIR/ -czf $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}.tar.gz $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}
        mv ${WORKING_DIR}/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}.tar.gz ${RELEASE_DIR}
        printf "\nDone Linux ${arch}\n"
    done;
}

pack_osx () {
    for arch in ${architechture[@]}; do
        cd ${WORKING_DIR}
        if [[ ! -d "${WORKING_DIR}/bomutils" ]]; then
            git clone https://github.com/hogliux/bomutils && cd bomutils && make && cd ${WORKING_DIR}
        fi
        if [[ ! -d "${WORKING_DIR}/xar-1.5.2" ]]; then
            wget https://xar.googlecode.com/files/xar-1.5.2.tar.gz && tar -zxvf ./xar-1.5.2.tar.gz && cd xar-1.5.2 && ./configure && make && cd ${WORKING_DIR}
        fi

        mkdir -p ${WORKING_DIR}/build_osx/flat/base.pkg
        mkdir -p ${WORKING_DIR}/build_osx/flat/Resources/en.lproj
        mkdir -p ${WORKING_DIR}/build_osx/root/Applications
        cp -R "${WORKING_DIR}/WORK_DIR/osx-${arch}/latest-git/$(get_value_by_key name).app" ${WORKING_DIR}/build_osx/root/Applications/
	( cd ${WORKING_DIR}/build_osx/root/Applications && chmod -R a+xr $(get_value_by_key name).app )
        local COUNT_FILES=$(find ${WORKING_DIR}/build_osx/root | wc -l)
        local INSTALL_KB_SIZE=$(du -k -s ${WORKING_DIR}/build_osx/root | awk '{print $1}')
	( cd ${WORKING_DIR}/build_osx/root && find . | cpio -o --format odc --owner 0:80 | gzip -c ) > ${WORKING_DIR}/build_osx/flat/base.pkg/Payload

cat << osx_packageinfo_helper > ${WORKING_DIR}/build_osx/flat/base.pkg/PackageInfo
<?xml version="1.0" encoding="utf-8" standalone="no"?>
<pkg-info overwrite-permissions="true" relocatable="false" identifier="$(get_value_by_key CFBundleIdentifier).base.pkg" postinstall-action="none" version="$(get_value_by_key version)" format-version="2" generator-version="InstallCmds-502 (14B25)" auth="root">
    <payload installKBytes="${INSTALL_KB_SIZE}" numberOfFiles="${COUNT_FILES}"/>
    <bundle-version>
        <bundle id="$(get_value_by_key CFBundleIdentifier)" CFBundleIdentifier="$(get_value_by_key CFBundleIdentifier)" path="./Applications/$(get_value_by_key name).app" CFBundleVersion="1.3.0"/>
    </bundle-version>
    <update-bundle/>
    <atomic-update-bundle/>
    <strict-identifier/>
    <scripts/>
</pkg-info>
osx_packageinfo_helper

local BG=$(get_value_by_key osxBgPath)
if [[ -f ${BG} ]];then
    cp "${BG}" "${WORKING_DIR}/build_osx/flat/Resources/en.lproj/background"
    local BG_NODE='<background file="background" alignment="bottomleft" scaling="none"/>'
fi

cat << osx_distribution_helper > ${WORKING_DIR}/build_osx/flat/Distribution
<?xml version="1.0" encoding="utf-8"?>
<installer-script minSpecVersion="1.000000" authoringTool="com.apple.PackageMaker" authoringToolVersion="3.0.3" authoringToolBuild="174">
    <title>${PKG_NAME} $(get_value_by_key version)</title>
    <options customize="never" allow-external-scripts="no"/>
    ${BG_NODE}
    <domains enable_anywhere="false"/>
    <installation-check script="pm_install_check();"/>
    <script>function pm_install_check() {
      if(!(system.compareVersions(system.version.ProductVersion,'10.5') >= 0)) {
        my.result.title = 'Failure';
        my.result.message = 'You need at least Mac OS X 10.5 to install ${PKG_NAME}.';
        my.result.type = 'Fatal';
        return false;
      }
      return true;
    }
    </script>
    <choices-outline>
        <line choice="choice1"/>
    </choices-outline>
    <choice id="choice1" title="base">
        <pkg-ref id="$(get_value_by_key CFBundleIdentifier).base.pkg"/>
    </choice>
    <pkg-ref id="$(get_value_by_key CFBundleIdentifier).base.pkg" installKBytes="${INSTALL_KB_SIZE}" version="$(get_value_by_key version)" auth="Root">#base.pkg</pkg-ref>
</installer-script>
osx_distribution_helper

    ${WORKING_DIR}/bomutils/build/bin/mkbom -u 0 -g 80 ${WORKING_DIR}/build_osx/root ${WORKING_DIR}/build_osx/flat/base.pkg/Bom
    ( cd ${WORKING_DIR}/build_osx/flat/ && ${WORKING_DIR}/xar-1.5.2/src/xar --compression none -cf "${RELEASE_DIR}/${PKG_NAME}-$(get_value_by_key version)-OSX-${arch}.pkg" * )
    printf "\nDone OSX ${arch}\n"
    done;
}

pack_windows() {
    for arch in ${architechture[@]}; do
        cd ${WORKING_DIR}
        cp -r ${CURRENT_DIR}/resources/windows/app.nsi ${WORKING_DIR}
        cp -r $(get_value_by_key windowsIconPath) ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/
        # Replce paths and vars in nsi script
        replace \
            NWJS_APP_REPLACE_APPNAME "$(get_value_by_key name)" \
            NWJS_APP_REPLACE_DESCRIPTION "$(get_value_by_key description)" \
            NWJS_APP_REPLACE_LICENSE $(get_value_by_key license) \
            NWJS_APP_REPLACE_VERSION $(get_value_by_key version) \
            NWJS_APP_REPLACE_EXE_NAME $(get_value_by_key name)-$(get_value_by_key version)-Windows-${arch}.exe \
            NWJS_APP_REPLACE_INC_FILE_1 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/$(get_value_by_key name).exe \
            NWJS_APP_REPLACE_INC_FILE_2 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/icudtl.dat \
            NWJS_APP_REPLACE_INC_FILE_3 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/libEGL.dll \
            NWJS_APP_REPLACE_INC_FILE_4 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/libGLESv2.dll \
            NWJS_APP_REPLACE_INC_FILE_5 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/nw.pak \
            NWJS_APP_REPLACE_INC_FILE_6 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/d3dcompiler_47.dll \
            NWJS_APP_REPLACE_ICO_FILE_NAME $(basename $(get_value_by_key windowsIconPath)) \
            NWJS_APP_REPLACE_INC_FILE_ICO $(get_value_by_key windowsIconPath) -- app.nsi;
        makensis app.nsi
        # Clean a bit
        rm -rf ${WORKING_DIR}/$(get_value_by_key name).nsi;
        mv ${WORKING_DIR}/$(get_value_by_key name)-$(get_value_by_key version)-Windows-${arch}.exe ${RELEASE_DIR}
        printf "\nDone Windows ${arch}\n"
    done
}

build() {
    if [[ `check_dependencies` = "NO" ]]; then
        printf "\nNOTE! NSIS or ImageMagick is missing in the system\n\n";
        exit 1;
    fi
    if [[ ! -d "${RELEASE_DIR}" ]]; then
        mkdir ${RELEASE_DIR}
    fi
    cd ${WORKING_DIR}
    ${CURRENT_DIR}/nwjs-build.sh \
        --src=$(get_value_by_key src) \
        --name=$(get_value_by_key name) \
        --nw=$(get_value_by_key nwjsVersion) \
        --win-icon=$(get_value_by_key windowsIconPath) \
        --osx-icon=$(get_value_by_key osxIconPath) \
        --CFBundleIdentifier=$(get_value_by_key CFBundleIdentifier) \
        --target="${1}" \
        --version=$(get_value_by_key version) \
        --libudev \
        --build
}

# Execute hooks
hook() {
    printf "\nNOTE! \"${1}\" hook executed\n\n";
    case "$1" in
        before)
            ${CURRENT_DIR}/hooks/before.sh
            ;;
        after)
            ${CURRENT_DIR}/hooks/after.sh
            ;;
        after_build)
            ${CURRENT_DIR}/hooks/after_build.sh
            ;;
    esac
}

clean() {
    if [[ ${1} = "all" ]];then
        rm -rf ${RELEASE_DIR}; mkdir ${RELEASE-DIR}; printf "\nCleaned ${RELEASE_DIR}\n\n";
    fi
    rm -rf ${WORKING_DIR}; mkdir ${WORKING_DIR}; printf "\nCleaned ${WORKING_DIR}\n\n"; 
}

# TODO maybe deal with cmd switches or leave it all in the config.json file

if [[ ${1} = "--help" || ${1} = "-h" ]]; then
    usage;
elif [[ ${1} = "init" ]]; then
    init_config_file;
elif [[ ${1} = "--clean" ]]; then
    clean ${2};
elif [[ ${1} = "--linux" ]]; then
    clean;
    hook "before";
    build "0 1";
    hook "after_build";
    pack_linux;
    hook "after";
elif [[ ${1} = "--osx" ]]; then
    clean;
    hook "before";
    build "4 5";
    hook "after_build";
    pack_osx;
    hook "after";
elif [[ ${1} = "--windows" ]]; then
    clean;
    hook "before";
    build "2 3";
    hook "after_build";
    pack_windows;
    hook "after";
elif [[ ${1} = "--all" ]]; then
    clean;
    hook "before";
    build "0 1 2 3 4 5";
    hook "after_build";
    pack_osx;
    pack_linux;
    pack_windows;
    hook "after";
else
    usage;
fi

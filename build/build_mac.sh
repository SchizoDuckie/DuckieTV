#!/bin/bash

./nwjs-build.sh --src=/var/www/deploy/browseraction --output-dir=/var/www/deploy/binaries --name=DuckieTV --win-icon=/var/www/DuckieTV/img/favicon.ico --osx-icon=/var/www/DuckieTV/build/duckietv.icns --CFBundleIdentifier=tv.duckie --target="4" --version="1.1.2" --libudev --nw=0.12.2 --build


BUILD_DIR="/var/www/deploy/TMP/osx-ia32/latest-git"
BASE_DIR="/var/www/deploy/osx" 
VERSION="1.1.2"
IDENTIFIER="tv.duckie"
APPNAME="DuckieTV"
BACKGROUND="/var/www/DuckieTV/img/duckietv.png"

rm -rf "$BASE_DIR/darwin"
mkdir -p "$BASE_DIR/darwin/flat/Resources/en.lproj"
mkdir -p "$BASE_DIR/darwin/flat/base.pkg/"
mkdir -p "$BASE_DIR/darwin/root/Applications"
cp -R $BUILD_DIR/*.* $BASE_DIR/darwin/root/Applications
cp $BACKGROUND $BASE_DIR/darwin/flat/Resources/en.lproj/background
NUM_FILES=$(find ${BASE_DIR}/darwin/root | wc -l)
INSTALL_KB_SIZE=$(du -k -s ${BASE_DIR}/darwin/root | awk '{print $1}')

cat <<EOF > ${BASE_DIR}/darwin/flat/base.pkg/PackageInfo
<?xml version="1.0" encoding="utf-8" standalone="no"?>
<pkg-info overwrite-permissions="true" relocatable="false" identifier="${IDENTIFIER}" postinstall-action="none" version="${VERSION}" format-version="2" generator-version="InstallCmds-502 (14B25)" auth="root">
    <payload numberOfFiles="${NUM_FILES}" installKBytes="${INSTALL_KB_SIZE}"/>
    <bundle-version>
        <bundle id="${IDENTIFIER}" CFBundleIdentifier="${IDENTIFIER}" path="./Applications/DuckieTV.app" CFBundleVersion="1.3.0"/>
    </bundle-version>
    <update-bundle/>
    <atomic-update-bundle/>
    <strict-identifier/>
    <relocate/>
    <scripts/>
</pkg-info>
EOF

cat <<EOF > ${BASE_DIR}/darwin/flat/Distribution
<?xml version="1.0" encoding="utf-8"?>
<installer-script minSpecVersion="1.000000" authoringTool="com.apple.PackageMaker" authoringToolVersion="3.0.3" authoringToolBuild="174">
    <title>${APPNAME} ${VERSION}</title>
    <options customize="never" allow-external-scripts="no"/>
    <background file="background" alignment="bottomleft" scaling="none"/>
    <domains enable_anywhere="true"/>
    <installation-check script="pm_install_check();"/>
    <script>function pm_install_check() {
      if(!(system.compareVersions(system.version.ProductVersion,'10.5') >= 0)) {
        my.result.title = 'Failure';
        my.result.message = 'You need at least Mac OS X 10.5 to install ${APPNAME}.';
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
        <pkg-ref id="${IDENTIFIER}.base.pkg"/>
    </choice>
    <pkg-ref id="${IDENTIFIER}.base.pkg" installKBytes="${INSTALL_KB_SIZE}" version="${VERSION}" auth="Root">#base.pkg</pkg-ref>
</installer-script>
EOF

PKG_LOCATION="/var/www/deploy/osx/${APPNAME}-${VERSION}.pkg"

( cd ${BASE_DIR}/darwin/root && find . | cpio -o --format odc --owner 0:80 | gzip -c ) > ${BASE_DIR}/darwin/flat/base.pkg/Payload
mkbom -u 0 -g 80 ${BASE_DIR}/darwin/root ${BASE_DIR}/darwin/flat/base.pkg/Bom 
( cd ${BASE_DIR}/darwin/flat/ && xar --compression none -cf "${PKG_LOCATION}" * ) 
echo "osx package has been built: ${PKG_LOCATION}"
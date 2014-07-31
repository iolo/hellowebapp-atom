#!/bin/bash

#
# see:
#   http://stackoverflow.com/questions/96882
#   http://github.com/andreyvit/yoursway-create-dmg/
#
# usage:
#   ./scripts/make-dmg.sh <app-name> <volume-name> <output-dmg-file>
#
# ex:
#   ./scripts/make-dmg.sh HellWebApp.app "HelloWebApp Installer" HelloWebApp-1.0.0.dmg
#

ATOM_APP_DIR="build/Atom.app"

APP_NAME="HelloWebApp.app"
VOL_NAME="HelloWebApp Installer"
OUT_DMG="build/HelloWebApp-1.0.0.dmg"

APP_ICNS_FILE="scripts/app.icns"
DMG_ICNS_FILE="scripts/dmg.icns"
DMG_BACKGROUND_FILE="scripts/background.png"

TMP_DIR="build/tmp.dir"
TMP_DMG="build/tmp.dmg"

# create staging directory

echo "create staging directory... ${TMP_DIR}"

rm -Rf "${TMP_DIR}"
mkdir -p "${TMP_DIR}"
cp -Rf "${ATOM_APP_DIR}" "${TMP_DIR}/${APP_NAME}"

# create temp dmg(r/w)

echo "create staging dmg... ${TMP_DMG}"

rm -f "${TMP_DMG}"

hdiutil create -srcfolder "$TMP_DIR" -volname "${VOL_NAME}" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW "${TMP_DMG}"

# modify temp dmg with icon, background, ...

VOL_DIR="/Volumes/${VOL_NAME}"

echo "decorate dmg... ${VOL_DIR}"

TMP_DEV=$(hdiutil attach -readwrite -noverify -noautoopen "${TMP_DMG}" | grep "${VOL_NAME}" | awk '{print $1}')

ln -s /Applications "${VOL_DIR}/Applications"

cp "${DMG_ICNS_FILE}" "${VOL_DIR}/.VolumeIcon.icns"
SetFile -c icnC "${VOL_DIR}/.VolumeIcon.icns"

mkdir -p "${VOL_DIR}/.background"
cp "${DMG_BACKGROUND_FILE}" "${VOL_DIR}/.background/${DMG_BACKGROUND_NAME}"

#
# open background.pxm in PixelMater
#
#       +-------------------------------------------+
# 128px |..64px....128px....128px....128px....64px..|
# 128px |       HelloWebApp ----> Applications      | 384px
# 128px |       center=128x192   center=384x192     |
#       +-------------------------------------------+
#                          512px

DMG_BACKGROUND_NAME=$(basename $DMG_BACKGROUND_FILE)

echo '
tell application "Finder"
    tell disk "'${VOL_NAME}'"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 612, 484}
        set theViewOptions to the icon view options of container window
        set arrangement of theViewOptions to not arranged
        set icon size of theViewOptions to 128
        set background picture of theViewOptions to file ".background:'${DMG_BACKGROUND_NAME}'"
        set position of item "'${APP_NAME}'" of container window to {128, 192}
        set position of item "Applications" of container window to {384, 192}
        update without registering applications
        delay 3
        close
    end tell
end tell
' | osascript

SetFile -a C "${VOL_DIR}"

chmod -Rf go-w "${VOL_DIR}" &> /dev/null || true

sync
sync

hdiutil detach "${TMP_DEV}"

# create final dmg(r/o and compress)

echo "create final dmg... ${TMP_DMG}"
rm -f "${OUT_DMG}"
hdiutil convert "${TMP_DMG}" -format UDZO -imagekey zlib-level=9 -o "${OUT_DMG}"

# cleanup

rm -f "${TMP_DMG}"
rm -Rf "${TMP_DIR}"

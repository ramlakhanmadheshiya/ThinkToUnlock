#!/bin/sh
# Patch expo-keep-awake to add missing .catch() on activateKeepAwakeAsync promise.
# Without this, Samsung devices throw uncaught promise rejections because the native
# wake-lock activation fails, and Expo's useKeepAwake hook forgot to add .catch().
# See: node_modules/expo-keep-awake/src/index.ts, line ~33

FILE="node_modules/expo-keep-awake/src/index.ts"

if [ -f "$FILE" ]; then
  # Only patch if it hasn't been patched already
  if grep -q '\.catch(() => {});' "$FILE"; then
    echo "[patch] expo-keep-awake already patched, skipping."
  else
    # Replace the .then() closing with .then().catch(() => {})
    sed -i.bak 's/    });$/    }).catch(() => {});/' "$FILE"
    rm -f "${FILE}.bak"
    echo "[patch] expo-keep-awake patched successfully."
  fi
else
  echo "[patch] expo-keep-awake not found, skipping."
fi

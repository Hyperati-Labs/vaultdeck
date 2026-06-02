/**
 * Expo dev tools call useKeepAwake on Android before the Activity exists, which
 * rejects with "Unable to activate keep awake". Swallow that race in development.
 */
if (typeof __DEV__ !== "undefined" && __DEV__) {
  try {
    const keepAwake = require("expo-keep-awake");
    const activate = keepAwake.activateKeepAwakeAsync;
    if (typeof activate === "function") {
      keepAwake.activateKeepAwakeAsync = (tag) => activate(tag).catch(() => {});
    }
  } catch {
    // expo-keep-awake unavailable (e.g. web-only tooling)
  }
}

require("expo-router/entry");

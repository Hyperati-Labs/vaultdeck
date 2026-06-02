const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

/** @type {readonly string[]} */
const LOCKED_ML_KIT_ACTIVITIES = [
  "com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity",
  "com.google.mlkit.vision.documentscanner.internal.GmsDocumentScanningDelegateActivity",
];

function ensureToolsNamespace(manifest) {
  manifest.$ = {
    ...manifest.$,
    "xmlns:tools": "http://schemas.android.com/tools",
  };
}

/**
 * Strip portrait (or other) orientation locks merged from Play Services / ML Kit AARs.
 * Required for Android 16+ large-screen compatibility (Play Console).
 */
function mergeRemoveScreenOrientation(androidManifest, activityName) {
  const application =
    AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!application.activity) {
    application.activity = [];
  }

  let activity = application.activity.find(
    (item) => item.$?.["android:name"] === activityName
  );

  if (!activity) {
    activity = { $: { "android:name": activityName } };
    application.activity.push(activity);
  }

  activity.$["android:name"] = activityName;
  activity.$["tools:node"] = "merge";
  activity.$["tools:remove"] = "android:screenOrientation";
}

/**
 * @type {import("expo/config-plugins").ConfigPlugin}
 */
function withAndroidLargeScreenManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    ensureToolsNamespace(manifest);

    for (const activityName of LOCKED_ML_KIT_ACTIVITIES) {
      mergeRemoveScreenOrientation(config.modResults, activityName);
    }

    return config;
  });
}

module.exports = withAndroidLargeScreenManifest;

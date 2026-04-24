const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

function setKotlinVersion(config) {
  let buildGradle = config.modResults;
  
  if (typeof buildGradle !== 'string') {
    return config;
  }

  if (buildGradle.includes('kotlinVersion')) {
    buildGradle = buildGradle.replace(
      /ext\.kotlinVersion\s*=\s*["'].*?["']/,
      "ext.kotlinVersion = '1.9.25'"
    );
  } else {
    // Add kotlinVersion if it doesn't exist
    const buildscriptMatch = buildGradle.match(/buildscript\s*\{/);
    if (buildscriptMatch) {
      const insertPosition = buildGradle.indexOf(buildscriptMatch[0]) + buildscriptMatch[0].length;
      buildGradle =
        buildGradle.slice(0, insertPosition) +
        "\n    ext.kotlinVersion = '1.9.25'" +
        buildGradle.slice(insertPosition);
    }
  }

  config.modResults = buildGradle;
  return config;
}

module.exports = function withKotlinVersionFix(config) {
  config = withProjectBuildGradle(config, (config) => {
    return setKotlinVersion(config);
  });

  config = withAppBuildGradle(config, (config) => {
    return setKotlinVersion(config);
  });

  return config;
};

const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

function setKotlinVersion(buildGradle) {
  if (buildGradle.includes('kotlinVersion')) {
    return buildGradle.replace(
      /ext\.kotlinVersion\s*=\s*["'].*?["']/,
      "ext.kotlinVersion = '1.9.25'"
    );
  }
  
  // Add kotlinVersion if it doesn't exist
  const buildscriptMatch = buildGradle.match(/buildscript\s*\{/);
  if (buildscriptMatch) {
    const insertPosition = buildGradle.indexOf(buildscriptMatch[0]) + buildscriptMatch[0].length;
    return (
      buildGradle.slice(0, insertPosition) +
      "\n    ext.kotlinVersion = '1.9.25'" +
      buildGradle.slice(insertPosition)
    );
  }
  
  return buildGradle;
}

module.exports = function withKotlinVersionFix(config) {
  config = withProjectBuildGradle(config, (config) => {
    config.modResults = setKotlinVersion(config.modResults);
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    config.modResults = setKotlinVersion(config.modResults);
    return config;
  });

  return config;
};

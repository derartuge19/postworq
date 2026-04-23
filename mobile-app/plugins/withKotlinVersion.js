const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withKotlinVersion(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter((item) => {
      if (item.type === 'property' && item.key === 'kotlinVersion') {
        return false;
      }
      return true;
    });

    config.modResults.push({
      type: 'property',
      key: 'kotlinVersion',
      value: '1.9.25',
    });

    return config;
  });
};

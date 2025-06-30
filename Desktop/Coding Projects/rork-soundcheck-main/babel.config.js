module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [], // Temporarily remove 'nativewind/babel'
  };
};

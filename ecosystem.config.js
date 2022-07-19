module.exports = {
  apps: [
    {
      name: "application",
      script: "/home/site/wwwroot/dist/src/main.js",
      env_test: {
        NODE_ENV: "test",
      },
      env_staging: {
        NODE_ENV: "staging",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

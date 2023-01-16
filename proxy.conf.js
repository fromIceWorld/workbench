const PROXY_CONFIG = [
  {
    context: ["/suger"],
    target: "https://www.fastmock.site/mock/14c2723aefa052a75b2a6feeed0cf387",
    secure: false,
    changeOrigin: false,
  },
];

module.exports = PROXY_CONFIG;

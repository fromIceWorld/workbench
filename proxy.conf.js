const PROXY_CONFIG = [
  {
    context: ["/center"],
    target: "http://localhost:3000 ",
    secure: false,
    changeOrigin: false,
    pathRewrite: {
      "^/center": "/",
    },
  },
  {
    context: ["/store"],
    target: "http://localhost:3000 ",
    secure: false,
    changeOrigin: false,
    // pathRewrite: {
    //   "^/center": "/",
    // },
  },
  {
    context: ["/vue"],
    target: "http://localhost:3000 ",
    secure: false,
    changeOrigin: false,
    // pathRewrite: {
    //   "^/center": "/",
    // },
  },
];

module.exports = PROXY_CONFIG;

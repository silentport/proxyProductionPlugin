# proxyProductionPlugin

Run the built app by webpack using localhost

[![Build Status](https://travis-ci.org/silentport/proxyProductionPlugin.svg?branch=master)](https://travis-ci.org/silentport/proxyProductionPlugin)
<a href="https://www.npmjs.com/package/proxy-production-webpack-plugin"><img alt="undefined" src="https://img.shields.io/npm/v/proxy-production-webpack-plugin.svg?style=flat"></a>


### install

```javascript
npm i proxy-production-webpack-plugin -D
```

### usage

```javascript
const ProxyProductionPlugin = require('proxy-production-webpack-plugin');

new ProxyProductionPlugin({
  host: 'http://sandbox.api.puri.intl.miui.com', // server host
  publicPath: 'http://sandbox.h5.puri.intl.miui.com/puri', // static resources path
  port: 8000, //localhost port
  entry: /^_puri/, // router for index
  messages: ['http://localhost:8000/_puri/share/v1/topic/Hindi/IN/en/20181121'], // test link
});
```

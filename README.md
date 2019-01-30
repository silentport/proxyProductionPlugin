# proxyProductionPlugin

Run the built app by webpack using localhost

### install

```javascript
npm i proxy-production-webpack-plugin -D
```

### usage

```javascript
const proxyProductionPlugin = require('proxy-production-webpack-plugin');

new proxyProductionPlugin({
  host: 'http://sandbox.api.puri.intl.miui.com', // server host
  publicPath: 'http://sandbox.h5.puri.intl.miui.com/puri', // static resources path
  port: 8000, //localhost port
  entry: /^_puri/, // router for index
  messages: ['http://localhost:8000/_puri/share/v1/topic/Hindi/IN/en/20181121'], // test link
});
```

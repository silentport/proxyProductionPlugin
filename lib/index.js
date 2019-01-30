const http = require ('http');
const url = require ('url');
const handleGetMethod = Symbol ('#handleGetMethod');
const handlePostMethod = Symbol ('#handlePostMethod');
const proxyResponse = Symbol ('#proxyResponse');
const runServer = Symbol ('#runServer');
const getSource = Symbol ('#getSource');
const replaceUrl = Symbol ('#replaceUrl');
const handleRequest = Symbol ('#handleRequest');

const type = {
  js: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
};

module.exports = class proxyProductionPlugin {
  constructor (options) {
    this.host = options.host;
    this.port = options.port;
    this.proxy = `http://localhost:${this.port}`;
    this.publicPath = options.publicPath;
    this.entry = options.entry;
    this.map = Object.create (null);
    this.messages = options.messages || [];
  }

  apply (compiler) {
    let plugin = null;
    let __webpack__version__ = 4;
    if (compiler.hooks && compiler.hooks.afterEmit) {
      plugin = compiler.hooks.afterEmit.tap.bind (compiler.hooks.afterEmit);
    } else {
      // webpack3
      __webpack__version__ = 3;
      plugin = compiler.plugin.bind (compiler);
    }

    plugin (
      __webpack__version__ === 4 ? 'proxyProductionPlugin' : 'emit',
      (complication, callback) => {
        const assets = complication.assets;
        const assetsKeys = Object.keys (assets);
        assetsKeys.forEach (key => {
          if (!this.map[key]) {
            this.map[key] = this[getSource] (assets[key]);
            if (Buffer.isBuffer (this.map[key])) return;
            this.map[key] = this[replaceUrl] (
              this.map[key],
              this.host,
              this.proxy
            );
            if (this.publicPath) {
              this.map[key] = this[replaceUrl] (
                this.map[key],
                '/' + this.publicPath + '/static',
                this.proxy + '/static'
              );
            }
          }
        });
        this[runServer] ();
        'function' === typeof callback && callback ();
      }
    );
  }

  [runServer] () {
    http
      .createServer ((req, res) => {
        this[handleRequest] (req, res);
      })
      .listen (this.port, err => {
        if (!err) {
          this.messages.forEach (url => {
            console.log (url + '\n');
          });
        }
      });
  }

  [replaceUrl] (target, originUrl, url) {
    return target.replace (new RegExp (originUrl, 'g'), (all, val) => {
      return url;
    });
  }

  [getSource] (data) {
    return 'function' === typeof data.source ? data.source () : data._value;
  }

  [handleGetMethod] (path, query, req, res) {
    let suffix = '';

    // request index
    if (this.entry.test (path)) {
      res.writeHead (200, {
        'Content-Type': 'text/html; charset=utf-8',
      });
      return res.end (this.map['index.html']);
    }

    if (path.startsWith (this.publicPath) && /\.\w+/.test (path)) {
      let len = this.publicPath.length;
      path = path.substring (len + 1);
    }

    if (/\.\w+/.test (path)) {
      suffix = path.split ('.').pop ();
    }

    if (suffix && type[suffix]) {
      res.writeHead (200, {
        'Content-Type': type[suffix],
      });
      return res.end (this.map[path]);
    }

    if ((suffix = suffix.match (/(png|jpe?g|gif|svg)/))) {
      res.writeHead (200, {
        'Content-Type': `image/${suffix[0]}`,
      });
      return res.end (this.map[path]);
    }

    // ignore request for sourceMap
    if (/.map$/.test (path)) return;

    this[proxyResponse] (req, res, path, query, null);
  }

  [handlePostMethod] (path, req, res) {
    let data = [];
    req.on ('data', chunk => data.push (chunk));
    req.on ('end', () => {
      this[proxyResponse] (req, res, path, null, data);
    });
  }

  // handle request for non-static resource
  [proxyResponse] (req, res, path, query, data) {
    const options = new URL (this.host);
    const pathUrl = query ? '/' + path + '?' + query : '/' + path;
    const headers = req.headers;
    const proxyHeaders = Object.create (null);

    for (let key in headers)
      proxyHeaders[key] = headers[key];
    proxyHeaders['host'] = options.host;

    const proxyReq = http.request (
      {
        method: req.method,
        protocol: options.protocol,
        host: options.host,
        hostname: options.host,
        port: options.port ? Number (options.port) : 80,
        path: pathUrl,
        timeout: 5000,
        headers: proxyHeaders,
      },
      proxyRes => {
        let proxyHeader = proxyRes.headers;
        let statusCode = proxyRes.statusCode;
        try {
          res.writeHeader (statusCode, proxyHeader);
        } catch (e) {
          console.error ('SetHeader Error: ', e.message);
        }
        proxyRes.pipe (res);
      }
    );

    proxyReq.on ('error', err => {
      console.error (`Request Error: `, err);
    });

    // post request
    if (data) {
      proxyReq.write (Buffer.concat (data));
    }
    proxyReq.end ();
  }

  [handleRequest] (req, res) {
    const URL = url.parse (req.url);
    const path = URL.pathname.substring (1);
    const query = URL.query;

    if ('GET' === req.method) {
      this[handleGetMethod] (path, query, req, res);
    }

    if ('POST' === req.method) {
      this[handlePostMethod] (path, req, res);
    }
  }
};

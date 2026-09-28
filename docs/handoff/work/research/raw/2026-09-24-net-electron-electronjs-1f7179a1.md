---
url: https://www.electronjs.org/docs/latest/api/net
retrieved: 2026-09-24
command: firecrawl scrape https://www.electronjs.org/docs/latest/api/net --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: net | Electron
---
[Skip to main content](https://www.electronjs.org/docs/latest/api/net#__docusaurus_skipToContent_fallback)

On this page

> Issue HTTP/HTTPS requests using Chromium's native networking library

Process: [Main](https://www.electronjs.org/docs/latest/glossary#main-process), [Utility](https://www.electronjs.org/docs/latest/glossary#utility-process)

The `net` module is a client-side API for issuing HTTP(S) requests. It is
similar to the [HTTP](https://nodejs.org/api/http.html) and
[HTTPS](https://nodejs.org/api/https.html) modules of Node.js but uses
Chromium's native networking library instead of the Node.js implementation,
offering better support for web proxies. It also supports checking network status.

The following is a non-exhaustive list of why you may consider using the `net`
module instead of the native Node.js modules:

- Automatic management of system proxy configuration, support of the wpad
protocol and proxy pac configuration files.
- Automatic tunneling of HTTPS requests.
- Support for authenticating proxies using basic, digest, NTLM, Kerberos or
negotiate authentication schemes.
- Support for traffic monitoring proxies: Fiddler-like proxies used for access
control and monitoring.

The API components (including classes, methods, properties and event names) are similar to those used in
Node.js.

Example usage:

```js
const { app } = require('electron')

app.whenReady().then(() => {

  const { net } = require('electron')

  const request = net.request('https://github.com')

  request.on('response', (response) => {

    console.log(`STATUS: ${response.statusCode}`)

    console.log(`HEADERS: ${JSON.stringify(response.headers)}`)

    response.on('data', (chunk) => {

      console.log(`BODY: ${chunk}`)

    })

    response.on('end', () => {

      console.log('No more data in response.')

    })

  })

  request.end()

})
```

The `net` API can be used only after the application emits the `ready` event.
Trying to use the module before the `ready` event will throw an error.

## Methods [​](https://www.electronjs.org/docs/latest/api/net\#methods "Direct link to Methods")

The `net` module has the following methods:

### `net.request(options)` [​](https://www.electronjs.org/docs/latest/api/net\#netrequestoptions "Direct link to netrequestoptions")

- `options` ( [ClientRequestConstructorOptions](https://www.electronjs.org/docs/latest/api/client-request#new-clientrequestoptions) \| string) - The `ClientRequest` constructor options.

Returns [`ClientRequest`](https://www.electronjs.org/docs/latest/api/client-request)

Creates a [`ClientRequest`](https://www.electronjs.org/docs/latest/api/client-request) instance using the provided
`options` which are directly forwarded to the `ClientRequest` constructor.
The `net.request` method would be used to issue both secure and insecure HTTP
requests according to the specified protocol scheme in the `options` object.

### `net.fetch(input[, init])` [​](https://www.electronjs.org/docs/latest/api/net\#netfetchinput-init "Direct link to netfetchinput-init")

- `input` string \| [GlobalRequest](https://nodejs.org/api/globals.html#request)
- `init` [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) & { bypassCustomProtocolHandlers?: boolean } (optional)

Returns `Promise<GlobalResponse>` \- see [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response).

Sends a request, similarly to how `fetch()` works in the renderer, using
Chromium's network stack. This differs from Node's `fetch()`, which uses
Node.js's HTTP stack.

Example:

```js
async function example() {

  const response = await net.fetch('https://my.app')

  if (response.ok) {

    const body = await response.json()

    // ... use the result.

  }

}
```

This method will issue requests from the [default session](https://www.electronjs.org/docs/latest/api/session#sessiondefaultsession).
To send a `fetch` request from another session, use [ses.fetch()](https://www.electronjs.org/docs/latest/api/session#sesfetchinput-init).

See the MDN documentation for
[`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) for more
details.

Limitations:

- `net.fetch()` does not support the `data:` or `blob:` schemes.
- The value of the `integrity` option is ignored.
- The `.type` and `.url` values of the returned `Response` object are
incorrect.

By default, requests made with `net.fetch` can be made to [custom protocols](https://www.electronjs.org/docs/latest/api/protocol)
as well as `file:`, and will trigger [webRequest](https://www.electronjs.org/docs/latest/api/web-request) handlers if present.
When the non-standard `bypassCustomProtocolHandlers` option is set in RequestInit,
custom protocol handlers will not be called for this request. This allows forwarding an
intercepted request to the built-in handler. [webRequest](https://www.electronjs.org/docs/latest/api/web-request)
handlers will still be triggered when bypassing custom protocols.

```js
protocol.handle('https', (req) => {

  if (req.url === 'https://my-app.com') {

    return new Response('<body>my app</body>')

  } else {

    return net.fetch(req, { bypassCustomProtocolHandlers: true })

  }

})
```

note

In the [utility process](https://www.electronjs.org/docs/latest/glossary#utility-process), custom protocols
are not supported.

### `net.isOnline()` [​](https://www.electronjs.org/docs/latest/api/net\#netisonline "Direct link to netisonline")

Returns `boolean` \- Whether there is currently internet connection.

A return value of `false` is a pretty strong indicator that the user
won't be able to connect to remote sites. However, a return value of
`true` is inconclusive; even if some link is up, it is uncertain
whether a particular connection attempt to a particular remote site
will be successful.

### `net.resolveHost(host, [options])` [​](https://www.electronjs.org/docs/latest/api/net\#netresolvehosthost-options "Direct link to netresolvehosthost-options")

- `host` string - Hostname to resolve.
- `options`Object (optional)
  - `queryType`string (optional) - Requested DNS query type. If unspecified,
    resolver will pick A or AAAA (or both) based on IPv4/IPv6 settings:
    - `A` \- Fetch only A records
    - `AAAA` \- Fetch only AAAA records.
  - `source`string (optional) - The source to use for resolved addresses.
    Default allows the resolver to pick an appropriate source. Only affects use
    of big external sources (e.g. calling the system for resolution or using
    DNS). Even if a source is specified, results can still come from cache,
    resolving "localhost" or IP literals, etc. One of the following values:
    - `any` (default) - Resolver will pick an appropriate source. Results could
      come from DNS, MulticastDNS, HOSTS file, etc
    - `system` \- Results will only be retrieved from the system or OS, e.g. via
      the `getaddrinfo()` system call
    - `dns` \- Results will only come from DNS queries
    - `mdns` \- Results will only come from Multicast DNS queries
    - `localOnly` \- No external sources will be used. Results will only come
      from fast local sources that are available no matter the source setting,
      e.g. cache, hosts file, IP literal resolution, etc.
  - `cacheUsage`string (optional) - Indicates what DNS cache entries, if any,
    can be used to provide a response. One of the following values:
    - `allowed` (default) - Results may come from the host cache if non-stale
    - `staleAllowed` \- Results may come from the host cache even if stale (by
      expiration or network changes)
    - `disallowed` \- Results will not come from the host cache.
  - `secureDnsPolicy`string (optional) - Controls the resolver's Secure DNS
    behavior for this request. One of the following values:
    - `allow` (default)
    - `disable`

Returns [Promise<ResolvedHost>](https://www.electronjs.org/docs/latest/api/structures/resolved-host) \- Resolves with the resolved IP addresses for the `host`.

This method will resolve hosts from the [default session](https://www.electronjs.org/docs/latest/api/session#sessiondefaultsession).
To resolve a host from another session, use [ses.resolveHost()](https://www.electronjs.org/docs/latest/api/session#sesresolvehosthost-options).

## Properties [​](https://www.electronjs.org/docs/latest/api/net\#properties "Direct link to Properties")

### `net.online` _Readonly_ [​](https://www.electronjs.org/docs/latest/api/net\#netonline-readonly "Direct link to netonline-readonly")

A `boolean` property. Whether there is currently internet connection.

A return value of `false` is a pretty strong indicator that the user
won't be able to connect to remote sites. However, a return value of
`true` is inconclusive; even if some link is up, it is uncertain
whether a particular connection attempt to a particular remote site
will be successful.

### `net.WebSocket` [​](https://www.electronjs.org/docs/latest/api/net\#netwebsocket "Direct link to netwebsocket")

note

This property is only available in the [main process](https://www.electronjs.org/docs/latest/glossary#main-process).

A [`typeof WebSocket`](https://www.electronjs.org/docs/latest/api/web-socket) reference to the [`WebSocket`](https://www.electronjs.org/docs/latest/api/web-socket)
class, which can be used to create [WHATWG-compatible](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
WebSocket connections through Chromium's network stack from the main process.

```js
const { app, net } = require('electron')

app.whenReady().then(() => {

  const ws = new net.WebSocket('wss://echo.websocket.events')

  ws.onmessage = (event) => console.log(event.data)

})
```

- [Methods](https://www.electronjs.org/docs/latest/api/net#methods)
  - [`request`](https://www.electronjs.org/docs/latest/api/net#netrequestoptions)
  - [`fetch`](https://www.electronjs.org/docs/latest/api/net#netfetchinput-init)
  - [`isOnline`](https://www.electronjs.org/docs/latest/api/net#netisonline)
  - [`resolveHost`](https://www.electronjs.org/docs/latest/api/net#netresolvehosthost-options)
- [Properties](https://www.electronjs.org/docs/latest/api/net#properties)
  - [`online`](https://www.electronjs.org/docs/latest/api/net#netonline-readonly)
  - [`WebSocket`](https://www.electronjs.org/docs/latest/api/net#netwebsocket)

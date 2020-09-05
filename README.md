
# Well-known

Module to fetch .well-known/openid-configuration information from a server. It turns out that there are a couple of variants out there, and this library tries to normalize them. Also, built in cache handling will minimize delays and number of calls for this information.

# Install

> npm install @digitum/well-known

# Status: Experimental

Note that this module is highly experimental and should only be used for development and evaluation.

# Usage

## Constructor

+ `hostBase` \<string\> Server address including protocol.
+ `options` \<object>
  + `cache` \<string\> | \<number\> **Default:** `12h`. Number as milliseconds. Accepts time syntax according to npm packet [ms](https://www.npmjs.com/package/ms).
  + `useExpiredCacheData` \<boolean\> **Default:** `true`. If set, expired cache will still be used until cache is updated.

# Examples

## Then/Catch

```javascript
const WellKnown = require('@digitum/well-known')

let options = {
    cache: '12h'.
    useExpiredCacheData: true.
}

wellKnown = new WellKnown('https://myauthserver.url', options)

wellKnown.get().then(
    (data) => {
        console.log(data)
    }
).catch((err) => {
    console.warn(err)
})
```

## Async/Await

```javascript
import WellKnown from '@digitum/well-known'

wellKnown = new WellKnown('https://myauthserver.url', options)

let options = {
    cache: '12h'.
    useExpiredCacheData: true.
}

try {
    let data = await wellKnown.get()
} catch (err) {
    console.warn('Something wrong happened')
}

```

# Tests

> npm run test

# Changelog

1.0.3 (2020-09-06)

+ Switch to typescript (removed malicious dependency)
+ Fix error handling on unreachable servers
+ Added test for Jest framework
+ Added automatic build pipeline

1.0.2 (2018-10-07)

+ Add Github repo
+ Method jwks() added

1.0.1 (2018-10-04)

+ Define target server in constructor
+ Method get() added
+ Static method get() added

1.0.0 (2018-10-03)

+ Initial release, no functions

# Known issues

+ Nothing right now.

## Licensing

This script is free for use for everyone. Content and functionality can be changed without notice. Breaking changes should indicate by bump major version. This script is published to encourage free software development. Please visit development page for more info. No warranty what so ever. Use it on own risk. It is highly encouraged to use automated tests to ensure that your use cases works as expected. Use Mocha, Jest or any other suitable test framework.

# Contact

Dont hesitate to contact me for improvments and suggestions

Contact data will soon be published to my home page.

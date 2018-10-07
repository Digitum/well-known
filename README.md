# Well-known
Module to fetch .well-known/openid-configuration information from a server. It turns out that there are a couple of variants out there, and this library tries to normalize them. Also, built in cache handling will minimize delays and number of calls for this information.

# Prerequisites
Need investigation. Works with Node 10 and Babel 7.

# Install
> npm install @digitum/well-known

# Status: Experimental
Note that this module is highly experimental and should only be used for development and evaluation.

# Usage

## Constructor WellKnown(`host`[, `options`])

+ `host` \<string\> Server address including protocol.
+ `options` <object> 
  - `cache` \<boolean\> | \<string\> | \<number\> **Default:** `12h`. If `true`, cache is set to `12h`. Number as milliseconds. Accepts time syntax according to npm packet [ms](https://www.npmjs.com/package/ms)
  - `useExpiredCacheData` \<boolean\> **Default:** `true`. If set, expired cache will still be used until cache is updated.

# Examples
```javascript
import WellKnown from '@digitum/well-known'

// Fetch well-known file from server
// Async/Await style
let options = {
    cache: '12h'
}

wellKnown = new WellKnown('https://myserver.url', options)
try {
    let wellknownfile = await wellKnown.get()
} catch(err) {
    console.log(err)
}


// Promise style
wellKnown.get().then(
    (data) => {
        console.log(data)
    }
).catch((err) => {
    console.warn(err)
})
```

Static use
```javascript
import WellKnown from '@digitum/well-known'

// Fetch well-known file from server
// Async/Await style
try {
let wellknownfile = WellKnown.get('https://myserver.url')
} catch(err) {
    console.log(err)
}


// Promise style
WellKnown.get('https://myserver.url').then(
    (data) => {
        console.log(data)
    }
).catch((err) => {
    console.warn(err)
})
```

# Tests
> npm run test

# Changelog
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
+ Tests does not work properly
+ Does not handle promise rejects properly

# Roadmap
### 2018 October
+ Basic functionality
+ Fetch well-known file
+ Fetch jwks path
+ Fix tests
+ Extensive testing for stable release

### 2018 December
+ Add support for caching public keys

# Goals
This is my first NPM package and this projects goals is:
- Create a great and useful module
- Give me insight in how NOM package development works

# Contact
Dont hesitate to contact me for improvments and suggestions

Contact data will soon be published to my home page.


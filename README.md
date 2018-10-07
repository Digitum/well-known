# Well-known
Initial commit

# Install
> npm install @digitum/well-known

# Status: Experimental
Note that this module is highly experimental and should only be used for development and evaluation.

# Usage
```javascript
import WellKnown from '@digitum/well-known'

// Initialize
wellKnown = new WellKnown('https://myserver.url')

// Fetch well-known file from server
// Async/Await style
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
1.0.0 (2018-10-03)
- Initial release, no functions

1.0.1 (2018-10-04)
- Define target server in constructor
- method jwks() added

# Known issues
- Tests does not work

# Roadmap
2018 October
- Basic functionality
- Fetch well-known file
- Fetch jwks path
- ... TBD

# Goals
This is my first NPM package and this projects goals is:
- Give me insight in how NOM package development works
- Create a great package

# Contact
Dont hesitate to contact me for improvments and suggestions

Contact data will soon be published to my home page.


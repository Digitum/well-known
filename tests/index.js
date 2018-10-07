import WellKnown from '../src/well-known'

// Set target server
let wellKnown = new WellKnown('https://accounts.google.com', {
    cache: '10s',
    useExpiredCacheData: true
})

function test() {
    setInterval(()=>{
        wellKnown.get().then(
            (data) => {
                console.log('Got valid data')
            },
            (err) => {
                console.warn(err)
            }
        )
    
    },500) 

    WellKnown.get('accounts.google.com').then(
        (data) => {
            // console.log(data)
        },
        (err) => {
            console.warn(err)
        }
    )
}

test()

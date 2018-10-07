import ms from 'ms'
import helpers from './well-known.helpers'

class WellKnown {
    constructor(host, options) {
        let defaultOptions = {
            cache: ms('12h'),
            useExpiredCacheData: true
        }

        this._optionsCacheExpires = ms('12h')
        this._optionsUseExpiredCacheData = false

        if(options) {
            if(typeof options.cache === 'boolean') {
                this._optionsCacheExpires = (options.cache === false?0:this._optionsCacheExpires)
            } else if(typeof options.cache === 'string' || typeof options.cache === 'number'){
                this._optionsCacheExpires = ms(options.cache)
            } else {
                throw 'Parameter \'options\' in function WellKnown::get() must be of type string, number or boolean.'
            }

            if(typeof options.useExpiredCacheData === 'boolean') {
                this._optionsUseExpiredCacheData = options.useExpiredCacheData
            }
        }

        this._cacheExpires = new Date(0)
        this.wellKnownHost = host
        this.lastKnownWellKnownData = null
        this._promises = []
        
    }

    jwks(){
        return {
            path: async () => {
                // try {
                //     let data = await this._fetch()
                //     return data
                // } catch(e) {
                //     return null
                // }
            }
        }
    }
    get() {
        return new Promise(async (resolve, reject) => {
            // Check if there are wellknown data available in cache
            if(this.lastKnownWellKnownData) {
                // If cache is still valid
                if(new Date() < this._cacheExpires) {
                    return resolve(this.lastKnownWellKnownData)
                // If cache is not valid
                } else {
                    // If use cache even if cache is expired
                    if(this._optionsUseExpiredCacheData === true) {
                        // Return cached data but continue to get data from server
                        // Should be safe to resolve twice, even if it is not well documented
                        resolve(this.lastKnownWellKnownData)
                    }
                    //  else {
                    //     return resolve(this.lastKnownWellKnownData)
                    // }
                }
            }
            this._promises.push({resolve:resolve, reject:reject})
            if(this._promises.length === 1) {
                try {
                    let result = await helpers.fetchWellKnown(this.wellKnownHost)
                    this.lastKnownWellKnownData = result
                    this._cacheExpires = new Date(Date.now() + this._optionsCacheExpires)
    
                    let promise
                    while(promise = this._promises.shift()) {
                        promise.resolve(result)
                    }
                    return
                } catch (err) {
                    while(promise = this._promises.shift()) {
                        promise.reject(result)
                    }
                    return
                }
            }
        })
    }
    static async get(host) {
        try {
            let result = await helpers.fetchWellKnown(host)
            return result
        } catch(err) {
            return null
        }
        
    }

}

export default WellKnown
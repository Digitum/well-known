import https from 'https'


let self = {

    fetchWellKnown: (host) => {
        return new Promise((resolve, reject) => {
            let endpoints = self.formatWellKnowns(host)
    
            try {
                let promises = []
                for(let i = 0; i < endpoints.length; i++) {
                    promises.push(self.fetch(endpoints[i]))
                }
                
                // This little trick I found on SO:
                // https://stackoverflow.com/questions/39940152/get-first-fulfilled-promise
                
                const invert  = p  => new Promise((res, rej) => p.then(rej, res))
                const firstOf = ps => invert(Promise.all(ps.map(invert)))
    
                firstOf(promises)
                .then(
                    (data) => {
                        return resolve(data)
                    },
                    (err) => {
                        return reject()
                    }            
                )
                
            } catch(err) {
                return reject()
            }
        })
    },
    fetch: (endpoint) => {
        return new Promise((resolve, reject) => {
            https.get(endpoint,(res) => {
                let data = ''
                res.on('data', (part) => {
                    data = data + part
                });
                res.on('end', function() {
                    try{
                        let result = JSON.parse(data)
                        if(self.isWellKnown(result)) {
                            return resolve(result)
                        }
                    } catch(err) {
                        return reject(err)
                    }
                  });
            }).on('error', (err) => {
                return reject(err)
            });
        })
    },
    formatWellKnowns: (server) => {
        // Build different known variants of well-known paths
        // Right no, only one is known (https://host/.well-known/openid-configuration)
        return [
            server + '/.well-known/openid-configuration'
        ]
    },
    isWellKnown: (data) => {
        // Returns true if it is identified as an well-known file
    
        return true
    }
    

}

export default self
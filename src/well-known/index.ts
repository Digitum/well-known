import ms from 'ms';
import https from 'https';

class WellKnown {
  private optionsCacheExpires: number = ms('12h');

  private optionsUseExpiredCacheData: boolean = false;

  private cacheExpires: Date = new Date(0);

  private wellKnownHostBase: string;

  private lastKnownWellKnownData: any = null;

  private promises: any[] = [];

  constructor(hostBase: string | string[], options: any = {}) {

    /**
     *  TODO: Remove array check and disallow use of Array of strings as hostbase from version 2.0.0
     *   Start TODO block
     */

    if (Array.isArray(hostBase)) {
      console.info(
        'Inportant information: Wellknown::constructor(): Possibility to use array of hostbase will be removed in next major release.'
      );

      this.wellKnownHostBase = hostBase[0];
    } else {
      this.wellKnownHostBase = hostBase.toString();
    }

    /**
     *  End TODO block
     */

    if (options) {
      if (options.cache) {
        if (typeof options.cache === 'string') {
          this.optionsCacheExpires = Number(ms(options.cache.toString()));
        } else if (typeof options.cache === 'number') {
          this.optionsCacheExpires = Number(options.cache);
        } else {
          throw "Parameter 'options.cache' in function WellKnown::constructor() must be of type string, number or boolean.";
        }
      }

      if (options.useExpiredCacheData) {
        if (typeof options.useExpiredCacheData === 'boolean') {
          this.optionsUseExpiredCacheData =
            options.useExpiredCacheData === true;
        }
      }
    }
  }

  public jwks() {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await this.get();

        if (data.jwks_uri) {
          return resolve(data.jwks_uri);
        }

        return reject('JWKS data not found');
      } catch (err) {
        return reject();
      }
    });
  }

  public setHost(hostBase: string): string {
    this.wellKnownHostBase = hostBase;

    return this.wellKnownHostBase;
  }

  public get(attribute: string | null = null): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // Check if there are wellknown data available in cache
      this.promises.push({ resolve: resolve, reject: reject, attribute });

      if (this.lastKnownWellKnownData) {
        if (new Date() < this.cacheExpires) {
          // If cache is still valid
          return this.resolvePromiseQueue();
        } else if (this.optionsUseExpiredCacheData) {
            /**
            * If use cache even if cache is expired
            * // Return cached data but continue to get data from server
            * // Should be safe to resolve twice, even if it is not well documented
            */
          return this.resolvePromiseQueue();
        }
      }

      if (this.promises.length === 1) {
        try {
          let result = await this.fetchWellKnown(this.wellKnownHostBase);

          this.lastKnownWellKnownData = result;

          this.cacheExpires = new Date(Date.now() + this.optionsCacheExpires);

          await this.resolvePromiseQueue();
        } catch (err) {
          await this.rejectPromiseQueue(err);
        }

        return;
      }
    });
  }

  private async resolvePromiseQueue(): Promise<boolean> {
    try {
      while (this.promises.length) {
        let promise = this.promises.shift();

        if (promise.attribute) {
          promise.resolve(this.lastKnownWellKnownData[promise.attribute]);
        } else {
          promise.resolve(this.lastKnownWellKnownData);
        }
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
    return true;
  }
  private async rejectPromiseQueue(err: any): Promise<boolean> {
    try {
      if (this.optionsUseExpiredCacheData && this.lastKnownWellKnownData) {
        console.warn(
          'Error when fetch data from service. Option useExpiredCacheData is set to true, which returns old data regardless of error.'
        );
        console.warn(err);
        return this.resolvePromiseQueue();
      }
      while (this.promises.length) {
        let promise = this.promises.shift();

        promise.reject(null);
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
    return false;
  }
  private fetchWellKnown(hostBase: string): any {
    return new Promise(async (resolve, reject) => {
      let endpoints = this.formatWellKnowns(hostBase);

      let responseIsDone = false;
      let responsesLeft = endpoints.length;

      /**
       * We catch all errors, but show none of them if any of them works
       * If no endpoint works, we return an array of the responses
       */

      let errorList: any[] = [];
      // TODO: replace following code piece when Node has adopted Promise.any() method.
      endpoints.forEach(async (endpoint: string) => {
        try {
          responsesLeft--;
          let response = await this.fetch(endpoint, hostBase);
          if (response.issuer) {
            if (!responseIsDone) {
              responseIsDone = true;
              return resolve(response);
            }
          }
        } catch (err) {
          errorList.push(err);
        }
        if (responsesLeft <= 0) {
          return reject({
            error: 'Errors has occured. See list for details.',
            errorList,
          });
        }
      });
    });
  }
  private fetch(endpoint: string, hostBase: string): any {
    return new Promise((resolve, reject) => {
      let request = https
        .get(endpoint, { timeout: 3000 }, (res) => {
          let data = '';
          res.on('data', (part) => {
            data = data + part;
          });
          res.on('end', () => {
            try {
              if (res.statusCode !== 200) {
                return reject({
                  error:
                    'Wrong responsecode. Expected 200, got ' +
                    res.statusCode +
                    '. Did you check that hostBase parameter is correct?',
                  endpoint,
                  hostBase,
                  data: res.statusCode,
                });
              }
              let result = JSON.parse(data);
              if (this.isWellKnown(result)) {
                return resolve(result);
              }
              return reject({
                error: 'Malformed response from authentication server.',
                endpoint,
                hostBase,
                data: result,
              });
            } catch (reason) {
              return reject({
                error: 'connection issue',
                endpoint,
                hostBase,
                reason,
              });
            }
          });
        })
        .on('error', (err) => {
          return reject({
            error: 'connection error',
            reason: err,
          });
        });

      request.setTimeout(2000, function () {
        request.destroy();
        return reject({
          error: 'connection timeout',
          reason: null,
        });
      });
    });
  }
  private formatWellKnowns(host: string): string[] {
      /**
       * Build different known variants of well-known paths
       * Right now, only one is known (https://<host>/.well-known/openid-configuration)s
       */
    return [host + '/.well-known/openid-configuration'];
  }
  private isWellKnown(data: any): boolean {
    // TODO: Returns true if it is identified as an well-known file
    return true;
  }
}

export default WellKnown;

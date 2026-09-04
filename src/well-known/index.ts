import ms from 'ms';
import https from 'https';

export interface WellKnownOptions {
  cache?: string | number;
  useExpiredCacheData?: boolean;
}

class WellKnown {
  private optionsCacheExpires: number = ms('12h');

  private optionsUseExpiredCacheData: boolean = false;

  private cacheExpires: Date = new Date(0);

  private wellKnownHostBase: string;

  private lastKnownWellKnownData: Record<string, any> | null = null;

  private inFlightRequest: Promise<Record<string, any>> | null = null;

  constructor(hostBase: string | string[], options: WellKnownOptions = {}) {

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

    if (options.cache !== undefined) {
      if (typeof options.cache === 'string') {
        this.optionsCacheExpires = ms(options.cache as ms.StringValue);
      } else if (typeof options.cache === 'number') {
        this.optionsCacheExpires = options.cache;
      } else {
        throw "Parameter 'options.cache' in function WellKnown::constructor() must be of type string, number or boolean.";
      }

      if (!Number.isFinite(this.optionsCacheExpires) || this.optionsCacheExpires < 0) {
        throw "Parameter 'options.cache' in function WellKnown::constructor() must be of type string, number or boolean.";
      }
    }

    if (typeof options.useExpiredCacheData === 'boolean') {
      this.optionsUseExpiredCacheData = options.useExpiredCacheData;
    }
  }

  public async jwks(): Promise<string> {
    try {
      const data = await this.get();

      if (data.jwks_uri) {
        return data.jwks_uri;
      }

      return Promise.reject('JWKS data not found');
    } catch (err) {
      return Promise.reject();
    }
  }

  public setHost(hostBase: string): string {
    this.wellKnownHostBase = hostBase;
    this.lastKnownWellKnownData = null;
    this.cacheExpires = new Date(0);
    this.inFlightRequest = null;

    return this.wellKnownHostBase;
  }

  public get(attribute: string | null = null): Promise<any> {
    if (this.lastKnownWellKnownData) {
      const cachedData = this.selectAttribute(this.lastKnownWellKnownData, attribute);

      if (new Date() < this.cacheExpires) {
        return Promise.resolve(cachedData);
      }

      if (this.optionsUseExpiredCacheData) {
        void this.refreshCache().catch((err) => {
          console.warn(
            'Error when fetch data from service. Option useExpiredCacheData is set to true, which returns old data regardless of error.'
          );
          console.warn(err);
        });
        return Promise.resolve(cachedData);
      }
    }

    return this.refreshCache()
      .then((data) => this.selectAttribute(data, attribute))
      .catch(() => Promise.reject(null));
  }

  private selectAttribute(data: Record<string, any>, attribute: string | null): any {
    return attribute ? data[attribute] : data;
  }

  private refreshCache(): Promise<Record<string, any>> {
    if (!this.inFlightRequest) {
      const hostBase = this.wellKnownHostBase;
      const request = this.fetchWellKnown(hostBase)
        .then((data) => {
          if (this.wellKnownHostBase === hostBase) {
            this.lastKnownWellKnownData = data;
            this.cacheExpires = new Date(Date.now() + this.optionsCacheExpires);
          }
          return data;
        })
        .finally(() => {
          if (this.inFlightRequest === request) {
            this.inFlightRequest = null;
          }
        });

      this.inFlightRequest = request;
    }

    return this.inFlightRequest;
  }

  private async fetchWellKnown(hostBase: string): Promise<Record<string, any>> {
    const errorList: any[] = [];

    for (const endpoint of this.formatWellKnowns(hostBase)) {
      try {
        return await this.fetch(endpoint, hostBase);
      } catch (err) {
        errorList.push(err);
      }
    }

    throw {
      error: 'Errors has occured. See list for details.',
      errorList,
    };
  }

  private fetch(endpoint: string, hostBase: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const maximumResponseSize = 1024 * 1024;
      const request = https
        .get(endpoint, (res) => {
          let data = '';
          let responseSize = 0;

          res.on('data', (part) => {
            responseSize += Buffer.isBuffer(part)
              ? part.length
              : Buffer.byteLength(part);

            if (responseSize > maximumResponseSize) {
              res.destroy();
              return reject({
                error: 'Response from authentication server is too large.',
                endpoint,
                hostBase,
              });
            }

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
          res.on('error', (err) => {
            return reject({
              error: 'connection error',
              reason: err,
            });
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
    return [host.replace(/\/$/, '') + '/.well-known/openid-configuration'];
  }
  private isWellKnown(data: any): boolean {
    return Boolean(
      data &&
      typeof data === 'object' &&
      typeof data.issuer === 'string' &&
      data.issuer.length > 0
    );
  }
}

export default WellKnown;

'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const https = require('node:https');
const test = require('node:test');

const WellKnown = require('../dist');

function installHttpsMock(testContext, responses) {
  const calls = [];

  testContext.mock.method(https, 'get', (endpoint, callback) => {
    calls.push(String(endpoint));

    const request = new EventEmitter();
    request.destroy = () => {};
    request.setTimeout = () => request;

    process.nextTick(() => {
      const responseData = responses.shift();

      if (!responseData || responseData.error) {
        request.emit('error', responseData?.error ?? new Error('Missing mock response'));
        return;
      }

      const response = new EventEmitter();
      response.statusCode = responseData.statusCode ?? 200;
      response.destroy = () => {};

      callback(response);
      response.emit(
        'data',
        typeof responseData.body === 'string'
          ? responseData.body
          : JSON.stringify(responseData.body)
      );
      response.emit('end');
    });

    return request;
  });

  return calls;
}

async function rejectionOf(promise) {
  try {
    await promise;
    return { rejected: false };
  } catch (error) {
    return { rejected: true, error };
  }
}

test('supports direct CommonJS and .default imports', () => {
  assert.equal(typeof WellKnown, 'function');
  assert.equal(WellKnown.default, WellKnown);
});

test('shares requests and preserves get and jwks results', async (testContext) => {
  const calls = installHttpsMock(testContext, [
    {
      body: {
        issuer: 'https://issuer.example',
        jwks_uri: 'https://issuer.example/keys',
      },
    },
  ]);
  const wellKnown = new WellKnown('https://issuer.example');

  const [configuration, jwksAttribute, jwks] = await Promise.all([
    wellKnown.get(),
    wellKnown.get('jwks_uri'),
    wellKnown.jwks(),
  ]);

  assert.equal(configuration.issuer, 'https://issuer.example');
  assert.equal(jwksAttribute, 'https://issuer.example/keys');
  assert.equal(jwks, 'https://issuer.example/keys');
  assert.equal(calls.length, 1);
});

test('invalidates cached discovery data when the host changes', async (testContext) => {
  const calls = installHttpsMock(testContext, [
    { body: { issuer: 'https://old.example' } },
    { body: { issuer: 'https://new.example' } },
  ]);
  const wellKnown = new WellKnown('https://old.example', { cache: '1h' });

  assert.equal((await wellKnown.get()).issuer, 'https://old.example');
  assert.equal(wellKnown.setHost('https://new.example/'), 'https://new.example/');
  assert.equal((await wellKnown.get()).issuer, 'https://new.example');
  assert.deepEqual(calls, [
    'https://old.example/.well-known/openid-configuration',
    'https://new.example/.well-known/openid-configuration',
  ]);
});

test('returns stale data while refreshing it in the background', async (testContext) => {
  const calls = installHttpsMock(testContext, [
    { body: { issuer: 'https://issuer.example', version: 1 } },
    { body: { issuer: 'https://issuer.example', version: 2 } },
    { body: { issuer: 'https://issuer.example', version: 2 } },
  ]);
  const wellKnown = new WellKnown('https://issuer.example', {
    cache: 0,
    useExpiredCacheData: true,
  });

  assert.equal((await wellKnown.get()).version, 1);
  assert.equal((await wellKnown.get()).version, 1);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await wellKnown.get()).version, 2);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 3);
});

test('preserves public rejection values', async (testContext) => {
  installHttpsMock(testContext, [
    { statusCode: 404, body: 'not found' },
    { body: { issuer: 'https://issuer.example' } },
  ]);

  const unavailable = new WellKnown('https://unavailable.example');
  assert.deepEqual(await rejectionOf(unavailable.get()), {
    rejected: true,
    error: null,
  });

  const withoutJwks = new WellKnown('https://issuer.example');
  assert.deepEqual(await rejectionOf(withoutJwks.jwks()), {
    rejected: true,
    error: 'JWKS data not found',
  });
});

test('continues to accept an array host and uses its first value', async (testContext) => {
  testContext.mock.method(console, 'info', () => {});
  const calls = installHttpsMock(testContext, [
    { body: { issuer: 'https://first.example' } },
  ]);
  const wellKnown = new WellKnown([
    'https://first.example',
    'https://second.example',
  ]);

  assert.equal((await wellKnown.get()).issuer, 'https://first.example');
  assert.equal(calls[0], 'https://first.example/.well-known/openid-configuration');
});

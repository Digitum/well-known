import WellKnown from '../src/well-known';

it('Fetch anything from Microsoft .wellknown, using tenant and version endpoint as string, to have property \'jwks_uri\'.', async () => {
  let wellKnown = new WellKnown(
    'https://login.microsoftonline.com/common/v2.0'
  );

  await expect(wellKnown.get()).resolves.toHaveProperty('jwks_uri');
});

it('Expect to reject if host does not exist or can not be reached.', async () => {
  jest.setTimeout(10000);

  let wellKnown = new WellKnown('https://mumbo.jumbo.unknown.host');

  await expect(wellKnown.get()).rejects.toEqual(null);
});

it('Expect to reject if host does not have well known endpoint.', async () => {
  let wellKnown = new WellKnown('https://www.google.com');

  await expect(wellKnown.get()).rejects.toEqual(null);
});

it('Fetch jwks from Google .wellknown, to have property \'jwks_uri\'', async () => {
  let wellKnown = new WellKnown('https://accounts.google.com');

  await expect(wellKnown.get()).resolves.toHaveProperty('jwks_uri');
});

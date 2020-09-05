import WellKnown from '.';

let wellKnown = new WellKnown('https://auth.bowser.se', {
  useExpiredCacheData: true,
});

setInterval(() => {
  console.log('Query for endpoint!');
  wellKnown
    .get('authorization_endpoint')
    .then((data) => {
      console.log('A: %s', data);
    })
    .catch((err) => {
      console.log(err);
    });
}, 5000);

setTimeout(() => {
  console.log('Set host to invalid host');
  wellKnown.setHost('https://auth.bowser.se/test');
}, 12000);

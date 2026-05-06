import dns from 'dns';

dns.resolveSrv('_mongodb._tcp.mediguard1.t6kzdfd.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS SRV Resolution Error:', err);
  } else {
    console.log('DNS SRV Resolution Success:', addresses);
  }
});

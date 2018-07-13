const axios = require('axios');
const CachemanFile = require('cacheman-file');

const cache = new CachemanFile({tmpDir: '.cache', ttl: 30*24*3600,});

const getPeers = async () => {
    try {
        const res = await axios.get('https://seed219.cryptoluka.cl/peers');
        if (!res.data.peers) throw new Error('Missing peers.');
        console.log(`${res.data.peers.length} peers found`);
        return res.data.peers;
    } catch (e) {
        console.log('Can\'t get peers');
        throw e;
    }
};

const getLocation = async (ip) => new Promise((resolve) => {
    cache.get(ip, async (err, value) => {
        if (value) {
            return resolve(value);
        }
        try {
            console.log(`Request geolocation for IP: ${ip}`);
            const res = await axios.get(`http://api.ipstack.com/${ip}?access_key=_IPSTACK_API_KEY_&output=json&legacy=1`);
            cache.set(ip, res.data, 30*24*3600);
            resolve(res.data);
        } catch (e) {
            console.log('Can\'t get location', e);
        }
    });
});

const getLocations = async () => {
    return getPeers().then(peers => Promise.all(peers.map(peer => {
        const [ip, ] = peer.split(':');
        return getLocation(ip);
    })));
};

const cacheLocations = async () => {
    const locations = await getLocations();
    cache.set('locations', JSON.stringify(locations))
};

const getCachedLocations = () => new Promise((resolve) => {
    cache.get('locations', (err, value) => {
        resolve(value ? value : []);
    });
});

module.exports = {
    getCachedLocations,
    cacheLocations,
};

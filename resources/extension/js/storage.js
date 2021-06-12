const browser = require('webextension-polyfill');


let cache;


const get = async (url) => {
    if (!cache) {
        cache = (await browser.storage.local.get('attention')).attention || {};
    }

    if (!cache[url]) {
        cache[url] = Math.floor(Date.now() / 1000);

        await browser.storage.local.set({ attention: cache });
    }

    return cache[url];
};


module.exports = { get };

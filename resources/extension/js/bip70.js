const browser = require('webextension-polyfill');


let cache;


async function create(data) {
    return await fetch('https://esportsplus.com/payment/create', {
        body: JSON.stringify(data),
        cache: 'no-cache',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        mode: 'cors'
    })
    .then((response) => {
        if (response.status >= 200 && response.status < 300) {
            return response.json();
        }

        return {};
    });
};

async function poll(url, resolve = response => response) {
    setTimeout(async () => {
        let response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => {
                if (response.status >= 200 && response.status < 300) {
                    return response.json();
                }

                return {};
            });

        if (response.complete || false) {
            resolve(response);
        }
        else {
            poll(url, resolve);
        }
    }, (10 * 1000));
};


const get = async (address, resolve = response => response) => {
    if (!cache) {
        cache = (await browser.storage.local.get('bip70')).bip70 || {};
    }

    let invoice = cache[address] || false;

    if (address) {
        if (!invoice || (invoice.expires || 0) <= (Date.now() / 1000)) {
            cache[address] = await create({
                pay: [
                    {
                        // Replace With User Input Provided By User
                        amount: 0.01,
                        address
                    }
                ]
            });
            invoice = cache[address];

            await browser.storage.local.set({ bip70: cache });
        }

        if (invoice && invoice.qr || false) {
            poll(invoice.poll, resolve);
        }
    }

    resolve(invoice || {});
    return;
};


module.exports = { get };

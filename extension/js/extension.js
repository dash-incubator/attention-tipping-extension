const bip70 = {
    create: async (data) => {
        return await fetch('/payment/create', {
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
    },
    poll: async (url, success, platform = false) => {
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
                if (platform) {
                    console.log(response);
                }
                else {
                    qr.src = '';
                    qrmessage.innerHTML = 'Payment received!';
                }
            }

            poll(url, success);
        }, (10 * 1000));
    }
};
const regex = /(bitcoin:|DASH:|Dash:|dash:)([\w]+)/;


let attention,
    address = document.getElementById('address'),
    raf = window.requestAnimationFrame,
    qr = document.getElementById('qr'),
    qrmessage = document.getElementById('qr-message'),
    timer = document.getElementById('timer');


async function get(url) {
    if (!attention) {
        attention = await browser.storage.local.get('attention');
        attention = attention.attention || {};
    }

    if (!attention[url]) {
        attention[url] = Math.floor(Date.now() / 1000);

        await browser.storage.local.set({ attention });
    }

    return attention[url];
}

async function init() {
    browser.runtime.onMessage.addListener(async (message, sender) => {
        if (message.action !== 'getSource') {
            return;
        }

        let html = message.source,
            match = (html.match(regex) || [''])[0];

        let addr = match.split(':')[1],
            data;

        if (!match) {
            html = 'No Dash address found :(';
        }
        else {
            html = `
                <div>
                    <b>Dash Address Found!</b> <br>
                    ${addr}
                </div>
            `;
        }

        address.innerHTML = html;

        // Payment Server BIP70 Generator
        data = await browser.storage.local.get('bip70');
        data = data.bip70 || {};

        if (addr && (!data || (data.expires || 0) <= (Date.now() / 1000))) {
            data = await bip70.create({
                pay: [
                    {
                        amount: 0.01,
                        address: addr
                    }
                ]
            });

            await browser.storage.local.set({ bip70: data });
        }

        if (data.src || false) {
            bip70.poll(data.poll, 'https://www.esportsplus.net/unlocked-content');
            qr.src = data.qr;
        }
    });

    browser.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
        let tab = tabs[0],
            url = tab.url.split('://')[1];

        browser.tabs.executeScript(tab.id, {
            code: `browser.runtime.sendMessage({ action: 'getSource', source: ((document.body || {}).innerHTML || '') });`
        });

        update(await get(url), url);
    });
}

function text(start, url) {
    let seconds = Math.floor(Date.now() / 1000) - start,
        text = `<span class='row'>Time spent on <b class='--padding-left --padding-100'>${url}</b></span>`,
        time = {
            day: Math.floor(seconds / (60 * 60 * 24)),
            hour: Math.floor((seconds % (60 * 60 * 24)) / (60 * 60)),
            minute: Math.floor((seconds % (60 * 60)) / 60),
            second: Math.floor(seconds % 60)
        };

    ['day', 'hour', 'minute', 'second'].forEach((key) => {
        if (['day', 'hour'].includes(key) && time[key] === 0) {
            return;
        }

        text += ` ${time[key]} ${key[0].toUpperCase() + key.slice(1)}${time[key] === 1 ? '' : 's'}`;
    });

    return text;
}

function update(time, url) {
    raf(() => {
        timer.innerHTML = text(time, url);

        update(time, url);
    });
}


init().catch(e => console.error(e));

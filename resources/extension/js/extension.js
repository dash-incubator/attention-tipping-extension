const bip70 = require('./bip70');
const browser = require('webextension-polyfill');
const raf = require('./raf');
const storage = require('./storage');
const uri = require('./uri');


let el = {
    address: document.getElementById('address'),
    message: document.getElementById('message'),
    qr: document.getElementById('qr'),
    timer: document.getElementById('timer')
};


async function init() {
    browser.tabs.query({ active: true, lastFocusedWindow: true })
        .then(async (tabs) => {
            let url = (tabs[0].url || '').split('://')[1];

            update(await storage.get(url), url);
        });

    browser.tabs.executeScript({ allFrames: false, code: `(document.body || {}).innerHTML || ''`, runAt: 'document_start' })
        .then(async (result) => {
            let address = uri.find(result[0]);

            el.address.innerHTML = !address ? 'No Dash address found :(' : `
                <div>
                    <b>Dash Address Found!</b> <br>
                    ${address}
                </div>
            `;

            // Payment Server BIP70 Generator
            await bip70.get(address, (response) => {
                if (response.complete) {
                    el.qr.src = '';
                    el.message.innerHTML = 'Tip sent!';
                }
                else {
                    el.qr.src = response.qr;
                }
            });
        });
}

function update(start, url) {
    raf(() => {
        let seconds = Math.floor(Date.now() / 1000) - start,
            html = `<span class='row'>Time spent on <b class='--padding-left --padding-100'>${url}</b></span>`,
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

            html += ` ${time[key]} ${key[0].toUpperCase() + key.slice(1)}${time[key] === 1 ? '' : 's'}`;
        });

        el.timer.innerHTML = html;

        setTimeout(() => {
            update(start, url);
        }, 500);
    });
}


init().catch(e => console.error(e));

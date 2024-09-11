import InputManager from './modules/InputManager.js';
import FileManager from './modules/FileManager.js';
import fs from 'fs';
import Chess from './modules/Chess.js';
import Logger from './modules/Logger.js';
import inquirer from 'inquirer';

const counters = {
    generated: 0,
    errors: 0
}

const proxies = fs.readFileSync('./proxies.txt', 'utf-8').split('\n').map((x) => x.replace(/\r/g, '')).filter(Boolean);

const ProxyInputManager = new InputManager(proxies, { loop: true })
const PromoFileManager = new FileManager('./generated-promos.txt')

const Thread = (id) => new Promise(async(resolve) => {
    while(true) {
        const proxy = await ProxyInputManager.getNextLine()
        if(!proxy) {
            Logger.log('WARN', 'Running proxyless', { thread: id })
        }

        const ChessInstance = new Chess(proxy)

        try{
            const memberUUID = await ChessInstance.fetchMemberUUID()
            const code = await ChessInstance.fetchPromo(memberUUID)
            
            const promoLink = `https://promos.discord.gg/${code}`

            Logger.log('SUCCESS', 'Generated Promo', { thread: id, link: promoLink })
            counters.generated += 1

            await PromoFileManager.writeLine(promoLink)
        }catch(e) {
            counters.errors += 1
            Logger.log('ERR', e.message || e, { thread: id })
        }

        ChessInstance.client.terminate().catch(() => null)
    }
})

process.title = `Chess Promo Generator - @Socket`

console.clear();
const threads = await inquirer.prompt({
    type: 'number',
    name: 'threads',
    message: 'How many threads would you like to run?',
}).then(({ threads }) => {
    return threads
})

for(let i = 0; i < threads; i++) {
    Thread(i + 1)
}

setInterval(() => {
    process.title = `Chess Promo Generator - @Socket | Generated: ${counters.generated} - Errors: ${counters.errors} - Voidproxies.com`
}, 500)
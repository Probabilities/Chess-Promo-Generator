import TLSClient from 'tlsclientwrapper';
import path from 'path';
import crypto from 'crypto';

const clientPath = path.join(process.cwd(), 'tls-client-windows-64.dll')

class Chess {
    constructor(proxy = null) {
        if(proxy && !proxy.startsWith('http'))
            proxy = 'http://' + proxy

        this.client = new TLSClient({
            customLibraryPath: clientPath,
            tlsClientIdentifier: 'cloudscraper',
            withRandomTLSExtensionOrder: false,
            timeoutSeconds: 10,
            ...proxy && { proxyUrl: proxy },
        })

        this.headers = {
            host: 'www.chess.com',
            connection: 'keep-alive',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'sec-gpc': '1',
            'accept-language': 'en-GB,en;q=0.8',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Brave";v="128"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        }
    }

    __send_request = (url, opts = {}) => new Promise(async (resolve, reject) => {
        const RETRIES = 5

        this.agent && (opts.dispatcher = this.agent)

        const method = (opts.method || 'GET').toLowerCase()

        const errors = []
        for (let i = 0; i < RETRIES; i++) {
            try {
                const response = await this.client[method](url, opts?.body ?? opts, method == 'get' ? {} : opts);

                if (!response || response?.status == 0) {
                    continue
                }

                try {
                    response.body = JSON.parse(response.body)
                } catch { }

                resolve(response)
            } catch (e) {
                errors.push(e.message || 'Unknown error')
            }
        }

        reject(
            `Max retries exceeded. Errors: ${errors.join(', ')}`
        )
    })

    createUsername = () => new Promise(async(resolve, reject) => {
        try{
            const res = await this.__send_request('https://randomuser.me/api/?nat=us')

            const body = res?.body
            
            const firstName = body?.results?.[0]?.name?.first
            const lastName = body?.results?.[0]?.name?.last

            if(!firstName || !lastName)
                throw new Error('Failed to fetch username')

            resolve(`${firstName}${lastName}`)
        }catch(e) {
            reject(e)
        }
    })

    fetchMemberUUID = () => new Promise(async (resolve, reject) => {
        try{
            const name = await this.createUsername()

            const res = await this.__send_request(`https://www.chess.com/member/${name}`, {
                headers: this.headers
            })
    
            const body = res?.body

            const uuid = body.match(/data-user-uuid=\"(.*?)\"/)?.[1]
            if(!uuid)
                throw new Error('Failed to fetch member UUID')

            resolve(uuid)
        }catch(e) {
            reject(e)
        }
    })

    fetchPromo = (memberId) => new Promise(async (resolve, reject) => {
        try{
            const res = await this.__send_request('https://www.chess.com/rpc/chesscom.partnership_offer_codes.v1.PartnershipOfferCodesService/RetrieveOfferCode', {
                method: 'POST',
                headers: Object.assign(this.headers, {
                    'content-type': 'application/json'
                }),
                body: JSON.stringify({
                    userUuid: memberId,
                    campaignId: '4daf403e-66eb-11ef-96ab-ad0a069940ce'
                })
            })

            const body = res?.body
            const code = body?.codeValue
            if(!code)
                throw new Error('Failed to fetch promo code')

            resolve(code)
        }catch(e) {
            reject(e)
        }
    })
}

export default Chess;

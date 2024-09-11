import chalk from 'chalk';
import moment from 'moment';

const colors = {
    blue: {
        fg: chalk.blueBright,
        bg: chalk.bgBlueBright
    },
    green: {
        fg: chalk.hex('#62c073'),
        bg: chalk.bgHex('#62c073')
    },
    red: {
        fg: chalk.redBright,
        bg: chalk.bgRedBright
    },
    orange: {
        fg: chalk.hex('#FFA500'),
        bg: chalk.bgHex('#FFA500')
    },
    purple: {
        fg: chalk.hex('#8a2be2'),
        bg: chalk.bgHex('#8a2be2')
    }
}

class Logger {
    static log(type, message, data = '', config = { parseNumber: false, processLine: false }) {
        let logColor = colors.blue

        switch (type) {
            case 'WARN':
                logColor = colors.orange
                break
            case 'ERR':
            case 'BAD':
                logColor = colors.red
                break
            case 'INF':
                logColor = colors.green
                break
            case 'DONE':
                logColor = colors.purple
                break
        }

        const timestamp = logColor.fg(moment().format('HH:mm:ss'));

        if (data) {
            data = Object.keys(data).map((x) => {
                if (typeof data[x] === 'object') data[x] = JSON.stringify(data[x])
                if (!data[x] && data[x] != 0) data[x] = 'No value found'
                return `${chalk.grey(x)} [${logColor.fg(data[x])}]`
            }).join(', ')

            data = `> ${data}`
        }

        // Formats all numbers automatically
        const messageNumbers = message?.match(/\d+/g)

        if (messageNumbers && config.parseNumber) {
            message = message.replace(/\d+/g, (match) => {
                return Number(match).toLocaleString('en-US');
            });
        }

        const dataNumbers = data.match(/\d+/g)

        if (dataNumbers && config.parseNumber) {
            data = data.replace(/\d+/g, (match) => {
                return Number(match).toLocaleString('en-US');
            });
        }

        const toLog = chalk.bold(chalk.whiteBright(` [${timestamp}] ${this.id ? ' | ' : ''}[${logColor.bg(type)}] ${logColor.fg('>')} ${chalk.grey(message)} ${data}`))
        if (type == 'PROMPT')
            return toLog

        config.processLine ? process.stdout.write(toLog + '\r') : console.log(toLog)
    }
}

export default Logger;
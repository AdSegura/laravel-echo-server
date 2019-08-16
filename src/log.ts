import {FsUtils} from "./utils/fsUtils";
var colors = require('colors');

const options = FsUtils.getConfigfile();


colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'cyan',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red',
    h1: 'grey',
    h2: 'yellow'
});

export class Log {
    /**
     * Console log heading 1.
     *
     * @param  {string|object} message
     * @param force
     * @return {void}
     */
    static title(message: any, force: boolean = false): void {
        if(force) {
            console.log(colors.bold(message));
            return;
        }

        if(options.devMode)
            console.log(colors.bold(message));
    }

    /**
     * Console log heaing 2.
     *
     * @param  {string|object} message
     * @param force
     * @return {void}
     */
    static subtitle(message: any, force: boolean = false): void {

        if(force) {
            console.log(colors.h2.bold(message));
            return;
        }

        if(options.devMode)
            console.log(colors.h2.bold(message));
    }

    /**
     * Console log info.
     *
     * @param  {string|object} message
     * @param force
     * @return {void}
     */
    static info(message: any, force: boolean = false): void {
        if(force) {
            console.log(colors.info(message));
            return;
        }

        if(options.devMode)
            console.log(colors.info(message));
    }

    /**
     * Console log success.
     *
     * @param  {string|object} message
     * @param force
     * @return {void}
     */
    static success(message: any, force: boolean = false): void {
        if(force) {
            console.log(colors.green('\u2714 '), message);
            return;
        }
        if(options.devMode)
            console.log(colors.green('\u2714 '), message);
    }

    /**
     *
     *
     * Console log info.
     *
     * @param  {string|object} message
     * @param force
     * @return {void}
     */
    static error(message: any, force: boolean = false): void {
        if(force) {
            console.log(colors.error(message));
            return;
        }
        if(options.devMode)
            console.log(colors.error(message));
    }

    /**
     * Console log warning.
     *
     * @param  {string|object} message
     * @param force
     * @return {void}
     */
    static warning(message: any, force: boolean = false): void {
        if(force) {
            console.log(colors.warn('\u26A0 ' + message));
            return;
        }
        if(options.devMode)
            console.log(colors.warn('\u26A0 ' + message));
    }
}

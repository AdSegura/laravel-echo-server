const path = require('path');

/**
 * Fs Utils
 */
export class FsUtils {

    /**
     * Load config file
     */
    static getConfigfile (): any {

        return require(path.resolve(__dirname, '../../laravel-echo-server.json'));

    }
}

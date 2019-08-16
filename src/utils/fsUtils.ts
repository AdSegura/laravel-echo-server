const fs = require('fs');
const path = require('path');

import {options} from '../default-options';

/**
 * Fs Utils
 */
export class FsUtils {

    /**
     * Load config file
     */
    static getConfigfile (): any {

        const config_file = path.resolve(__dirname, '../../laravel-echo-server.json');

        if (fs.existsSync(config_file)) {
            return require(config_file);
        } else {
            return options;
        }

    }
}

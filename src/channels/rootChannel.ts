import {BaseAuthChannel} from "./baseAuthChannel";
import {Logger} from "../log/logger";

export class RootChannel extends BaseAuthChannel {

    /**
     * Create a new private channel instance.
     */
    constructor(options: any, log: Logger) {
        super(options, log);
    }

}

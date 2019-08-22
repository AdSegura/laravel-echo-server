import {BaseAuthChannel} from "./baseAuthChannel";
import {Logger} from "../log/logger";

export class PrivateChannel extends BaseAuthChannel {

    /**
     * Create a new private channel instance.
     */
    constructor(protected options: any, protected log: Logger) {
        super(options, log)
    }
}

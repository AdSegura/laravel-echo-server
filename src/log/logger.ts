import {Log_interface} from "./log_interface";
import {Bunyan} from "./bunyan";

export class Logger implements Log_interface {

    /** log driver */
    private driver: Bunyan;

    /**
     * Create a new Mongo database instance.
     */
    constructor(private options: any) {
        this.driver = new Bunyan(this.options);
    }

    error(data: any): void {
        this.driver.error(data);
    }

    info(data: any): void {
        this.driver.info(data);
    }

}

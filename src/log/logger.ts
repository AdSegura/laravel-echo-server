import {Log_interface} from "./log_interface";
import {Bunyan} from "./bunyan";

export class Logger implements Log_interface {

    /** log driver */
    private driver: Bunyan;

    /** server id here logs coming from */
    private serverId: string;

    /**
     * Create a new Mongo database instance.
     */
    constructor(private options: any) {
        this.driver = new Bunyan(this.options);
    }

    public setServerId(id: string): void{
        if(this.serverId) return;

        this.serverId = id;
    }

   public error(data: any): void {
        this.driver.error(`server_id: ${this.serverId}| ${data}`);
    }

   public info(data: any): void {
        this.driver.info(`server_id: ${this.serverId}| ${data}`);
    }

}

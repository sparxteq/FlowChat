

export abstract class Log {
            /**
         * start a new section of the log and increases the nesting level
         * @param sectionName the name of a new nested section of the log
         */
    abstract start(sectionName:string):void;
        /**
         * closes a section of the log and decreases the nesting level.
         * @param sectionName the name of the log section to be closed
         */
    abstract end(sectionName:string):void;
        /**
         * Adds a persistant message to the log
         * @param text the message to be added
         * @param data optional data about the message
         */
    abstract msg(text:string,data?:any):void;
        /**
         * Adds an ephemeral (non-persistant) message to the log. 
         * If it was preceeded immediately by another status message that previous
         * message is removed.
         * @param text the text of the message
         */
    abstract status(text:string):void;
        /**
         * Wraps up the log with success / failure
         * @param success true if the process ended successfully
         */
    abstract done(success:boolean):void;
}
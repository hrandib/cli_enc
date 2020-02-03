export interface ICommand {
    command: string;
    params: string[];
}
/**
 * parse one line of cue sheet, and return COMMAND
 * and all parameters
 */
export declare function parseCommand(line: string): ICommand;

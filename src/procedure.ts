export abstract class AbstractProcedure {
  abstract execute(...args: any): Promise<void>;
}

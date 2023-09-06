export abstract class Procedure {
  abstract execute(...args: any): Promise<void>;
}

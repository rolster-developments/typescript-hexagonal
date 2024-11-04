export abstract class AbstractEntityDatabase {
  abstract connect(): Promise<void>;

  abstract disconnect(all?: boolean): Promise<void>;

  abstract transaction(): Promise<void>;

  abstract commit(): Promise<void>;

  abstract rollback(): Promise<void>;
}

export abstract class EntityDatabase {
  abstract connect(): Promise<void>;

  abstract disconnect(full?: boolean): Promise<void>;

  abstract transaction(): Promise<void>;

  abstract commit(): Promise<void>;

  abstract rollback(): Promise<void>;
}

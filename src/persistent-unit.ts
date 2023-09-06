export abstract class PersistentUnit {
  abstract flush(): Promise<void>;

  abstract flushAsync(): Promise<void>;
}

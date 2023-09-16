export abstract class PersistentUnit {
  abstract flush(): Promise<void>;
}

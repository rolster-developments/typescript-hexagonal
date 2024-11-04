export abstract class AbstractPersistentUnit {
  abstract flush(): Promise<void>;
}

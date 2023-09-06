import { Optional } from '@rolster/typescript-utils';
import { Entity } from './entity';

export abstract class Repository<T extends Entity> {
  abstract persist(entity: T): Promise<void>;

  abstract findByUuid(uuid: string): Promise<Optional<T>>;

  abstract findAll(): Promise<T[]>;

  abstract destroy(entity: T): Promise<void>;
}

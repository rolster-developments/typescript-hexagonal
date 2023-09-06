import { EntityManager } from './entity-manager';
import { Entity } from './entity';
import { BaseModel } from './model';

export abstract class EntityLink<E extends Entity, M extends BaseModel> {
  constructor(public readonly entity: E, public readonly bindable = true) {}

  public abstract createModel(manager: EntityManager): M | Promise<M>;
}

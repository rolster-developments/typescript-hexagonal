import { Entity } from './entity';
import { BaseModel } from './model';

export abstract class EntityUpdate<E extends Entity, M extends BaseModel> {
  constructor(
    public readonly entity: E,
    public readonly model: M,
    public readonly bindable = true
  ) {}

  public abstract update(): void;
}

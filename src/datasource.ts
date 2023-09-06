import { ModelDirty } from './entity-sync';
import { Procedure } from './procedure';
import { BaseModel, ModelHidden } from './model';

export abstract class EntityDataSource {
  abstract insert(model: BaseModel): Promise<void>;

  abstract update(model: BaseModel, dirty?: ModelDirty): Promise<void>;

  abstract delete(model: BaseModel): Promise<void>;

  abstract hidden(model: ModelHidden): Promise<void>;

  abstract procedure(procedure: Procedure): Promise<void>;
}

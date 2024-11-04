import { AbstractProcedure } from './procedure';
import { AbstractModel, DirtyModel, HiddenModel } from './types';

export abstract class AbstractEntityDataSource {
  abstract insert(model: AbstractModel): Promise<void>;

  abstract update(model: AbstractModel, dirty?: DirtyModel): Promise<void>;

  abstract delete(model: AbstractModel): Promise<void>;

  abstract hidden(model: HiddenModel): Promise<void>;

  abstract procedure(procedure: AbstractProcedure): Promise<void>;
}

import { Entity } from './entity';
import { BaseModel, ModelUpdated } from './model';

export type ModelDirty = Record<string, any>;

export abstract class EntitySync<E extends Entity, M extends BaseModel> {
  private firstStatus: ModelDirty;

  constructor(
    public readonly entity: E,
    public readonly model: M,
    public readonly bindable = true
  ) {
    this.firstStatus = this.mapModel(model);
  }

  public abstract sync(): void;

  public verify(): Undefined<ModelDirty> {
    this.sync();

    return this.getDirty();
  }

  private mapModel(model: M): ModelDirty {
    const dirty: ModelDirty = {};

    Object.keys(model).forEach((key) => {
      dirty[key] = (model as any)[key];
    });

    return dirty;
  }

  private getDirty(): Undefined<ModelDirty> {
    const currentStatus = this.mapModel(this.model);

    const modelDirty: ModelDirty = {};

    let dirty = false;

    Object.keys(currentStatus).forEach((key) => {
      if (currentStatus[key] !== this.firstStatus[key]) {
        dirty = true;
        modelDirty[key] = currentStatus[key];
      }
    });

    if (isUpdated(this.model)) {
      modelDirty['updatedAt'] = new Date();
    }

    return dirty ? modelDirty : undefined;
  }
}

function isUpdated(model: any): model is ModelUpdated {
  return 'updatedAt' in model;
}

import {
  AbstractEntity,
  AbstractModel,
  DirtyModel,
  QueryEntityManager,
  UpdateModel
} from './types';

function modelIsUpdated(model: any): model is UpdateModel {
  return typeof model === 'object' && 'updatedAt' in model;
}

export class Entity implements AbstractEntity {
  constructor(public readonly uuid: string) {}
}

export abstract class EntityUpdate<
  E extends AbstractEntity,
  M extends AbstractModel
> {
  constructor(
    public readonly entity: E,
    public readonly model: M,
    public readonly bindable = true
  ) {}

  public abstract update(): void;
}

export abstract class EntityLink<
  E extends AbstractEntity,
  M extends AbstractModel
> {
  constructor(
    public readonly entity: E,
    public readonly bindable = true
  ) {}

  public abstract create(manager: QueryEntityManager): M | Promise<M>;
}

export abstract class EntitySync<
  E extends AbstractEntity,
  M extends AbstractModel
> {
  private firstDirty: DirtyModel;

  constructor(
    public readonly entity: E,
    public readonly model: M,
    public readonly bindable = true
  ) {
    this.firstDirty = this.createDirtyFromModel(model);
  }

  public abstract sync(): void;

  public verify(): Undefined<DirtyModel> {
    this.sync();

    return this.createDirty();
  }

  private createDirtyFromModel(model: M): DirtyModel {
    const dirty: DirtyModel = {};

    Object.keys(model).forEach((key) => {
      dirty[key] = (model as any)[key];
    });

    return dirty;
  }

  private createDirty(): Undefined<DirtyModel> {
    const currentDirty = this.createDirtyFromModel(this.model);
    const finalDirty: DirtyModel = {};

    Object.keys(currentDirty).forEach((key) => {
      if (currentDirty[key] !== this.firstDirty[key]) {
        finalDirty[key] = currentDirty[key];
      }
    });

    const requiredUpdate = Object.keys(finalDirty).length > 0;

    if (requiredUpdate && modelIsUpdated(this.model)) {
      finalDirty['updatedAt'] = new Date();
    }

    return requiredUpdate ? finalDirty : undefined;
  }
}

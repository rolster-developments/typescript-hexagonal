import { Optional, fromPromise } from '@rolster/commons';
import { EntityDataSource } from './datasource';
import { EntityLink } from './entity-link';
import { EntitySync, ModelDirty } from './entity-sync';
import { EntityUpdate } from './entity-update';
import { Entity } from './entity';
import { BaseModel, ModelHidden } from './model';
import { Procedure } from './procedure';

type BaseEntityLink = EntityLink<Entity, BaseModel>;
type BaseEntityUpdate = EntityUpdate<Entity, BaseModel>;
type BaseEntitySync = EntitySync<Entity, BaseModel>;

type SyncPromise = {
  dirty: ModelDirty;
  model: BaseModel;
};

export abstract class EntityManager {
  abstract persist(link: BaseEntityLink): void;

  abstract update(update: BaseEntityUpdate): void;

  abstract sync(sync: BaseEntitySync): void;

  abstract destroy(entity: Entity): void;

  abstract procedure(procedure: Procedure): void;

  abstract relation(entity: Entity, model: BaseModel): void;

  abstract link<E extends Entity>(entity: E, model: BaseModel): E;

  abstract select<T extends BaseModel>(entity: Entity): Optional<T>;

  abstract flush(): Promise<void>;

  abstract dispose(): void;
}

export class RolsterEntityManager implements EntityManager {
  private relations: Map<string, BaseModel>;

  private links: BaseEntityLink[] = [];

  private updates: BaseEntityUpdate[] = [];

  private syncs: BaseEntitySync[] = [];

  private destroys: BaseModel[] = [];

  private hiddens: ModelHidden[] = [];

  private procedures: Procedure[] = [];

  constructor(private source: EntityDataSource) {
    this.relations = new Map<string, BaseModel>();
  }

  public persist(link: BaseEntityLink): void {
    this.links.push(link);
  }

  public update(update: BaseEntityUpdate): void {
    const { bindable, entity, model } = update;

    if (bindable) {
      this.relation(entity, model);
    }

    this.updates.push(update);
  }

  public sync(sync: BaseEntitySync): void {
    const { bindable, entity, model } = sync;

    if (bindable) {
      this.relation(entity, model);
    }

    this.syncs.push(sync);
  }

  public destroy(entity: Entity): void {
    this.select(entity).present((model) => {
      isHidden(model) ? this.hiddens.push(model) : this.destroys.push(model);
    });
  }

  public procedure(procedure: Procedure): void {
    this.procedures.push(procedure);
  }

  public relation({ uuid }: Entity, model: BaseModel): void {
    this.relations.set(uuid, model);
  }

  public link<E extends Entity>(entity: E, model: BaseModel): E {
    this.relation(entity, model);

    return entity;
  }

  public select<T extends BaseModel>({ uuid }: Entity): Optional<T> {
    return Optional.build(
      this.relations.has(uuid) ? (this.relations.get(uuid) as T) : undefined
    );
  }

  public async flush(): Promise<void> {
    await this.persistAll();
    await this.updateAll();
    await this.syncAll();
    await this.hiddenAll();
    await this.destroyAll();
    await this.procedureAll();

    this.dispose();
  }

  public dispose(): void {
    this.relations.clear();

    this.links = [];
    this.updates = [];
    this.syncs = [];
    this.destroys = [];
    this.hiddens = [];
    this.procedures = [];
  }

  private persistAll(): Promise<void[]> {
    const { links, source } = this;

    return Promise.all(
      links.map((link) =>
        fromPromise(link.createModel(this)).then((model) => {
          const { bindable, entity } = link;

          if (bindable) {
            this.relation(entity, model);
          }

          return source.insert(model);
        })
      )
    );
  }

  private updateAll(): Promise<void[]> {
    const { source, updates } = this;

    return Promise.all(updates.map(({ model }) => source.update(model)));
  }

  private syncAll(): Promise<void[]> {
    const { destroys, source, syncs } = this;

    return Promise.all(
      syncs
        .filter(({ model }) => !destroys.includes(model))
        .reduce((syncs: SyncPromise[], sync) => {
          const dirty = sync.verify();

          if (dirty) {
            const { model } = sync;

            syncs.push({ model, dirty });
          }

          return syncs;
        }, [])
        .map(({ model, dirty }) => source.update(model, dirty))
    );
  }

  private destroyAll(): Promise<void[]> {
    const { destroys, source } = this;

    return Promise.all(destroys.map((destroy) => source.delete(destroy)));
  }

  private hiddenAll(): Promise<void[]> {
    const { hiddens, source } = this;

    return Promise.all(hiddens.map((hidden) => source.hidden(hidden)));
  }

  private procedureAll(): Promise<void[]> {
    const { procedures, source } = this;

    return Promise.all(
      procedures.map((procedure) => source.procedure(procedure))
    );
  }
}

function isHidden(model: any): model is ModelHidden {
  return 'hidden' in model && 'hiddenAt' in model;
}

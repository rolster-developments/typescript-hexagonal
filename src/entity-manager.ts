import { Optional, fromPromise } from '@rolster/commons';
import { AbstractEntityDataSource } from './datasource';
import { EntityLink, EntitySync, EntityUpdate } from './entity';
import {
  AbstractModel,
  DirtyModel,
  AbstractEntity,
  ModelHideable,
  QueryEntityManager
} from './types';
import { AbstractProcedure } from './procedure';

type ManagerLink = EntityLink<AbstractEntity, AbstractModel>;
type ManagerUpdate = EntityUpdate<AbstractEntity, AbstractModel>;
type ManagerSync = EntitySync<AbstractEntity, AbstractModel>;
type SyncPromise = [AbstractModel, DirtyModel];

function modelIsHidden(model: any): model is ModelHideable {
  return typeof model === 'object' && 'hidden' in model && 'hiddenAt' in model;
}

export abstract class AbstractEntityManager implements QueryEntityManager {
  abstract persist(link: ManagerLink): void;

  abstract update(update: ManagerUpdate): void;

  abstract sync(sync: ManagerSync): void;

  abstract destroy(entity: AbstractEntity): void;

  abstract procedure(procedure: AbstractProcedure): void;

  abstract relation(entity: AbstractEntity, model: AbstractModel): void;

  abstract link<E extends AbstractEntity>(entity: E, model: AbstractModel): E;

  abstract select<T extends AbstractModel>(entity: AbstractEntity): Optional<T>;

  abstract flush(): Promise<void>;

  abstract dispose(): void;
}

export class EntityManager implements AbstractEntityManager {
  private relations: Map<string, AbstractModel>;

  private links: ManagerLink[] = [];

  private updates: ManagerUpdate[] = [];

  private syncs: ManagerSync[] = [];

  private destroys: AbstractModel[] = [];

  private hiddens: ModelHideable[] = [];

  private procedures: AbstractProcedure[] = [];

  constructor(private source: AbstractEntityDataSource) {
    this.relations = new Map<string, AbstractModel>();
  }

  public persist(link: ManagerLink): void {
    this.links.push(link);
  }

  public update(update: ManagerUpdate): void {
    const { bindable, entity, model } = update;

    if (bindable) {
      this.relation(entity, model);
    }

    this.updates.push(update);
  }

  public sync(sync: ManagerSync): void {
    const { bindable, entity, model } = sync;

    if (bindable) {
      this.relation(entity, model);
    }

    this.syncs.push(sync);
  }

  public destroy(entity: AbstractEntity): void {
    this.select(entity).present((model) => {
      modelIsHidden(model)
        ? this.hiddens.push(model)
        : this.destroys.push(model);
    });
  }

  public procedure(procedure: AbstractProcedure): void {
    this.procedures.push(procedure);
  }

  public relation({ uuid }: AbstractEntity, model: AbstractModel): void {
    this.relations.set(uuid, model);
  }

  public link<E extends AbstractEntity>(entity: E, model: AbstractModel): E {
    this.relation(entity, model);

    return entity;
  }

  public select<M extends AbstractModel>({ uuid }: AbstractEntity): Optional<M> {
    return Optional.build(
      this.relations.has(uuid) ? (this.relations.get(uuid) as M) : undefined
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
        fromPromise(link.create(this)).then((model) => {
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

            syncs.push([model, dirty]);
          }

          return syncs;
        }, [])
        .map(([model, dirty]) => source.update(model, dirty))
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

import { Optional, fromPromise } from '@rolster/commons';
import { AbstractEntityDataSource } from './datasource';
import { EntityLink, EntitySync, EntityRefresh } from './entity';
import {
  AbstractModel,
  DirtyModel,
  AbstractEntity,
  ModelHideable,
  QueryEntityManager
} from './types';
import { AbstractProcedure } from './procedure';

type ManagerLinkOptions = EntityLink<AbstractEntity, AbstractModel>;
type ManagerRefreshOptions = EntityRefresh<AbstractEntity, AbstractModel>;
type ManagerSyncOptions = EntitySync<AbstractEntity, AbstractModel>;
type SyncPromise = [AbstractModel, DirtyModel];

function itIsModelHidden(model: any): model is ModelHideable {
  return typeof model === 'object' && 'hidden' in model && 'hiddenAt' in model;
}

export abstract class AbstractEntityManager implements QueryEntityManager {
  abstract persist(options: ManagerLinkOptions): void;

  abstract refresh(options: ManagerRefreshOptions): void;

  abstract sync(options: ManagerSyncOptions): void;

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

  private links: ManagerLinkOptions[] = [];

  private refreshs: ManagerRefreshOptions[] = [];

  private syncs: ManagerSyncOptions[] = [];

  private destroys: AbstractModel[] = [];

  private hiddens: ModelHideable[] = [];

  private procedures: AbstractProcedure[] = [];

  constructor(private source: AbstractEntityDataSource) {
    this.relations = new Map<string, AbstractModel>();
  }

  public persist(options: ManagerLinkOptions): void {
    this.links.push(options);
  }

  public refresh(options: ManagerRefreshOptions): void {
    options.bindable && this.relation(options.entity, options.model);

    this.refreshs.push(options);
  }

  public sync(options: ManagerSyncOptions): void {
    options.bindable && this.relation(options.entity, options.model);

    this.syncs.push(options);
  }

  public destroy(entity: AbstractEntity): void {
    this.select(entity).present((model) => {
      itIsModelHidden(model)
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

  public select<M extends AbstractModel>({
    uuid
  }: AbstractEntity): Optional<M> {
    return Optional.build(
      this.relations.has(uuid) ? (this.relations.get(uuid) as M) : undefined
    );
  }

  public async flush(): Promise<void> {
    await this.persistAll();
    await this.refreshAll();
    await this.syncAll();
    await this.hiddenAll();
    await this.destroyAll();
    await this.procedureAll();

    this.dispose();
  }

  public dispose(): void {
    this.relations.clear();

    this.links = [];
    this.refreshs = [];
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

  private refreshAll(): Promise<void[]> {
    return Promise.all(
      this.refreshs.map(({ model }) => this.source.refresh(model))
    );
  }

  private syncAll(): Promise<void[]> {
    return Promise.all(
      this.syncs
        .filter(({ model }) => !this.destroys.includes(model))
        .reduce((syncs: SyncPromise[], sync) => {
          const dirty = sync.verify();

          dirty && syncs.push([sync.model, dirty]);

          return syncs;
        }, [])
        .map(([model, dirty]) => {
          return this.source.refresh(model, dirty);
        })
    );
  }

  private destroyAll(): Promise<void[]> {
    return Promise.all(
      this.destroys.map((destroy) => this.source.delete(destroy))
    );
  }

  private hiddenAll(): Promise<void[]> {
    return Promise.all(
      this.hiddens.map((hidden) => this.source.hidden(hidden))
    );
  }

  private procedureAll(): Promise<void[]> {
    return Promise.all(
      this.procedures.map((procedure) => this.source.procedure(procedure))
    );
  }
}

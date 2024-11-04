import { Optional } from '@rolster/commons';

export type DirtyModel = Record<string, any>;

export interface AbstractModel {
  id: number;
}

export interface UpdateModel extends AbstractModel {
  updatedAt?: Date;
}

export interface HiddenModel extends AbstractModel {
  hidden: boolean;
  hiddenAt?: Date;
}

export interface Model extends HiddenModel {
  updatedAt?: Date;
}

export interface AbstractEntity {
  readonly uuid: string;
}

export interface QueryEntityManager {
  select<T extends AbstractModel>(entity: AbstractEntity): Optional<T>;
}

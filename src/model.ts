export interface BaseModel {
  id: number;
}

export interface ModelUpdated extends BaseModel {
  updatedAt?: Date;
}

export interface ModelHidden extends BaseModel {
  hidden: boolean;
  hiddenAt?: Date;
}

export interface Model extends ModelHidden {
  updatedAt?: Date;
}

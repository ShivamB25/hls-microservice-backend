declare module 'mongoose-paginate-v2' {
  import mongoose from 'mongoose';

  interface PaginateOptions {
    select?: object | string;
    sort?: object | string;
    populate?: object[] | string[] | object | string;
    lean?: boolean;
    leanWithId?: boolean;
    offset?: number;
    page?: number;
    limit?: number;
    customLabels?: object;
    pagination?: boolean;
    projection?: any;
  }

  interface PaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    page?: number;
    totalPages: number;
    offset: number;
    prevPage?: number;
    nextPage?: number;
    pagingCounter: number;
    meta?: any;
  }

  type PaginateModel<T extends mongoose.Document> = mongoose.Model<T> & {
    paginate: (query?: object, options?: PaginateOptions, callback?: (err: any, result: PaginateResult<T>) => void) => Promise<PaginateResult<T>>;
  };

  const _: (schema: mongoose.Schema) => void;
  export = _;
}
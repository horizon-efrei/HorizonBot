declare module 'mongoose-autopopulate' {
  import type { Schema } from 'mongoose';

  // eslint-disable-next-line import/no-default-export
  export default function mongooseAutoPopulate(schema: Schema): void;
}

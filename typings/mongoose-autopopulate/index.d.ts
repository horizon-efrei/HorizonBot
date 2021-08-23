declare module 'mongoose-autopopulate' {
  import type { Schema } from 'mongoose';

  export default function mongooseAutoPopulate(schema: Schema): void;
}

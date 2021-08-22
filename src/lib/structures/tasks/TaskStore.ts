import { Store } from '@sapphire/pieces';
import type { Constructor } from '@sapphire/utilities';
import Task from './Task';

export default class TaskStore extends Store<Task> {
  constructor() {
    super(Task as Constructor<Task>, { name: 'tasks' });
  }
}

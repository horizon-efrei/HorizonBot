import { Store } from '@sapphire/framework';
import type { Constructor } from '@sapphire/utilities';
import { Task } from '@/structures/tasks/Task';

export class TaskStore extends Store<Task> {
  constructor() {
    super(Task as unknown as Constructor<Task>, { name: 'tasks' });
  }
}

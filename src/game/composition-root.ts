import type { IInputPort } from '@application/ports/IInputPort';
import type { ILevelRepository } from '@application/ports/ILevelRepository';
import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import { PlaceholderInputAdapter } from '@infrastructure/adapters/PlaceholderInputAdapter';
import { PlaceholderLevelRepository } from '@infrastructure/adapters/PlaceholderLevelRepository';
import { PlaceholderPhysicsAdapter } from '@infrastructure/adapters/PlaceholderPhysicsAdapter';

export interface AppDependencies {
  inputPort: IInputPort;
  physicsPort: IPhysicsPort;
  levelRepository: ILevelRepository;
}

export function createAppDependencies(): AppDependencies {
  return {
    inputPort: new PlaceholderInputAdapter(),
    physicsPort: new PlaceholderPhysicsAdapter(),
    levelRepository: new PlaceholderLevelRepository(),
  };
}

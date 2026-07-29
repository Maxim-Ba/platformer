import { DASH_DURATION_MS } from '@domain/constants/dash';
import { DashRules } from '@domain/services/DashRules';

import type { IDashPort } from '../ports/IDashPort';
import type { IHealthPort } from '../ports/IHealthPort';
import type { IProgressionPort } from '../ports/IProgressionPort';

export interface ExecuteDashInput {
  readonly dashPressed: boolean;
  readonly horizontalAxis: -1 | 0 | 1;
  readonly facingDirection: -1 | 1;
}

export interface ExecuteDashResult {
  readonly dashStarted: boolean;
}

export class ExecuteDash {
  constructor(
    private readonly dashPort: IDashPort,
    private readonly healthPort: IHealthPort,
    private readonly progressionPort: IProgressionPort,
    private readonly dashRules: DashRules = new DashRules(),
  ) {}

  execute(input: ExecuteDashInput): ExecuteDashResult {
    if (!input.dashPressed || !this.progressionPort.isUnlocked('dash')) {
      return { dashStarted: false };
    }

    const state = this.dashPort.getDashState();

    if (!this.dashRules.canStart(state)) {
      return { dashStarted: false };
    }

    const direction = this.resolveDirection(input.horizontalAxis, input.facingDirection);
    this.dashPort.startDash(direction);
    this.healthPort.grantInvulnerability(DASH_DURATION_MS);

    return { dashStarted: true };
  }

  private resolveDirection(
    horizontalAxis: -1 | 0 | 1,
    facingDirection: -1 | 1,
  ): -1 | 1 {
    if (horizontalAxis !== 0) {
      return horizontalAxis;
    }

    return facingDirection;
  }
}

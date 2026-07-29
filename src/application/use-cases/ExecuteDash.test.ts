import { describe, expect, it } from 'vitest';

import { DASH_COOLDOWN_MS, DASH_DURATION_MS } from '@domain/constants/dash';
import { InMemoryDashAdapter } from '@infrastructure/adapters/InMemoryDashAdapter';
import { InMemoryHealthAdapter } from '@infrastructure/adapters/InMemoryHealthAdapter';
import { InMemoryProgressionAdapter } from '@infrastructure/adapters/InMemoryProgressionAdapter';

import { ExecuteDash } from './ExecuteDash';

describe('ExecuteDash', () => {
  it('starts dash and grants invulnerability when unlocked', () => {
    const dashPort = new InMemoryDashAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const progressionPort = new InMemoryProgressionAdapter();
    progressionPort.addExperience(200);
    const useCase = new ExecuteDash(dashPort, healthPort, progressionPort);

    const result = useCase.execute({
      dashPressed: true,
      horizontalAxis: 1,
      facingDirection: 1,
    });

    expect(result.dashStarted).toBe(true);
    expect(dashPort.getDashState().isDashing).toBe(true);
    expect(healthPort.isInvulnerable()).toBe(true);
  });

  it('does not start dash when unlock is missing', () => {
    const dashPort = new InMemoryDashAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const progressionPort = new InMemoryProgressionAdapter();
    const useCase = new ExecuteDash(dashPort, healthPort, progressionPort);

    const result = useCase.execute({
      dashPressed: true,
      horizontalAxis: 1,
      facingDirection: 1,
    });

    expect(result.dashStarted).toBe(false);
    expect(dashPort.getDashState().isDashing).toBe(false);
    expect(healthPort.isInvulnerable()).toBe(false);
  });

  it('does not start dash while cooldown is active', () => {
    const dashPort = new InMemoryDashAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const progressionPort = new InMemoryProgressionAdapter();
    progressionPort.addExperience(200);
    const useCase = new ExecuteDash(dashPort, healthPort, progressionPort);

    useCase.execute({
      dashPressed: true,
      horizontalAxis: 1,
      facingDirection: 1,
    });

    const result = useCase.execute({
      dashPressed: true,
      horizontalAxis: 1,
      facingDirection: 1,
    });

    expect(result.dashStarted).toBe(false);
  });

  it('uses facing direction when horizontal input is neutral', () => {
    const dashPort = new InMemoryDashAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const progressionPort = new InMemoryProgressionAdapter();
    progressionPort.addExperience(200);
    const useCase = new ExecuteDash(dashPort, healthPort, progressionPort);

    useCase.execute({
      dashPressed: true,
      horizontalAxis: 0,
      facingDirection: -1,
    });

    expect(dashPort.getDashState().direction).toBe(-1);
  });

  it('allows dash again after cooldown expires', () => {
    const dashPort = new InMemoryDashAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const progressionPort = new InMemoryProgressionAdapter();
    progressionPort.addExperience(200);
    const useCase = new ExecuteDash(dashPort, healthPort, progressionPort);

    useCase.execute({
      dashPressed: true,
      horizontalAxis: 1,
      facingDirection: 1,
    });

    useCase.execute({
      dashPressed: false,
      horizontalAxis: 0,
      facingDirection: 1,
    });
    dashPort.tick(DASH_DURATION_MS + DASH_COOLDOWN_MS);

    const result = useCase.execute({
      dashPressed: true,
      horizontalAxis: 1,
      facingDirection: 1,
    });

    expect(result.dashStarted).toBe(true);
  });
});

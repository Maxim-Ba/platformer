## MODIFIED Requirements

### Requirement: World bounds clamp

Camera scroll MUST remain within level world bounds so no empty area outside the level is shown beyond documented margins.

#### Scenario: Clamp at level edges

- **WHEN** the player approaches the left, right, top, or bottom edge of the level
- **THEN** camera scroll MUST be clamped so the viewport does not show area outside `level.bounds`

#### Scenario: Clamp updates on room transition

- **WHEN** player transitions to a new room via a door
- **THEN** camera bounds MUST be updated to the new room's bounds before fade-in completes

## ADDED Requirements

### Requirement: Camera reset on room transition

`ICameraPort` MUST reset follow state when the active room changes so scroll does not carry stale state from the previous room.

#### Scenario: Reset after room swap

- **WHEN** room transition reposition completes
- **THEN** `ICameraPort.reset()` MUST be called before camera fade-in

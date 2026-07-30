export type MapValidationIssueLevel = 'error' | 'warning';

export interface MapValidationIssue {
  readonly level: MapValidationIssueLevel;
  readonly roomId: string;
  readonly message: string;
}

export interface MapFileValidationResult {
  readonly fileName: string;
  readonly roomId: string;
  readonly passed: boolean;
  readonly issues: readonly MapValidationIssue[];
}

export interface MapValidationResult {
  readonly files: readonly MapFileValidationResult[];
  readonly issues: readonly MapValidationIssue[];
  readonly errorCount: number;
  readonly warningCount: number;
}


export enum RoundingMethod {
  Floor = 'floor',
  Round = 'round',
  Ceil = 'ceil',
}

export enum Language {
  AR = 'ar',
  FR = 'fr',
  EN = 'en',
}

export interface BracketDetail {
  lower: number;
  upper: number | null;
  part: number;
  rate: number;
  tax: number;
  description: string;
}

export interface CalculationResult {
  salaire_imposable: number;
  breakdown: BracketDetail[];
  IRG_before_abattement: number;
  raw_abattement: number;
  monthly_abattement: number;
  abattement_applied_limit: 'min' | 'max' | 'none';
  IRG_final_raw: number;
  IRG_final_rounded: number;
  rounding_method: RoundingMethod;
  exempt: boolean;
  net_salary: number;
  audit: {
    timestamp: string;
    version: string;
    rules_applied: string;
  };
}

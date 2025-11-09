
import { useCallback } from 'react';
import type { CalculationResult, BracketDetail, RoundingMethod } from '../types';
import { BARÈME, ABATTEMENT_RATE, ABATTEMENT_MIN, ABATTEMENT_MAX, EXEMPTION_LIMIT } from '../constants';

const useIrgCalculator = () => {
  const calculate = useCallback((salaireImposable: number, roundingMethod: RoundingMethod): CalculationResult => {
    const audit = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      rules_applied: `barème 2025; abattement 40%, clamp ${ABATTEMENT_MIN}-${ABATTEMENT_MAX}`,
    };

    if (salaireImposable <= EXEMPTION_LIMIT) {
      return {
        salaire_imposable: salaireImposable,
        breakdown: [],
        IRG_before_abattement: 0,
        raw_abattement: 0,
        monthly_abattement: 0,
        abattement_applied_limit: 'none',
        IRG_final_raw: 0,
        IRG_final_rounded: 0,
        rounding_method: roundingMethod,
        exempt: true,
        net_salary: salaireImposable,
        audit,
      };
    }

    // Fix: Removed a block of buggy and dead code that was performing an incorrect tax calculation.
    let totalTax = 0;
    let salaryToProcess = salaireImposable;
    const detailedBreakdown: BracketDetail[] = [];

    BARÈME.forEach((tranche, index) => {
        if (salaryToProcess > tranche.lower) {
            const upper = tranche.upper ?? Infinity;
            const taxableAmountInSlice = Math.min(salaryToProcess, upper) - tranche.lower;
            const taxInSlice = taxableAmountInSlice * tranche.rate;
            totalTax += taxInSlice;

            detailedBreakdown.push({
                lower: tranche.lower,
                upper: tranche.upper,
                part: taxableAmountInSlice,
                rate: tranche.rate,
                tax: taxInSlice,
                description: tranche.upper === null ? `> ${tranche.lower.toLocaleString('fr-FR')}` : `${tranche.lower.toLocaleString('fr-FR')} - ${tranche.upper.toLocaleString('fr-FR')}`,
            });
        }
    });


    const IRG_before_abattement = totalTax;
    const raw_abattement = IRG_before_abattement * ABATTEMENT_RATE;

    let monthly_abattement = raw_abattement;
    let abattement_applied_limit: 'min' | 'max' | 'none' = 'none';

    if (raw_abattement < ABATTEMENT_MIN) {
      monthly_abattement = ABATTEMENT_MIN;
      abattement_applied_limit = 'min';
    } else if (raw_abattement > ABATTEMENT_MAX) {
      monthly_abattement = ABATTEMENT_MAX;
      abattement_applied_limit = 'max';
    }

    // Abattement should not exceed IRG
    monthly_abattement = Math.min(monthly_abattement, IRG_before_abattement);

    const IRG_final_raw = Math.max(0, IRG_before_abattement - monthly_abattement);

    let IRG_final_rounded = 0;
    switch (roundingMethod) {
      case 'floor':
        IRG_final_rounded = Math.floor(IRG_final_raw);
        break;
      case 'round':
        IRG_final_rounded = Math.round(IRG_final_raw);
        break;
      case 'ceil':
        IRG_final_rounded = Math.ceil(IRG_final_raw);
        break;
    }

    return {
      salaire_imposable: salaireImposable,
      breakdown: detailedBreakdown,
      IRG_before_abattement,
      raw_abattement,
      monthly_abattement,
      abattement_applied_limit,
      IRG_final_raw,
      IRG_final_rounded,
      rounding_method: roundingMethod,
      exempt: false,
      net_salary: salaireImposable - IRG_final_rounded,
      audit,
    };
  }, []);

  return { calculate };
};

export default useIrgCalculator;

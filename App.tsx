
import React, { useState, useEffect } from 'react';
// Fix: 'Language' was imported as a type but is also used as a value (e.g., Language.AR).
// It's moved to a regular import to allow access to enum values.
import type { CalculationResult } from './types';
import { RoundingMethod, Language } from './types';
import { I18N, CNAS_RATE } from './constants';
import useIrgCalculator from './hooks/useIrgCalculator';

const LanguageSwitcher: React.FC<{
  language: Language;
  setLanguage: (lang: Language) => void;
}> = ({ language, setLanguage }) => {
  return (
    <div className="flex items-center space-x-2">
      {(['ar', 'fr', 'en'] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            language === lang
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const CalculatorForm: React.FC<{
  t: (key: string) => string;
  onCalculate: (salary: number, rounding: RoundingMethod) => void;
  onClear: () => void;
}> = ({ t, onCalculate, onClear }) => {
  const [isGross, setIsGross] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');
  const [rounding, setRounding] = useState<RoundingMethod>(RoundingMethod.Floor);
  const [error, setError] = useState('');

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[\s,]/g, '');
    if (/^\d*\.?\d*$/.test(value)) {
      setSalaryInput(value);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseFloat(salaryInput);
    if (isNaN(salary) || salary < 0) {
      setError(t('errorInvalidInput'));
      return;
    }

    const taxableSalary = isGross ? salary - salary * CNAS_RATE : salary;
    onCalculate(taxableSalary, rounding);
  };
  
  const handleClear = () => {
    setSalaryInput('');
    setIsGross(false);
    setError('');
    onClear();
  };

  const formattedSalary = salaryInput
    ? parseFloat(salaryInput).toLocaleString('fr-FR')
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isGross ? t('grossSalary') : t('taxableSalary')}
          </label>
          <div className="relative">
            <input
              type="text"
              id="salary"
              value={formattedSalary}
              onChange={handleSalaryChange}
              placeholder={t('exampleSalary')}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex items-center pt-6">
          <input
            id="cnas"
            type="checkbox"
            checked={isGross}
            onChange={(e) => setIsGross(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="cnas" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            {t('calculateCnas')}
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('roundingMethod')}</label>
        <div className="flex flex-wrap gap-4">
          {(Object.values(RoundingMethod)).map((method) => (
            <div key={method} className="flex items-center">
              <input
                id={method}
                type="radio"
                name="rounding"
                value={method}
                checked={rounding === method}
                onChange={() => setRounding(method)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor={method} className="ms-2 block text-sm text-gray-900 dark:text-gray-300 capitalize">
                {t(method)}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-start space-x-4 rtl:space-x-reverse">
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors">
          <i className="fas fa-calculator me-2"></i> {t('calculate')}
        </button>
        <button type="button" onClick={handleClear} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors">
          <i className="fas fa-eraser me-2"></i> {t('clear')}
        </button>
      </div>
    </form>
  );
};

const ResultsDisplay: React.FC<{ result: CalculationResult; t: (key: string) => string }> = ({ result, t }) => {
    const {
        salaire_imposable, exempt, breakdown, IRG_before_abattement, raw_abattement,
        monthly_abattement, abattement_applied_limit, IRG_final_raw,
        IRG_final_rounded, rounding_method, net_salary
    } = result;

    const getAbattementInfo = () => {
        if (abattement_applied_limit === 'min') return t('abattementInfoMin');
        if (abattement_applied_limit === 'max') return t('abattementInfoMax');
        return t('abattementInfoNone');
    };

    return (
        <div id="results-section" className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('results')}</h2>
                <button onClick={() => window.print()} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                    <i className="fas fa-print me-2"></i> {t('print')}
                </button>
            </div>
            
            <div className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200"><strong className="font-semibold">{t('taxableSalary')}:</strong> {salaire_imposable.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
            </div>

            {exempt ? (
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">{t('exemptTitle')}</h3>
                    <p className="text-green-700 dark:text-green-300 mt-1">{t('exemptMessage')}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('breakdownTableTitle')}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">{t('bracket')}</th>
                                        <th scope="col" className="px-4 py-3 text-right rtl:text-left">{t('taxablePart')}</th>
                                        <th scope="col" className="px-4 py-3 text-center">{t('rate')}</th>
                                        <th scope="col" className="px-4 py-3 text-right rtl:text-left">{t('taxPerBracket')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdown.map((item, index) => (
                                        <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.description}</td>
                                            <td className="px-4 py-3 text-right rtl:text-left">{item.part.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-center">{(item.rate * 100).toFixed(0)}%</td>
                                            <td className="px-4 py-3 text-right rtl:text-left font-mono">{item.tax.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-gray-50 dark:bg-gray-700">
                                        <td colSpan={3} className="px-4 py-3 text-right rtl:text-left text-gray-800 dark:text-white">{t('irgBeforeAbattement')}</td>
                                        <td className="px-4 py-3 text-right rtl:text-left text-gray-800 dark:text-white font-mono">{IRG_before_abattement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('abattementTitle')}</h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                             <p className="flex justify-between"><span>{t('rawAbattement')}</span> <span className="font-mono">{raw_abattement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></p>
                            <p className="flex justify-between font-semibold"><span>{t('monthlyAbattement')}</span> <span className="font-mono">{monthly_abattement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{getAbattementInfo()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg">
                            <h3 className="font-semibold text-indigo-800 dark:text-indigo-200">{t('finalIrgTitle')}</h3>
                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">{IRG_final_rounded.toLocaleString('fr-FR')} <span className="text-xl">DA</span></p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('roundingMethodUsed')}: {t(rounding_method)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('finalIrgRaw')}: {IRG_final_raw.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                        </div>
                         <div className="p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">{t('netSalary')}</h3>
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">{net_salary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xl">DA</span></p>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('taxableSalary')} - {t('finalIrgRounded')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default function App() {
  const [language, setLanguage] = useState<Language>(Language.AR);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const { calculate } = useIrgCalculator();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => I18N[language][key] || key;

  const handleCalculate = (salary: number, rounding: RoundingMethod) => {
    const calculationResult = calculate(salary, rounding);
    setResult(calculationResult);
  };
  
  const handleClear = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="text-3xl text-blue-600">
              <i className="fas fa-landmark"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('title')}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('description')}</p>
            </div>
          </div>
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </header>

        <main className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg">
          <CalculatorForm t={t} onCalculate={handleCalculate} onClear={handleClear} />
        </main>
        
        {result && <ResultsDisplay result={result} t={t} />}

        <footer className="text-center mt-8 text-xs text-gray-500 dark:text-gray-400">
          <p>{t('legalNote')}</p>
        </footer>
      </div>
    </div>
  );
}

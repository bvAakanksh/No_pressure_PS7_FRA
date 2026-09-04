import React, { useState } from 'react';
import { DEFAULT_RISK_WEIGHTS } from '../data/mockData';
import { RiskWeights } from '../types/schemas';
import { calculateRiskWeights } from '../services/api';
import { SlidersHorizontal, CheckCircle2, RotateCcw, Save, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const [weights, setWeights] = useState<RiskWeights>({ ...DEFAULT_RISK_WEIGHTS });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalWeight =
    weights.processingDelay +
    weights.rejectionPattern +
    weights.landAreaMismatch +
    weights.duplicateProbability +
    weights.boundaryOverlap +
    weights.satelliteDiscrepancy;

  const isValidTotal = totalWeight === 100;

  const handleSliderChange = (key: keyof RiskWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSavedSuccess(false);
  };

  const handleApply = async () => {
    if (!isValidTotal) return;
    await calculateRiskWeights(weights);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_RISK_WEIGHTS });
    setSavedSuccess(false);
  };

  const weightFactors: { key: keyof RiskWeights; label: string; desc: string }[] = [
    { key: 'landAreaMismatch', label: 'Land Area Mismatch Weight', desc: 'Discrepancy between applicant claim size and revenue map data' },
    { key: 'boundaryOverlap', label: 'Forest Boundary Overlap Weight', desc: 'Spatial polygon intrusion into Reserve Forest or Wildlife Core' },
    { key: 'duplicateProbability', label: 'Duplicate Claim Probability', desc: 'Algorithmic match with existing or rejected claims' },
    { key: 'processingDelay', label: 'Processing Delay Bottleneck', desc: 'SLA verification stalling at Gram Sabha or SDLC stage' },
    { key: 'rejectionPattern', label: 'Rejection Pattern Frequency', desc: 'High rejection history in surrounding Panchayat block' },
    { key: 'satelliteDiscrepancy', label: 'Satellite Canopy Discrepancy', desc: 'Inconsistency between canopy change date and cutoff year 2005' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Settings Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            AI Risk Scoring Model Configuration
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Fine-tune the weight factors used by the decision support engine to calculate claim risk scores (0–100). The sum of all active factor weights must equal <strong>100%</strong>.
        </p>
      </div>

      {/* Main Configuration Form Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
        {/* Total Weight Validation Alert Banner */}
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
            isValidTotal
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {!isValidTotal && <ShieldAlert className="size-4 text-rose-600" />}
            {isValidTotal && <CheckCircle2 className="size-4 text-emerald-600" />}
            <span>
              {isValidTotal
                ? 'Weights sum to exactly 100%. Model ready to apply.'
                : `Current Total Weight is ${totalWeight}%. Adjust sliders so total equals 100%.`}
            </span>
          </div>
          <span className="font-mono font-bold text-sm">{totalWeight}% / 100%</span>
        </div>

        {/* Sliders List */}
        <div className="space-y-5">
          {weightFactors.map((factor) => {
            const val = weights[factor.key];
            return (
              <div key={factor.key} className="space-y-1.5 p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{factor.label}</span>
                    <p className="text-[11px] text-slate-500">{factor.desc}</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">{val}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={val}
                  onChange={(e) => handleSliderChange(factor.key, Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Risk weights saved & recalculating!</span>
              </span>
            )}

            <button
              onClick={handleApply}
              disabled={!isValidTotal}
              className={`px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer ${
                isValidTotal
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="size-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

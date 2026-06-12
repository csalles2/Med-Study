import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  steps: string[];
  currentStep: number;
}

export default function LoaderView({ steps, currentStep }: Props) {
  return (
    <div className="loader-container">
      <div className="loader-spinner" />
      <div className="loader-msg">{steps[currentStep] || steps[steps.length - 1]}</div>
      <div className="loader-steps">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`loader-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}
          >
            <div className="step-dot">
              {i < currentStep && <Check size={6} color="white" style={{ position: 'relative', top: 1, left: 1 }} />}
            </div>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

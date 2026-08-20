"use client";

import { LocationSearchInput } from "@/components/LocationSearchInput";
import { LocationConsentButton } from "@/components/LocationConsentButton";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

type AreaStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function AreaStep({ state, dispatch, errors }: AreaStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted bg-background border-2 border-foreground/20 rounded-md p-3">
        WhoWe uses your general area to show nearby events. Your exact location is never displayed on your profile or
        shared with other members.
      </p>

      <div>
        <label htmlFor="location-search" className="text-sm font-medium block mb-2">
          Suburb, city, or postcode
        </label>
        <LocationSearchInput
          id="location-search"
          value={state.locationLabel}
          onChange={(value) => dispatch({ type: "PATCH", patch: { locationLabel: value, locationLat: null, locationLng: null } })}
          onSelect={(label, lat, lng) =>
            dispatch({ type: "PATCH", patch: { locationLabel: label, locationLat: lat, locationLng: lng } })
          }
        />
        {errors.location && <p className="text-sm text-[#8c2f2f] mt-1">{errors.location}</p>}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Or use your current location</p>
        <LocationConsentButton
          onLocated={(label, lat, lng) => dispatch({ type: "PATCH", patch: { locationLabel: label, locationLat: lat, locationLng: lng } })}
        />
      </div>

      {state.locationLat != null && (
        <div className="rounded-md border-2 border-primary bg-primary/10 p-3 text-sm">
          Using <strong>{state.locationLabel}</strong> — confirm this looks right, or search again above.
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">What others see on your profile</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Public location precision">
          {(["city", "suburb-and-city"] as const).map((precision) => (
            <button
              key={precision}
              type="button"
              role="radio"
              aria-checked={state.locationPrecision === precision}
              onClick={() => dispatch({ type: "PATCH", patch: { locationPrecision: precision } })}
              className={`flex-1 text-sm font-medium px-3 py-2.5 rounded-md border-2 border-foreground transition-all ${
                state.locationPrecision === precision
                  ? "bg-primary text-primary-foreground shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
                  : "bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
              }`}
            >
              {precision === "city" ? "City only" : "Suburb and city"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">
          {state.locationPrecision === "city"
            ? "Others will only see your city."
            : "Others will see your suburb and city."}
        </p>
      </div>
    </div>
  );
}

import React from "react";
import type { LanguageCode } from "../types";

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" }
];

interface Props {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
}

export function LanguageSelection({ value, onChange }: Props): React.ReactElement {
  return (
    <label className="language-picker" htmlFor="language">
      <span>Language</span>
      <select id="language" value={value} onChange={(event) => onChange(event.target.value as LanguageCode)}>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}

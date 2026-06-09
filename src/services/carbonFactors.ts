import type { EmissionCategory } from "../types";

export interface CarbonFactor {
  category: EmissionCategory;
  unit: string;
  kgCO2ePerUnit: number;
  aliases: string[];
}

export const CARBON_FACTORS: Record<string, CarbonFactor> = {
  petrolCarKm: {
    category: "transport",
    unit: "km",
    kgCO2ePerUnit: 0.192,
    aliases: ["petrol car", "gasoline car", "car", "drove", "drive"]
  },
  motorbikeKm: {
    category: "transport",
    unit: "km",
    kgCO2ePerUnit: 0.103,
    aliases: ["bike", "motorbike", "scooter", "two wheeler"]
  },
  busKm: {
    category: "transport",
    unit: "km",
    kgCO2ePerUnit: 0.089,
    aliases: ["bus"]
  },
  electricityKwh: {
    category: "energy",
    unit: "kWh",
    kgCO2ePerUnit: 0.71,
    aliases: ["electricity", "power", "unit", "units", "kwh"]
  },
  naturalGasUnit: {
    category: "energy",
    unit: "unit",
    kgCO2ePerUnit: 2.03,
    aliases: ["gas", "natural gas", "cylinder"]
  },
  vegetarianMeal: {
    category: "diet",
    unit: "meal",
    kgCO2ePerUnit: 1.7,
    aliases: ["vegetarian meal", "veg meal", "vegetarian food"]
  },
  meatMeal: {
    category: "diet",
    unit: "meal",
    kgCO2ePerUnit: 5.4,
    aliases: ["meat", "chicken", "mutton", "beef", "non veg"]
  },
  plasticKg: {
    category: "consumption",
    unit: "kg",
    kgCO2ePerUnit: 6,
    aliases: ["plastic"]
  },
  paperKg: {
    category: "consumption",
    unit: "kg",
    kgCO2ePerUnit: 1.3,
    aliases: ["paper", "cardboard"]
  }
};

export const CATEGORY_LABELS: Record<EmissionCategory, string> = {
  transport: "Transport",
  energy: "Energy",
  diet: "Diet",
  consumption: "Consumption"
};

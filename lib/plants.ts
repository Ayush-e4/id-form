export interface PlantConfig {
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  successTitle?: string;
  successMessage?: string;
}

export const plantConfigs: PlantConfig[] = [
  {
    slug: "bml-plant",
    name: "BML Plant",
    title: "BML Plant ID Card",
    subtitle: "Fill in your details below",
    successTitle: "All done!",
    successMessage: "Your details have been saved successfully.",
  },
];

export function getPlantConfig(slug: string) {
  return plantConfigs.find((plant) => plant.slug === slug);
}

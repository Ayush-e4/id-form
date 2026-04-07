import { notFound } from "next/navigation";
import PlantRegistrationForm from "@/components/forms/PlantRegistrationForm";
import { getPlantConfig } from "@/lib/plants";

export default async function PlantSlugPage({
  params,
}: {
  params: Promise<{ plantSlug: string }>;
}) {
  const plant = getPlantConfig((await params).plantSlug);

  if (!plant) {
    notFound();
  }

  return <PlantRegistrationForm plant={plant} />;
}

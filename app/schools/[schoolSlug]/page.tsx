import { notFound } from "next/navigation";
import SchoolRegistrationForm from "@/components/forms/SchoolRegistrationForm";
import { getSchoolConfig } from "@/lib/schools";

export default async function SchoolSlugPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const school = getSchoolConfig((await params).schoolSlug);

  if (!school) {
    notFound();
  }

  return <SchoolRegistrationForm school={school} />;
}

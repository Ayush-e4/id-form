export type SchoolFieldKey =
  | "name"
  | "class"
  | "section"
  | "fathersName"
  | "mothersName"
  | "dob"
  | "address"
  | "phone"
  | "rollNo"
  | "admissionNo"
  | "height"
  | "weight"
  | "bloodGroup"
  | "houseName";

export type SchoolFieldType = "text" | "tel" | "date" | "number" | "select";
export type SchoolFieldWidth = "full" | "half" | "third";

export interface SchoolFieldConfig {
  key: SchoolFieldKey;
  required?: boolean;
  width?: SchoolFieldWidth;
  placeholder?: string;
}

export interface SchoolConfig {
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  successTitle?: string;
  successMessage?: string;
  fields: SchoolFieldConfig[];
}

export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const schoolConfigs: SchoolConfig[] = [
  {
    slug: "uhs-chokad",
    name: "UHS Chokad",
    title: "UHS Chokad ID Form",
    subtitle: "Student Registration",
    successTitle: "Submitted!",
    successMessage: "UHS Chokad details have been saved successfully.",
    fields: [
      { key: "name", required: true, width: "half", placeholder: "Required" },
      { key: "class", width: "half" },
      { key: "fathersName", width: "half" },
      { key: "mothersName", width: "half" },
      { key: "dob", width: "half" },
      { key: "phone", required: true, width: "half", placeholder: "Enter 10 digit phone" },
      { key: "address", width: "full" },
      { key: "rollNo", width: "half" },
      { key: "admissionNo", width: "half" },
      { key: "height", width: "third", placeholder: "50 to 300 cm" },
      { key: "weight", width: "third", placeholder: "10 to 200 kg" },
      { key: "bloodGroup", width: "third" },
      { key: "houseName", width: "full" },
    ],
  },
  {
    slug: "modern-public-school",
    name: "Modern Public School",
    title: "Modern Public School ID Form",
    subtitle: "Student Registration",
    successTitle: "Submitted!",
    successMessage: "Modern Public School details have been saved successfully.",
    fields: [
      { key: "name", required: true, width: "half", placeholder: "Required" },
      { key: "fathersName", width: "half" },
      { key: "mothersName", width: "half" },
      { key: "class", width: "half" },
      { key: "rollNo", width: "half" },
      { key: "admissionNo", width: "half" },
      { key: "dob", width: "half" },
      { key: "phone", required: true, width: "half", placeholder: "Enter 10 digit phone" },
      { key: "address", width: "full" },
    ],
  },
  {
    slug: "sanskaar-play-school",
    name: "Sanskaar Play School",
    title: "Sanskaar Play School ID Form",
    subtitle: "Student Registration",
    successTitle: "Submitted!",
    successMessage: "Sanskaar Play School details have been saved successfully.",
    fields: [
      { key: "name", required: true, width: "half", placeholder: "Required" },
      { key: "fathersName", width: "half" },
      { key: "mothersName", width: "half" },
      { key: "class", width: "half" },
      { key: "rollNo", width: "half" },
      { key: "admissionNo", width: "half" },
      { key: "dob", width: "half" },
      { key: "phone", required: true, width: "half", placeholder: "Enter 10 digit phone" },
      { key: "address", width: "full" },
    ],
  },
  {
    slug: "gokul-public-school",
    name: "Gokul Public School",
    title: "Gokul Public School ID Form",
    subtitle: "Student Registration",
    successTitle: "Submitted!",
    successMessage: "Gokul Public School details have been saved successfully.",
    fields: [
      { key: "name", required: true, width: "half", placeholder: "Required" },
      { key: "fathersName", width: "half" },
      { key: "mothersName", width: "half" },
      { key: "dob", width: "half" },
      { key: "class", width: "third" },
      { key: "section", width: "third" },
      { key: "rollNo", width: "third" },
      { key: "admissionNo", width: "half" },
      { key: "address", width: "full" },
      { key: "phone", required: true, width: "half", placeholder: "Enter 10 digit phone" },
    ],
  },
  {
    slug: "st-francis-academy",
    name: "St. Francis Academy",
    title: "St. Francis Academy ID Form",
    subtitle: "Student Registration",
    successTitle: "Submitted!",
    successMessage: "St. Francis Academy details have been saved successfully.",
    fields: [
      { key: "name", required: true, width: "half", placeholder: "Required" },
      { key: "fathersName", width: "half" },
      { key: "mothersName", width: "half" },
      { key: "class", width: "half" },
      { key: "dob", width: "half" },
      { key: "admissionNo", width: "half" },
      { key: "address", width: "full" },
      { key: "phone", required: true, width: "half", placeholder: "Enter 10 digit phone" },
    ],
  },
  {
    slug: "golden-public-school",
    name: "Golden Public School",
    title: "Golden Public School ID Form",
    subtitle: "Student Registration",
    successTitle: "Submitted!",
    successMessage: "Golden Public School details have been saved successfully.",
    fields: [
      { key: "name", required: true, width: "half", placeholder: "Required" },
      { key: "fathersName", width: "half" },
      { key: "mothersName", width: "half" },
      { key: "class", width: "half" },
      { key: "rollNo", width: "half" },
      { key: "dob", width: "half" },
      { key: "admissionNo", width: "half" },
      { key: "bloodGroup", width: "half" },
      { key: "address", width: "full" },
      { key: "phone", required: true, width: "half", placeholder: "Enter 10 digit phone" },
    ],
  },
];

export function getSchoolConfig(slug: string) {
  return schoolConfigs.find((school) => school.slug === slug);
}

export function getEnabledFieldMap(school: SchoolConfig) {
  return new Map(school.fields.map((field) => [field.key, field]));
}

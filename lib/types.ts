export interface Submission {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  photoKey?: string | null;
  submittedAt: string; // ISO string
  type?: 'plant' | 'school';
  sourceSlug?: string;
  plantSlug?: string;
  plantName?: string;
  schoolSlug?: string;
  schoolName?: string;
  
  // School fields
  fathersName?: string;
  mothersName?: string;
  class?: string;
  dob?: string;
  address?: string;
  rollNo?: string;
  admissionNo?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
  houseName?: string;
  section?: string;
}

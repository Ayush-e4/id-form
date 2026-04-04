export interface Submission {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  submittedAt: string; // ISO string
  type?: 'plant' | 'school';
  
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
}

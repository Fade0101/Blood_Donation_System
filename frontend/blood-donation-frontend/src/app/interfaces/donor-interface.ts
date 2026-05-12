export interface Donor {
  id: string;
  nationalId: string;
  name: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  bloodType: string;
  gender?: string;
  church?: string;
  
  confessionFather?: string;
}
export interface CreateDonorRequest {
  nationalId: string;
  name: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  bloodType?: string;
  gender?: string;
  church?: string;
  confessionFather?: string;
}
export interface Campaign {
  id: string;
  campaignNumber: number;
  startDate?: string;
  endDate?: string;
  bloodBankName?: string;
  supervisorName?: string;

  status?: 'ACTIVE' | 'COMPLETED';
}

export interface CreateCampaignRequest {
  campaignNumber: number;
bloodBankName?: string
supervisorName?: string
startDate?: string
endDate?: string
}
export interface UpdateCampaignRequest {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

export interface RegisterDonorRequest {
  nationalId: string;
  name?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  offlineSyncId?: string;
}

export interface RegisterDonorResponse {
  donor: Donor;
  registration: Registration;
}

export interface Donor {
  id: string;
  nationalId: string;
  name: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  bloodType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  donorId: string;
  campaignId: string;
  registeredAt: string;
  donatedAt?: string | null;
  offlineSyncId: string;
}
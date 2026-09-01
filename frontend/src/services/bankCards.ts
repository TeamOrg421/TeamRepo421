import { apiCall } from './config';

export interface CreateBankCardDto {
  cardNumber: string;
  cvv: string;
  cardHolderName: string;
  expiryDate: string;
  billingAddress: string;
  isDefault: boolean;
}

export interface BankCardDto {
  id: string;
  maskedCardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  billingAddress: string;
  isDefault: boolean;
  balance?: number;
}

export interface PaymentRequestDto {
  cardId: string;
  amount: number;
}

export interface DepositRequestDto {
  cardId: string;
  amount: number;
}

export interface PaymentResponseDto {
  success: boolean;
  message: string;
  transactionId?: string;
  balance?: number;
  createdAt?: string;
}

export interface DepositResponseDto {
  success: boolean;
  message: string;
  balance: number;
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;

  const error = await response.json().catch(() => null);
  throw new Error(
    error?.error
      ?? error?.message
      ?? `Request failed: ${response.status} ${response.statusText}`,
  );
}

export async function addBankCard(dto: CreateBankCardDto): Promise<BankCardDto> {
  return readJson<BankCardDto>(await apiCall('/bank-cards', {
    method: 'POST',
    body: JSON.stringify(dto),
  }));
}

export async function getBankCards(): Promise<BankCardDto[]> {
  return readJson<BankCardDto[]>(await apiCall('/bank-cards'));
}

export async function topUpBankCard(dto: DepositRequestDto): Promise<DepositResponseDto> {
  return readJson<DepositResponseDto>(await apiCall('/payments/deposit', {
    method: 'POST',
    body: JSON.stringify(dto),
  }));
}

export async function pay(dto: PaymentRequestDto): Promise<PaymentResponseDto> {
  return readJson<PaymentResponseDto>(await apiCall('/payments', {
    method: 'POST',
    body: JSON.stringify(dto),
  }));
}

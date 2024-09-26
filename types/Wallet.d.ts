interface Wallet {
  id: number;
  userId: number;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  user?: User | undefined;
}

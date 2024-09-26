interface Transaction {
  id: number;
  senderWalletId: number;
  receiverWalletId: number;
  amount: number;
  type: TransactionType;
  description: string | undefined;

  createdAt: Date;
  updatedAt: Date;

  senderWallet: Wallet | undefined;
  receiverWallet: Wallet | undefined;
}

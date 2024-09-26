interface Vault {
  id: number;
  branchId: number;
  code: string;
  ledServiceUUID: string;
  switchCharacteristicUUID: string;
  unlockCode?: string;
}

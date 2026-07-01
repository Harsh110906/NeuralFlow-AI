export class SecretMetadataDto {
  name: string;
  createdAt: Date;
  lastRotatedAt: Date | null;
  description?: string;
  inUseByConnectors: number;
}

export class SetSecretDto {
  name: string;
  value: string;
  description?: string;
}

export class RotateSecretDto {
  newValue: string;
}

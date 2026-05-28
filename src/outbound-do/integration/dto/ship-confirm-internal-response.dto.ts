/** Response from ship confirm microservice (`shipconfirm.create` / `shipconfirm.find`). */
export type ShipConfirmInternalResponseDto = {
  status: boolean;
  message: string;
  data: Record<string, unknown> | Record<string, unknown>[] | null;
};

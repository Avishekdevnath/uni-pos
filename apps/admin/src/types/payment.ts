export interface Payment {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  cashTendered: number | null;
  status: string;
  receivedAt: string;
  createdAt: string;
}

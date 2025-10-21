export type User = {
  _id?: string;
  name: string;
  address: string;
  phone: number;
  latitude?: number;
  longitude?: number;
};

export type Message = {
  _id: string;
  text: string;
  userId: string;
  createdAt: Date;
};

export interface IPagination {
  page: number;
  perPage: number;
  count: number;
  documentCount: number;
}

export interface IFullName {
  firstName: string;
  lastName: string;
}

export interface IRole {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface IUser {
  _id: string;
  fullName: IFullName;
  email: string;
  username: string;
  role: IRole;
  salary: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface IUserBrief {
  _id: string;
  name: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  message: string;
  token: string;
  user: IUser;
}

export interface IRegisterRequest {
  fullName: IFullName;
  email: string;
  username: string;
  password: string;
  role: string;
  salary?: number;
}

export interface IUsersResponse {
  users: IUser[];
  pagination: IPagination;
}

export interface ICreateUserPayload {
  fullName: IFullName;
  email: string;
  username: string;
  password: string;
  role: string;
  salary?: number;
}

export interface IUpdateUserPayload {
  fullName?: Partial<IFullName>;
  email?: string;
  username?: string;
  password?: string;
  role?: string;
  salary?: number;
  isActive?: boolean;
}

export interface ICreateRolePayload {
  name: string;
  description?: string | null;
}

export interface IUpdateRolePayload {
  name?: string;
  description?: string | null;
}

export type RawMaterialCategory = "FABRIC" | "THREAD" | "ACCESSORY" | "OTHER";
export type RawMaterialUnit = "PIECE" | "METER" | "KILOGRAM" | "ROLL" | "UNIT";

export interface IRawMaterial {
  _id: string;
  name: string;
  category: RawMaterialCategory;
  color: string;
  unit: RawMaterialUnit;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: string;
}

export interface IRawMaterialsResponse {
  items: IRawMaterial[];
  pagination: IPagination;
}

export interface IRawMaterialPayload {
  name: string;
  category: RawMaterialCategory;
  color?: string;
  unit: RawMaterialUnit;
  stockQuantity: number;
  unitPrice: number;
  minimumStock?: number;
  isActive?: boolean;
}

export type OrderStatus =
  | "PENDING"
  | "CUTTING"
  | "SEWING"
  | "PRINTING"
  | "PACKAGING"
  | "STORAGE"
  | "DELIVERY";

export type OrderListStatusFilter = OrderStatus;

export interface IDeliveryLocation {
  address: string;
  city?: string;
  notes?: string;
}

export interface IOrder {
  _id: string;
  customer: IUser;
  description: string;
  status: OrderStatus;
  expectedFinishDate?: string;
  cost: number;
  employee?: IUser;
  sizes: string[];
  colors: string[];
  deliveryLocation: IDeliveryLocation;
  isCancelled?: boolean;
  cancelReason?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface IOrdersResponse {
  orders: IOrder[];
  pagination: IPagination;
}

export interface ICreateOrderPayload {
  customer: string;
  employee: string;
  description: string;
  status?: OrderStatus;
  expectedFinishDate?: string;
  cost?: number;
  sizes?: string[];
  colors?: string[];
  deliveryLocation?: IDeliveryLocation;
}

export interface IUpdateOrderPayload {
  customer?: string;
  employee?: string;
  description?: string;
  status?: OrderStatus;
  expectedFinishDate?: string;
  cost?: number;
  sizes?: string[];
  colors?: string[];
  deliveryLocation?: Partial<IDeliveryLocation>;
  isCancelled?: boolean;
  cancelReason?: string;
}

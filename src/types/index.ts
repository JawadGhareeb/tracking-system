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

export interface IAuthTokenBundle {
  token: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface ILoginResponse extends IAuthTokenBundle {
  message: string;
  user: IUser;
}

export interface IRefreshTokenResponse extends IAuthTokenBundle {
  message: string;
  user: IUser;
}

export interface IRegisterRequest {
  fullName: IFullName;
  email: string;
  password: string;
  confirmPassword: string;
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

export type ExpenseCategory = "RAW_MATERIAL" | "SALARY" | "ELECTRICITY" | "TRANSPORT" | "MAINTENANCE" | "RENT" | "OTHER";

export interface IExpense {
  _id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}

export interface IExpensePayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
}

export interface IExpensesResponse {
  items: IExpense[];
  pagination: IPagination;
}

export interface IFinanceSummary {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  loss: number;
  rawMaterialExpenses: number;
  rawMaterialsAdded: number;
}

export interface IDashboardSummary {
  pendingOrders: number;
  inProduction: number;
  deliveredOrders: number;
  users: number;
  employees: number;
  customers: number;
  lowStockMaterials: number;
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

export interface IOrderMaterial {
  rawMaterial: IRawMaterial;
  nameSnapshot: string;
  colorSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  subtotal: number;
}

export interface ICustomerOrderMaterialInput {
  rawMaterialId: string;
  quantity: number;
}

export interface ICreateMyOrderPayload {
  description: string;
  notes: string;
  rawMaterials: ICustomerOrderMaterialInput[];
  deliveryLocation?: IDeliveryLocation;
}

export type StageCompletionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IStageCompletionRequest {
  _id: string;
  stage: OrderStatus;
  employee: IUser;
  status: StageCompletionStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: IUser;
}

export interface IAssignOrderPayload {
  employee: string;
  expectedFinishDate: string;
  additionalCost?: number;
}

export interface IOrder {
  _id: string;
  customer: IUser;
  description: string;
  status: OrderStatus;
  expectedFinishDate?: string;
  notes: string;
  rawMaterials: IOrderMaterial[];
  materialCost: number;
  additionalCost: number;
  totalPrice: number;
  cost?: number;
  employee?: IUser;
  sizes: string[];
  colors: string[];
  deliveryLocation: IDeliveryLocation;
  isCancelled?: boolean;
  cancelReason?: string;
  deliveredAt?: string;
  stageCompletionRequests: IStageCompletionRequest[];
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

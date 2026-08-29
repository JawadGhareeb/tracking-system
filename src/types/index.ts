export interface IPagination { page: number; perPage: number; count: number; documentCount: number; }
export interface IFullName { firstName: string; lastName: string; }
export type RoleGroup = "ADMIN" | "EMPLOYEE" | "CUSTOMER";
export interface IRole { _id: string; name: string; description: string; group: RoleGroup; createdAt: string; }
export interface IUser { _id: string; fullName: IFullName; email: string; phoneNumber?: string | null; username: string; role: IRole; salary: number; assignedOrdersCount?: number; isActive: boolean; isDeleted: boolean; createdAt: string; }
export interface IUserBrief { _id: string; name: string; }
export interface ILoginRequest { email: string; password: string; }
export interface IAuthTokenBundle { token: string; accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number; }
export interface ILoginResponse extends IAuthTokenBundle { message: string; user: IUser; }
export interface IRefreshTokenResponse extends IAuthTokenBundle { message: string; user: IUser; }
export interface IRegisterRequest { fullName: IFullName; email: string; phoneNumber: string; password: string; confirmPassword: string; }
export interface IUsersResponse { users: IUser[]; pagination: IPagination; }
export interface ICreateUserPayload { fullName: IFullName; email: string; phoneNumber: string; username: string; password: string; role: string; salary?: number; isActive?: boolean; }
export interface IUpdateUserPayload { fullName?: Partial<IFullName>; email?: string; phoneNumber?: string | null; username?: string; password?: string; role?: string; salary?: number; isActive?: boolean; }
export interface ICreateRolePayload { name: string; description?: string | null; group: RoleGroup; }
export interface IUpdateRolePayload { name?: string; description?: string | null; group?: RoleGroup; }

export type ExpenseCategory = "RAW_MATERIAL" | "SALARY" | "ELECTRICITY" | "TRANSPORT" | "MAINTENANCE" | "RENT" | "OTHER";
export interface IExpense { _id: string; title: string; category: ExpenseCategory; amount: number; date: string; description: string; createdAt: string; }
export interface IExpensePayload { title: string; category: ExpenseCategory; amount: number; date: string; description?: string; }
export interface IExpenseSummary { monthTotal: number; filteredTotal: number; categoryTotals: Record<ExpenseCategory, number>; }
export interface IExpensesResponse { items: IExpense[]; pagination: IPagination; summary: IExpenseSummary; }
export interface IFinanceSummary { month: string; revenue: number; expenses: number; profit: number; loss: number; rawMaterialExpenses: number; rawMaterialsAdded: number; }
export interface IDashboardSummary { pendingOrders: number; inProduction: number; deliveredOrders: number; users: number; employees: number; customers: number; lowStockMaterials: number; }

export type RawMaterialCategory = "FABRIC" | "THREAD" | "ACCESSORY";
export type RawMaterialUnit = "PIECE" | "METER" | "KILOGRAM" | "ROLL" | "UNIT";
export interface IRawMaterial { _id: string; name: string; category: RawMaterialCategory; color: string; unit: RawMaterialUnit; stockQuantity: number; reservedQuantity: number; availableQuantity: number; unitPrice: number; minimumStock: number; availability?: "AVAILABLE" | "UNAVAILABLE"; createdAt: string; }
export interface IRawMaterialsResponse { items: IRawMaterial[]; pagination: IPagination; }
export interface IRawMaterialPayload { name: string; category: RawMaterialCategory; color?: string; unit: RawMaterialUnit; stockQuantity: number; unitPrice: number; minimumStock?: number; }

export type OrderStatus = "PENDING" | "CUTTING" | "SEWING" | "PRINTING" | "PACKAGING" | "STORAGE" | "DELIVERY" | "DELIVERED";
export type OrderListStatusFilter = OrderStatus;
export interface IDeliveryLocation { address: string; city?: string; notes?: string; }
export interface IOrderMaterial { rawMaterial: IRawMaterial; nameSnapshot: string; colorSnapshot: string; quantity: number; unitPriceSnapshot: number; subtotal: number; }
export interface ICustomerOrderMaterialInput { rawMaterialId: string; quantity: number; }

export type ProductType = "BLOUSE" | "SHIRT" | "PANTS" | "DRESS";
export interface IProductConfigurationOption { value: string; label: string; priceModifier: number; }
export interface IProductConfigurationField { key: string; label: { ar: string; en: string } | string; required?: boolean; options?: IProductConfigurationOption[]; }
export interface IProductConfiguration { type: ProductType; label: { ar: string; en: string }; basePrice: number; attributes: IProductConfigurationField[]; customizations: Array<{ key: string; label: string; priceModifier: number }>; measurements: Array<{ key: string; label: string; required: boolean }>; }
export interface ICreateMyOrderPayload { productType: ProductType; designAttributes: Record<string, string>; measurementMode: "STANDARD" | "CUSTOM"; standardSize?: string | null; measurements: Record<string, number>; customizations: Record<string, boolean>; orderQuantity: number; materialId: string; notes?: string | null; deliveryLocation?: IDeliveryLocation; }

export type StageCompletionStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface IStageCompletionRequest { _id: string; stage: OrderStatus; employee: IUser; status: StageCompletionStatus; requestedAt: string; reviewedAt?: string; reviewedBy?: IUser; }
export interface IAssignOrderPayload { employee: string; expectedFinishDate: string; additionalCost?: number; }
export interface IOrder { _id: string; customer: IUser; description: string; status: OrderStatus; expectedFinishDate?: string; notes: string | null; productType?: ProductType; designAttributes?: Record<string, string>; measurementMode?: "STANDARD" | "CUSTOM"; standardSize?: string | null; measurements?: Record<string, number>; customizations?: Record<string, boolean>; orderQuantity?: number; configurationUnitPrice?: number; configurationCost?: number; rawMaterials: IOrderMaterial[]; materialCost: number; additionalCost: number; totalPrice: number; cost?: number; employee?: IUser; deliveryEmployee?: IUser; sizes: string[]; colors: string[]; deliveryLocation: IDeliveryLocation; isCancelled?: boolean; cancelledAt?: string; cancelReason?: string; isRejected?: boolean; rejectedAt?: string; rejectReason?: string; deliveredAt?: string; stageCompletionRequests: IStageCompletionRequest[]; createdAt: string; }
export interface IOrdersResponse { orders: IOrder[]; pagination: IPagination; }
export interface ICreateOrderPayload { customer: string; employee: string; description: string; status?: OrderStatus; expectedFinishDate?: string; cost?: number; sizes?: string[]; colors?: string[]; deliveryLocation?: IDeliveryLocation; }
export interface IUpdateOrderPayload { customer?: string; employee?: string; deliveryEmployee?: string; description?: string; status?: OrderStatus; expectedFinishDate?: string; cost?: number; sizes?: string[]; colors?: string[]; deliveryLocation?: Partial<IDeliveryLocation>; isCancelled?: boolean; cancelReason?: string; }

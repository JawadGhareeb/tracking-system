import { createApiClient } from "@/services/api-client";
import { getServerAuthToken } from "@/services/auth-cookie.server";

export const serverApiClient = createApiClient(getServerAuthToken);

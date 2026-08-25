import { redirect } from "next/navigation";

export default function LegacyAdminNewOrderPage() {
  redirect("/orders?status=PENDING");
}

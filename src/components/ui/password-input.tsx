"use client";

import { ComponentProps, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

function PasswordInput({ className, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pl-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((previous) => !previous)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--black-100)] transition-colors hover:text-[var(--black-300)]"
        aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export { PasswordInput };

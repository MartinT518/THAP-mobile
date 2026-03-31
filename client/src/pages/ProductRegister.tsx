import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ProductDetailSkeleton } from "@/components/ProductCardSkeleton";
import { toast } from "sonner";
import type { RegistrationFormField } from "@shared/types";

const COUNTRY_CODES = [
  "EE",
  "FI",
  "SE",
  "NO",
  "DK",
  "DE",
  "FR",
  "ES",
  "IT",
  "PT",
  "PL",
  "RU",
  "CN",
  "US",
  "GB",
] as const;

function resolveFieldDefault(
  field: RegistrationFormField,
  profile: { name: string | null; email: string | null; country: string | null },
): string {
  const hint = field.prefilledHint;
  if (hint === "fullName") return profile.name ?? "";
  if (hint === "email") return profile.email ?? "";
  if (field.type === "country" && profile.country) return profile.country;
  if (hint && hint !== "fullName" && hint !== "email") return hint;
  return "";
}

function buildDefaults(
  fields: RegistrationFormField[],
  profile: { name: string | null; email: string | null; country: string | null },
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    out[f.key] = resolveFieldDefault(f, profile);
  }
  return out;
}

export default function ProductRegister() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const numericId = id ? parseInt(id, 10) : NaN;

  const { data: productData, isLoading: productLoading, isError: productError, refetch } =
    trpc.products.getById.useQuery({ id: numericId }, { enabled: Number.isFinite(numericId) });

  const externalProductId = productData?.product?.productId ?? "";
  const instance = productData?.instance;

  const {
    data: registrationForm,
    isLoading: formLoading,
    isError: formError,
    refetch: refetchForm,
  } = trpc.products.getRegistrationForm.useQuery(
    { productId: externalProductId },
    { enabled: !!instance && !!externalProductId },
  );

  const { data: profile } = trpc.userSettings.get.useQuery();

  const utils = trpc.useUtils();

  const defaultValues = useMemo(() => {
    if (!registrationForm?.fields.length || !profile) return {} as Record<string, string>;
    return buildDefaults(registrationForm.fields, profile);
  }, [registrationForm, profile]);

  const form = useForm<Record<string, string>>({
    defaultValues: {},
  });

  const { reset, handleSubmit, control } = form;

  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const registerMutation = trpc.products.registerProduct.useMutation({
    onSuccess: async () => {
      toast.success(t("productRegister.success"));
      await utils.products.getRegistrationForm.invalidate({ productId: externalProductId });
      navigate(`/product/${numericId}`);
    },
    onError: (err) => toast.error(err.message || t("productRegister.submitFailed")),
  });

  function onSubmit(values: Record<string, string>) {
    if (!instance) return;
    registerMutation.mutate({
      productInstanceId: instance.id,
      formData: values,
    });
  }

  if (!Number.isFinite(numericId)) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => navigate("/")} />
        <p className="container py-6 text-muted-foreground">{t("productRegister.invalidLink")}</p>
      </MobileLayout>
    );
  }

  if (productLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => window.history.back()} />
        <div className="container py-6">
          <ProductDetailSkeleton />
        </div>
      </MobileLayout>
    );
  }

  if (productError || !productData?.product) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => window.history.back()} />
        <ErrorRetry message={t("productRegister.loadProductFailed")} onRetry={() => refetch()} />
      </MobileLayout>
    );
  }

  if (!instance) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => navigate(`/product/${numericId}`)} />
        <div className="container py-6 space-y-4">
          <p className="text-muted-foreground">{t("productRegister.needOwnership")}</p>
          <Button onClick={() => navigate(`/product/${numericId}`)}>{t("common.goHome")}</Button>
        </div>
      </MobileLayout>
    );
  }

  if (formLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => navigate(`/product/${numericId}`)} />
        <div className="container py-6">
          <ProductDetailSkeleton />
        </div>
      </MobileLayout>
    );
  }

  if (formError) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => navigate(`/product/${numericId}`)} />
        <ErrorRetry message={t("productRegister.loadFormFailed")} onRetry={() => refetchForm()} />
      </MobileLayout>
    );
  }

  if (!registrationForm) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productRegister.title")} onBack={() => navigate(`/product/${numericId}`)} />
        <div className="container py-6 space-y-4">
          <p className="text-muted-foreground">{t("productRegister.noForm")}</p>
          <Button variant="outline" onClick={() => navigate(`/product/${numericId}`)}>
            {t("common.cancel")}
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const { product } = productData;

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("productRegister.title")} onBack={() => navigate(`/product/${numericId}`)} />
      <div className="container py-6 space-y-6 pb-24">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{product.name}</p>
          <h1 className="text-xl font-semibold">{registrationForm.title}</h1>
          {registrationForm.description && (
            <p className="text-sm text-muted-foreground mt-2">{registrationForm.description}</p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {registrationForm.fields.map((field) => (
              <FormField
                key={field.key}
                control={control}
                name={field.key}
                rules={{
                  required: field.required ? t("productRegister.fieldRequired") : false,
                  ...(field.type === "email"
                    ? {
                        validate: (v: string) => {
                          const s = (v ?? "").trim();
                          if (!s) {
                            return field.required ? t("productRegister.fieldRequired") : true;
                          }
                          return (
                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ||
                            t("productRegister.invalidEmail", { label: field.label })
                          );
                        },
                      }
                    : {}),
                }}
                render={({ field: ctl }) => (
                  <FormItem>
                    <FormLabel>
                      {field.label}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </FormLabel>
                    <FormControl>
                      {field.type === "textarea" ? (
                        <Textarea
                          {...ctl}
                          rows={4}
                          className="resize-none min-h-[100px]"
                          autoComplete="off"
                        />
                      ) : field.type === "country" ? (
                        <Select
                          value={ctl.value?.trim() ? ctl.value : undefined}
                          onValueChange={ctl.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("productRegister.selectCountry")} />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((code) => (
                              <SelectItem key={code} value={code}>
                                {t(`countries.${code}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "date" ? (
                        <Input {...ctl} type="date" />
                      ) : (
                        <Input
                          {...ctl}
                          type={field.type === "email" ? "email" : "text"}
                          autoComplete={field.type === "email" ? "email" : "on"}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" size="lg" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t("common.loading") : t("productRegister.submit")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(`/product/${numericId}`)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MobileLayout>
  );
}

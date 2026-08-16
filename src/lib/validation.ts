import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
export const checkoutSchema = z.object({
  name: text(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/),
  address: text(500),
  city: text(100),
});

const password = z.string().min(12, "Password must be at least 12 characters.").max(128);

export const customerSignupSchema = z.object({
  name: text(100),
  email: z.string().trim().email().max(254),
  password,
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const customerProfileSchema = z.object({ name: text(100), phone: z.string().trim().regex(/^$|^\+?[0-9\s()-]{7,20}$/) });
export const addressSchema = z.object({ label: text(40), recipient: text(100), phone: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/), line1: text(200), line2: z.string().trim().max(200).optional(), city: text(100), isDefault: z.boolean().optional() });
export const customerSettingsSchema = z.object({ marketingEmails: z.boolean(), orderUpdates: z.boolean(), whatsappUpdates: z.boolean() });
export const newsletterSchema = z.object({ email: z.string().trim().email().max(254) });

const code = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.");
const emailField = z.string().trim().email().max(254);

export const emailOnlySchema = z.object({ email: emailField });
export const otpConfirmSchema = z.object({ code });
export const checkoutOtpConfirmSchema = z.object({ email: emailField, code });
export const passwordResetSchema = z.object({ email: emailField, code, newPassword: password });

export const productUpdateSchema = z.object({
  title: text(160).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  imageUrl: z.string().trim().max(2_048).refine((value) => value.startsWith("/") || /^https:\/\//.test(value), "Image must be a local path or HTTPS URL").optional(),
  price: z.number().int().min(1).max(10_000_000).optional(),
  category: z.string().trim().max(80).nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  stock: z.number().int().min(0).max(100_000).optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
});

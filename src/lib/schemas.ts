import * as S from "@effect/schema/Schema";
import { Either } from "effect";

// Email refinement pattern
export const EmailSchema = S.String.pipe(
  S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  S.annotations({ message: () => "Must be a valid email address" })
);

// Non-empty string
export const NonEmptyString = S.String.pipe(
  S.minLength(1),
  S.annotations({ message: () => "Must be a non-empty string" })
);

// Non-negative number
export const NonNegativeNumber = S.Number.pipe(
  S.greaterThanOrEqualTo(0),
  S.annotations({ message: () => "Must be a non-negative number" })
);

// Positive integer (>= 1)
export const PositiveInteger = S.Int.pipe(
  S.greaterThanOrEqualTo(1),
  S.annotations({ message: () => "Must be a positive integer (at least 1)" })
);

// ==========================================
// 1. Product Schema
// ==========================================
export const ProductSchema = S.Struct({
  id: S.String,
  title: NonEmptyString,
  description: S.NullOr(S.String),
  rawPrice: NonNegativeNumber,
  imageUrl: S.NullOr(S.String),
  additionalImages: S.NullOr(S.String),
  options: S.NullOr(S.String),
  variants: S.NullOr(S.String),
  tags: S.NullOr(S.String),
  sourceUrl: S.NullOr(S.String),
  createdAt: S.Number,
});

export type Product = S.Schema.Type<typeof ProductSchema>;

// ==========================================
// 2. Order Schema
// ==========================================
export const OrderStatusSchema = S.Literal('pending', 'paid', 'shipped', 'cancelled');

export const OrderSchema = S.Struct({
  id: S.String,
  productId: S.String,
  quantity: PositiveInteger,
  totalPrice: NonNegativeNumber,
  status: OrderStatusSchema,
  customerEmail: EmailSchema,
  shippingAddress: NonEmptyString,
  createdAt: S.Number,
});

export type Order = S.Schema.Type<typeof OrderSchema>;

// ==========================================
// 3. User Schema
// ==========================================
export const UserSchema = S.Struct({
  id: S.String,
  name: NonEmptyString,
  email: EmailSchema,
  emailVerified: S.Boolean,
  image: S.NullOr(S.String),
  createdAt: S.Union(S.Date, S.Number, S.String),
  updatedAt: S.Union(S.Date, S.Number, S.String),
});

export type User = S.Schema.Type<typeof UserSchema>;

// ==========================================
// 4. Session Schema
// ==========================================
export const SessionSchema = S.Struct({
  id: S.String,
  expiresAt: S.Union(S.Date, S.Number, S.String),
  token: S.String,
  createdAt: S.Union(S.Date, S.Number, S.String),
  updatedAt: S.Union(S.Date, S.Number, S.String),
  ipAddress: S.NullOr(S.String),
  userAgent: S.NullOr(S.String),
  userId: S.String,
});

export type Session = S.Schema.Type<typeof SessionSchema>;

// ==========================================
// 5. Checkout Payload Schema
// ==========================================
export const CheckoutItemSchema = S.Struct({
  productId: S.String,
  name: NonEmptyString,
  quantity: PositiveInteger,
  price: NonNegativeNumber,
  options: S.Record({ key: S.String, value: S.String }),
});

export const CheckoutPayloadSchema = S.Struct({
  email: EmailSchema,
  fullName: NonEmptyString,
  nodeAddress: NonEmptyString,
  walletId: NonEmptyString,
  items: S.Array(CheckoutItemSchema),
});

export type CheckoutPayload = S.Schema.Type<typeof CheckoutPayloadSchema>;

// ==========================================
// 6. Server Function Input Schemas
// ==========================================
export const ImportAliExpressProductSchema = S.Struct({
  url: S.String.pipe(
    S.pattern(/^https?:\/\//),
    S.annotations({ message: () => "Must be a valid URL starting with http/https" })
  )
});

export const UpdateSettingsSchema = S.Struct({
  marginMultiplier: S.Number.pipe(
    S.greaterThan(0),
    S.annotations({ message: () => "Margin multiplier must be a positive number" })
  )
});

export const CreateCheckoutSessionSchema = S.Struct({
  email: EmailSchema,
  items: S.Array(S.Struct({
    name: NonEmptyString,
    price: NonNegativeNumber,
    quantity: PositiveInteger
  })),
  origin: S.String
});

// ==========================================
// 7. Either-based Decoders & Helper
// ==========================================
export const validateWithSchema = <A, I>(schema: S.Schema<A, I>) => (input: unknown): A => {
  const result = S.decodeUnknownEither(schema)(input);
  if (Either.isLeft(result)) {
    throw new Error(String(result.left));
  }
  return result.right;
};

export const decodeProduct = validateWithSchema(ProductSchema);
export const decodeOrder = validateWithSchema(OrderSchema);
export const decodeUser = validateWithSchema(UserSchema);
export const decodeSession = validateWithSchema(SessionSchema);
export const decodeCheckoutPayload = validateWithSchema(CheckoutPayloadSchema);
export const decodeImportAliExpressProduct = validateWithSchema(ImportAliExpressProductSchema);
export const decodeUpdateSettings = validateWithSchema(UpdateSettingsSchema);
export const decodeCreateCheckoutSession = validateWithSchema(CreateCheckoutSessionSchema);


-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CHURNED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('RESTAURANT', 'HOTEL', 'CLOUD_KITCHEN', 'CAFE', 'BAKERY', 'BAR', 'BREWERY', 'FOOD_COURT_UNIT', 'CATERING_UNIT', 'WAREHOUSE', 'COMMISSARY', 'HEAD_OFFICE');

-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('DINE_IN', 'QSR', 'BAR', 'BAKERY_COUNTER', 'ROOM_SERVICE', 'BANQUET', 'DELIVERY_ONLY', 'TAKEAWAY_COUNTER');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('FREE', 'SEATED', 'BILLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TerminalStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('MAIN', 'KITCHEN', 'BAR', 'HOUSEKEEPING', 'WAREHOUSE', 'COMMISSARY');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleScopeType" AS ENUM ('TENANT', 'COMPANY', 'LOCATION');

-- CreateEnum
CREATE TYPE "DietaryType" AS ENUM ('VEG', 'NON_VEG', 'EGG', 'VEGAN');

-- CreateEnum
CREATE TYPE "PriceListKind" AS ENUM ('OUTLET', 'CHANNEL', 'HAPPY_HOUR', 'DAY_PART');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'LIQUOR', 'BEVERAGE', 'HOTEL_SUPPLY', 'CLEANING_SUPPLY', 'STATIONERY', 'ASSET_ITEM');

-- CreateEnum
CREATE TYPE "ValuationMethod" AS ENUM ('WEIGHTED_AVERAGE', 'FIFO', 'LIFO');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('OPENING', 'PURCHASE_RECEIPT', 'PURCHASE_RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'PRODUCTION_CONSUME', 'PRODUCTION_OUTPUT', 'SALE_CONSUMPTION', 'SALE_RETURN', 'ADJUSTMENT', 'WASTE', 'PILFERAGE', 'COUNT_VARIANCE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('WASTE', 'PILFERAGE', 'DAMAGE', 'EXPIRY', 'SPILLAGE', 'CORRECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "CountStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'REVIEW', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SENT', 'QUOTED', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GrnStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseInvoiceStatus" AS ENUM ('DRAFT', 'POSTED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorNoteType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD', 'WALLET');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'QR', 'WEBSITE', 'PHONE', 'WHATSAPP', 'SWIGGY', 'ZOMATO', 'UBER_EATS', 'AGGREGATOR_OTHER', 'BANQUET', 'ROOM_SERVICE');

-- CreateEnum
CREATE TYPE "PosOrderStatus" AS ENUM ('DRAFT', 'PLACED', 'IN_KITCHEN', 'SERVED', 'BILLED', 'SETTLED', 'CANCELLED', 'VOIDED');

-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'FIRED', 'PREPARING', 'READY', 'SERVED', 'VOIDED');

-- CreateEnum
CREATE TYPE "KotStatus" AS ENUM ('FIRED', 'ACKNOWLEDGED', 'PREPARING', 'READY', 'BUMPED', 'RECALLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderType" AS ENUM ('CASH', 'CARD', 'UPI', 'WALLET', 'GIFT_CARD', 'LOYALTY_POINTS', 'CUSTOMER_CREDIT', 'ROOM_CHARGE', 'ADVANCE', 'AGGREGATOR', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "PosPaymentStatus" AS ENUM ('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'AMOUNT');

-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('SALE', 'REFUND', 'DROP', 'PAYOUT', 'FLOAT_IN', 'FLOAT_OUT');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('VACANT_CLEAN', 'VACANT_DIRTY', 'OCCUPIED', 'INSPECTED', 'OUT_OF_ORDER', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('DIRECT', 'WEBSITE', 'PHONE', 'WALK_IN', 'CORPORATE', 'TRAVEL_AGENT', 'OTA');

-- CreateEnum
CREATE TYPE "StayStatus" AS ENUM ('IN_HOUSE', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "FolioStatus" AS ENUM ('OPEN', 'SETTLED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "FolioChargeType" AS ENUM ('ROOM_NIGHT', 'POS_ORDER', 'MINI_BAR', 'LAUNDRY', 'SPA', 'GYM', 'TELEPHONE', 'DAMAGE', 'MISC', 'TAX', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "HousekeepingTaskType" AS ENUM ('CLEANING', 'TURNDOWN', 'INSPECTION', 'MAINTENANCE', 'MINI_BAR_REFILL', 'LAUNDRY_PICKUP');

-- CreateEnum
CREATE TYPE "HousekeepingTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BottleStatus" AS ENUM ('SEALED', 'OPEN', 'EMPTY', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "PourType" AS ENUM ('SALE', 'WASTE', 'SPILLAGE', 'COMPLIMENTARY', 'SAMPLE');

-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('LOAD', 'REDEEM', 'REFUND', 'EXPIRY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LoyaltyEntryType" AS ENUM ('EARN', 'REDEEM', 'EXPIRY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "GiftCardStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'AMOUNT', 'BOGO');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED', 'LOCKED');

-- CreateEnum
CREATE TYPE "BankTxnStatus" AS ENUM ('UNRECONCILED', 'MATCHED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PunchSource" AS ENUM ('BIOMETRIC', 'TERMINAL_PIN', 'MOBILE_GEO', 'MANUAL');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSED', 'POSTED', 'PAID');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_USE', 'IN_STORAGE', 'UNDER_REPAIR', 'DISPOSED');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'WRITTEN_DOWN_VALUE');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "AnomalySeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AnomalyStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "trialEndsAt" TIMESTAMP(3),
    "country" TEXT NOT NULL DEFAULT 'IN',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "module_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "taxRegistrationNumber" TEXT,
    "panNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "country" TEXT NOT NULL DEFAULT 'IN',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logoUrl" TEXT,
    "cuisineType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OutletType" NOT NULL,
    "dayCloseTime" TEXT NOT NULL DEFAULT '04:00',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_table" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "status" "TableStatus" NOT NULL DEFAULT 'FREE',
    "posX" INTEGER NOT NULL DEFAULT 0,
    "posY" INTEGER NOT NULL DEFAULT 0,
    "shape" TEXT NOT NULL DEFAULT 'square',
    "qrToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dining_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_terminal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "TerminalStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "deviceFingerprint" TEXT,
    "activationCode" TEXT,
    "activatedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_terminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "StoreType" NOT NULL,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_station" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "printerAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "kitchen_station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "nextNumber" BIGINT NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 6,

    CONSTRAINT "document_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminal_sequence_block" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "blockStart" BIGINT NOT NULL,
    "blockEnd" BIGINT NOT NULL,
    "consumed" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminal_sequence_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "passwordHash" TEXT,
    "posPinHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "isTenantOwner" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scopeType" "RoleScopeType" NOT NULL DEFAULT 'TENANT',
    "companyId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "user_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_session" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "terminalId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "terminalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "dietaryType" "DietaryType" NOT NULL DEFAULT 'VEG',
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inventoryItemId" TEXT,
    "recipeId" TEXT,
    "taxGroupId" TEXT,
    "kitchenStationId" TEXT,
    "isSellable" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_variant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "basePrice" DECIMAL(14,4) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_item_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_group" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "modifier_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "inventoryItemId" TEXT,
    "consumptionQty" DECIMAL(14,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_modifier_group" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_modifier_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PriceListKind" NOT NULL,
    "outletId" TEXT,
    "channel" "OrderChannel",
    "priority" INTEGER NOT NULL DEFAULT 0,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startTime" TEXT,
    "endTime" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "menuItemVariantId" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "price_list_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uom" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "uom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uom_conversion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromUomId" TEXT NOT NULL,
    "toUomId" TEXT NOT NULL,
    "factor" DECIMAL(14,6) NOT NULL,

    CONSTRAINT "uom_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "InventoryItemType" NOT NULL,
    "categoryName" TEXT,
    "baseUomId" TEXT NOT NULL,
    "purchaseUomId" TEXT,
    "barcode" TEXT,
    "hsnCode" TEXT,
    "taxGroupId" TEXT,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "shelfLifeDays" INTEGER,
    "trackBatches" BOOLEAN NOT NULL DEFAULT false,
    "bottleVolumeMl" DECIMAL(10,2),
    "pegSizeMl" DECIMAL(10,2),
    "standardCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_level" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "minQty" DECIMAL(14,4) NOT NULL,
    "parQty" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "reorder_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_summary" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "onHand" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "avgCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_batch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unitCost" DECIMAL(14,4) NOT NULL,
    "qtyReceived" DECIMAL(14,4) NOT NULL,
    "qtyRemaining" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "stock_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT,
    "movementType" "StockMovementType" NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "unitCost" DECIMAL(14,4) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceLineId" TEXT,
    "businessDate" DATE NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "fromStoreId" TEXT NOT NULL,
    "toStoreId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "dispatchedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT,
    "qty" DECIMAL(14,4) NOT NULL,
    "qtyReceived" DECIMAL(14,4),
    "unitCost" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "stock_transfer_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "note" TEXT,
    "businessDate" DATE NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adjustmentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT,
    "qty" DECIMAL(14,4) NOT NULL,
    "unitCost" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "stock_adjustment_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_count" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "CountStatus" NOT NULL DEFAULT 'DRAFT',
    "countedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_count_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_count_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT,
    "systemQty" DECIMAL(14,4) NOT NULL,
    "countedQty" DECIMAL(14,4),
    "unitCost" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "stock_count_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "taxRegistrationNumber" TEXT,
    "panNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "tdsRate" DECIMAL(6,3),
    "rating" DECIMAL(3,2),
    "portalUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "vendorSku" TEXT,
    "lastPrice" DECIMAL(14,4),
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vendor_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "PrStatus" NOT NULL DEFAULT 'DRAFT',
    "neededBy" TIMESTAMP(3),
    "note" TEXT,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "uomId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "purchase_request_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_quote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "rfq_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_quote_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "rfq_quote_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "PoStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expectedAt" TIMESTAMP(3),
    "subtotal" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "uomId" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "taxGroupId" TEXT,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "qtyReceived" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "qtyInvoiced" DECIMAL(14,4) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "poId" TEXT,
    "vendorId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "GrnStatus" NOT NULL DEFAULT 'DRAFT',
    "vendorChallanNumber" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessDate" DATE NOT NULL,
    "postedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "poLineId" TEXT,
    "itemId" TEXT NOT NULL,
    "qtyReceived" DECIMAL(14,4) NOT NULL,
    "qtyRejected" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "uomId" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "batchId" TEXT,

    CONSTRAINT "goods_receipt_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "vendorInvoiceNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poId" TEXT,
    "status" "PurchaseInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "journalId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoice_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "poLineId" TEXT,
    "grnLineId" TEXT,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "taxGroupId" TEXT,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_invoice_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_note" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "VendorNoteType" NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(14,4) NOT NULL,
    "reason" TEXT,
    "businessDate" DATE NOT NULL,
    "journalId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "tdsAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "reference" TEXT,
    "businessDate" DATE NOT NULL,
    "bankAccountId" TEXT,
    "journalId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payment_allocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "vendor_payment_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "outputItemId" TEXT,
    "yieldQty" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "yieldUomId" TEXT,
    "portionSize" DECIMAL(14,4),
    "instructions" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "theoreticalCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "itemId" TEXT,
    "subRecipeId" TEXT,
    "qty" DECIMAL(14,6) NOT NULL,
    "uomId" TEXT NOT NULL,
    "wastagePct" DECIMAL(6,3) NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_version" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "cost" DECIMAL(14,4) NOT NULL,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "plannedQty" DECIMAL(14,4) NOT NULL,
    "producedQty" DECIMAL(14,4),
    "status" "ProductionStatus" NOT NULL DEFAULT 'PLANNED',
    "businessDate" DATE NOT NULL,
    "actualCost" DECIMAL(14,4),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "terminalId" TEXT,
    "number" TEXT,
    "channel" "OrderChannel" NOT NULL,
    "status" "PosOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "tableId" TEXT,
    "guestCount" INTEGER,
    "customerId" TEXT,
    "waiterId" TEXT,
    "parentOrderId" TEXT,
    "folioId" TEXT,
    "externalRef" TEXT,
    "aggregatorCommission" DECIMAL(14,4),
    "businessDate" DATE NOT NULL,
    "subtotal" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "serviceChargeAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "tipAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "roundOff" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "clientOpId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "qty" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxGroupId" TEXT,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "seatNumber" INTEGER,
    "courseNumber" INTEGER,
    "kitchenStationId" TEXT,
    "note" TEXT,
    "voidReason" TEXT,
    "voidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order_item_modifier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "modifierId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL DEFAULT 0,

    CONSTRAINT "pos_order_item_modifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "kitchenStationId" TEXT NOT NULL,
    "status" "KotStatus" NOT NULL DEFAULT 'FIRED',
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3),
    "bumpedAt" TIMESTAMP(3),

    CONSTRAINT "kot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kot_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kotId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "qty" DECIMAL(10,3) NOT NULL,
    "modifiersSnapshot" TEXT,
    "note" TEXT,

    CONSTRAINT "kot_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cashSessionId" TEXT,
    "tender" "TenderType" NOT NULL,
    "status" "PosPaymentStatus" NOT NULL DEFAULT 'CAPTURED',
    "amount" DECIMAL(14,4) NOT NULL,
    "tipAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "reference" TEXT,
    "gatewayPayload" JSONB,
    "giftCardId" TEXT,
    "folioId" TEXT,
    "refundedAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "capturedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_discount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "couponId" TEXT,
    "reason" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_session" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "closedBy" TEXT,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "openingFloat" DECIMAL(14,4) NOT NULL,
    "expectedCash" DECIMAL(14,4),
    "countedCash" DECIMAL(14,4),
    "overShort" DECIMAL(14,4),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "businessDate" DATE NOT NULL,
    "note" TEXT,

    CONSTRAINT "cash_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "baseOccupancy" INTEGER NOT NULL DEFAULT 2,
    "maxOccupancy" INTEGER NOT NULL DEFAULT 3,
    "baseRate" DECIMAL(14,4) NOT NULL,
    "extraBedRate" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "room_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'VACANT_CLEAN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_plan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rate" DECIMAL(14,4) NOT NULL,
    "mealPlan" TEXT NOT NULL DEFAULT 'EP',
    "taxGroupId" TEXT,
    "cancellationPolicy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rate_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_override" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rate" DECIMAL(14,4) NOT NULL,
    "minStay" INTEGER,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rate_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_profile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "nationality" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "company" TEXT,
    "vip" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "guest_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "source" "ReservationSource" NOT NULL DEFAULT 'DIRECT',
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "corporateAccountId" TEXT,
    "agentCommissionPct" DECIMAL(6,3),
    "depositAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_room" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "roomId" TEXT,
    "nightlyRate" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "reservation_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stay" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" "StayStatus" NOT NULL DEFAULT 'IN_HOUSE',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMP(3),

    CONSTRAINT "stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_folio" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "status" "FolioStatus" NOT NULL DEFAULT 'OPEN',
    "totalCharges" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalPayments" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_folio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folio_charge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "type" "FolioChargeType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "businessDate" DATE NOT NULL,
    "postedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folio_charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folio_payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "reference" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folio_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housekeeping_task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" "HousekeepingTaskType" NOT NULL,
    "status" "HousekeepingTaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_bottle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "batchId" TEXT,
    "status" "BottleStatus" NOT NULL DEFAULT 'SEALED',
    "volumeMl" DECIMAL(10,2) NOT NULL,
    "remainingMl" DECIMAL(10,2) NOT NULL,
    "openedAt" TIMESTAMP(3),
    "openedBy" TEXT,
    "emptiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_bottle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_pour" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "type" "PourType" NOT NULL,
    "volumeMl" DECIMAL(10,2) NOT NULL,
    "orderItemId" TEXT,
    "reason" TEXT,
    "pouredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_pour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "birthday" DATE,
    "anniversary" DATE,
    "addressLine1" TEXT,
    "city" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "walletBalance" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "loyaltyPoints" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "loyaltyTier" TEXT,
    "creditLimit" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "creditBalance" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LoyaltyEntryType" NOT NULL,
    "points" DECIMAL(14,4) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_program" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Loyalty',
    "earnRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "redeemValue" DECIMAL(10,4) NOT NULL DEFAULT 0.25,
    "pointExpiryDays" INTEGER,
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loyalty_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialValue" DECIMAL(14,4) NOT NULL,
    "balance" DECIMAL(14,4) NOT NULL,
    "status" "GiftCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "customerId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "minOrderAmount" DECIMAL(14,4),
    "maxDiscountAmount" DECIMAL(14,4),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "channels" "OrderChannel"[] DEFAULT ARRAY[]::"OrderChannel"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "segment" JSONB NOT NULL DEFAULT '{}',
    "template" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "trigger" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_account" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT,
    "systemSlot" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
    "businessDate" DATE NOT NULL,
    "memo" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "reversesJournalId" TEXT,
    "postedBy" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "locationId" TEXT,
    "outletId" TEXT,
    "costCenter" TEXT,
    "memo" TEXT,

    CONSTRAINT "journal_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_group" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "totalRate" DECIMAL(6,3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tax_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_component" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(6,3) NOT NULL,
    "accountSlot" TEXT,

    CONSTRAINT "tax_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_year" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,

    CONSTRAINT "fiscal_year_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_period" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "accounting_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT,
    "accountId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "reference" TEXT,
    "status" "BankTxnStatus" NOT NULL DEFAULT 'UNRECONCILED',
    "matchedJournalLineId" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fiscalYearLabel" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "budget_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT,
    "userId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" DATE NOT NULL,
    "exitedAt" DATE,
    "monthlySalary" DECIMAL(14,4),
    "hourlyRate" DECIMAL(14,4),
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "pfNumber" TEXT,
    "esiNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_entry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "roster_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_record" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "source" "PunchSource" NOT NULL DEFAULT 'MANUAL',
    "workedMinutes" INTEGER,
    "overtimeMinutes" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_type" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "annualQuota" DECIMAL(6,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "leave_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" DECIMAL(5,2) NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "journalId" TEXT,
    "processedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "gross" DECIMAL(14,4) NOT NULL,
    "deductions" DECIMAL(14,4) NOT NULL,
    "net" DECIMAL(14,4) NOT NULL,
    "components" JSONB NOT NULL DEFAULT '[]',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_USE',
    "purchaseDate" DATE NOT NULL,
    "purchaseCost" DECIMAL(14,4) NOT NULL,
    "salvageValue" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "usefulLifeMonths" INTEGER NOT NULL,
    "depreciationMethod" "DepreciationMethod" NOT NULL DEFAULT 'STRAIGHT_LINE',
    "accumulatedDepreciation" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "vendorId" TEXT,
    "serialNumber" TEXT,
    "warrantyUntil" DATE,
    "disposedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciation_entry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "journalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depreciation_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amc_contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "vendorId" TEXT,
    "contractNumber" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "cost" DECIMAL(14,4) NOT NULL,
    "coverage" TEXT,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "amc_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_ticket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(14,4),
    "assignedTo" TEXT,
    "isPreventive" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_event" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_event" (
    "id" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_key" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "eventTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "responseStatus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecast" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "inventoryItemId" TEXT,
    "date" DATE NOT NULL,
    "predictedQty" DECIMAL(14,4) NOT NULL,
    "confidence" DECIMAL(5,4),
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_alert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" "AnomalySeverity" NOT NULL DEFAULT 'WARNING',
    "status" "AnomalyStatus" NOT NULL DEFAULT 'OPEN',
    "locationId" TEXT,
    "outletId" TEXT,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "summary" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "anomaly_alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "module_subscription_tenantId_moduleCode_key" ON "module_subscription"("tenantId", "moduleCode");

-- CreateIndex
CREATE INDEX "company_tenantId_idx" ON "company"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "company_tenantId_code_key" ON "company"("tenantId", "code");

-- CreateIndex
CREATE INDEX "brand_tenantId_idx" ON "brand"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_tenantId_code_key" ON "brand"("tenantId", "code");

-- CreateIndex
CREATE INDEX "location_tenantId_idx" ON "location"("tenantId");

-- CreateIndex
CREATE INDEX "location_tenantId_companyId_idx" ON "location"("tenantId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "location_tenantId_code_key" ON "location"("tenantId", "code");

-- CreateIndex
CREATE INDEX "outlet_tenantId_idx" ON "outlet"("tenantId");

-- CreateIndex
CREATE INDEX "outlet_tenantId_locationId_idx" ON "outlet"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "outlet_tenantId_code_key" ON "outlet"("tenantId", "code");

-- CreateIndex
CREATE INDEX "floor_tenantId_idx" ON "floor"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "dining_table_qrToken_key" ON "dining_table"("qrToken");

-- CreateIndex
CREATE INDEX "dining_table_tenantId_idx" ON "dining_table"("tenantId");

-- CreateIndex
CREATE INDEX "dining_table_tenantId_floorId_idx" ON "dining_table"("tenantId", "floorId");

-- CreateIndex
CREATE INDEX "pos_terminal_tenantId_outletId_idx" ON "pos_terminal"("tenantId", "outletId");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminal_tenantId_code_key" ON "pos_terminal"("tenantId", "code");

-- CreateIndex
CREATE INDEX "store_tenantId_locationId_idx" ON "store"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "store_tenantId_code_key" ON "store"("tenantId", "code");

-- CreateIndex
CREATE INDEX "kitchen_station_tenantId_locationId_idx" ON "kitchen_station"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "kitchen_station_tenantId_code_key" ON "kitchen_station"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequence_tenantId_companyId_docType_fiscalYear_key" ON "document_sequence"("tenantId", "companyId", "docType", "fiscalYear");

-- CreateIndex
CREATE INDEX "terminal_sequence_block_tenantId_terminalId_idx" ON "terminal_sequence_block"("tenantId", "terminalId");

-- CreateIndex
CREATE INDEX "user_tenantId_idx" ON "user"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenantId_email_key" ON "user"("tenantId", "email");

-- CreateIndex
CREATE INDEX "role_tenantId_idx" ON "role"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "role_tenantId_code_key" ON "role"("tenantId", "code");

-- CreateIndex
CREATE INDEX "role_permission_tenantId_idx" ON "role_permission"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_roleId_permission_key" ON "role_permission"("roleId", "permission");

-- CreateIndex
CREATE INDEX "user_role_assignment_tenantId_idx" ON "user_role_assignment"("tenantId");

-- CreateIndex
CREATE INDEX "user_role_assignment_tenantId_userId_idx" ON "user_role_assignment"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignment_userId_roleId_scopeType_companyId_loca_key" ON "user_role_assignment"("userId", "roleId", "scopeType", "companyId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_session_tokenHash_key" ON "refresh_session"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_session_tenantId_userId_idx" ON "refresh_session"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "audit_log_tenantId_createdAt_idx" ON "audit_log"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_tenantId_entityType_entityId_idx" ON "audit_log"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "category_tenantId_idx" ON "category"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "category_tenantId_code_key" ON "category"("tenantId", "code");

-- CreateIndex
CREATE INDEX "menu_item_tenantId_idx" ON "menu_item"("tenantId");

-- CreateIndex
CREATE INDEX "menu_item_tenantId_categoryId_idx" ON "menu_item"("tenantId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_tenantId_code_key" ON "menu_item"("tenantId", "code");

-- CreateIndex
CREATE INDEX "menu_item_variant_tenantId_menuItemId_idx" ON "menu_item_variant"("tenantId", "menuItemId");

-- CreateIndex
CREATE INDEX "modifier_group_tenantId_idx" ON "modifier_group"("tenantId");

-- CreateIndex
CREATE INDEX "modifier_tenantId_idx" ON "modifier"("tenantId");

-- CreateIndex
CREATE INDEX "menu_item_modifier_group_tenantId_idx" ON "menu_item_modifier_group"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_modifier_group_menuItemId_modifierGroupId_key" ON "menu_item_modifier_group"("menuItemId", "modifierGroupId");

-- CreateIndex
CREATE INDEX "price_list_tenantId_idx" ON "price_list"("tenantId");

-- CreateIndex
CREATE INDEX "price_list_tenantId_outletId_idx" ON "price_list"("tenantId", "outletId");

-- CreateIndex
CREATE INDEX "price_list_item_tenantId_idx" ON "price_list_item"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_item_priceListId_menuItemVariantId_key" ON "price_list_item"("priceListId", "menuItemVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "uom_tenantId_code_key" ON "uom"("tenantId", "code");

-- CreateIndex
CREATE INDEX "uom_conversion_tenantId_idx" ON "uom_conversion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "uom_conversion_itemId_fromUomId_toUomId_key" ON "uom_conversion"("itemId", "fromUomId", "toUomId");

-- CreateIndex
CREATE INDEX "inventory_item_tenantId_idx" ON "inventory_item"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_item_tenantId_type_idx" ON "inventory_item"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_tenantId_code_key" ON "inventory_item"("tenantId", "code");

-- CreateIndex
CREATE INDEX "reorder_level_tenantId_storeId_idx" ON "reorder_level"("tenantId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_level_itemId_storeId_key" ON "reorder_level"("itemId", "storeId");

-- CreateIndex
CREATE INDEX "stock_summary_tenantId_storeId_idx" ON "stock_summary"("tenantId", "storeId");

-- CreateIndex
CREATE INDEX "stock_summary_tenantId_itemId_idx" ON "stock_summary"("tenantId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_summary_storeId_itemId_key" ON "stock_summary"("storeId", "itemId");

-- CreateIndex
CREATE INDEX "stock_batch_tenantId_storeId_itemId_idx" ON "stock_batch"("tenantId", "storeId", "itemId");

-- CreateIndex
CREATE INDEX "stock_batch_tenantId_expiryDate_idx" ON "stock_batch"("tenantId", "expiryDate");

-- CreateIndex
CREATE INDEX "stock_ledger_tenantId_storeId_itemId_createdAt_idx" ON "stock_ledger"("tenantId", "storeId", "itemId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_ledger_tenantId_sourceType_sourceId_idx" ON "stock_ledger"("tenantId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "stock_ledger_tenantId_businessDate_idx" ON "stock_ledger"("tenantId", "businessDate");

-- CreateIndex
CREATE INDEX "stock_transfer_tenantId_fromStoreId_idx" ON "stock_transfer"("tenantId", "fromStoreId");

-- CreateIndex
CREATE INDEX "stock_transfer_tenantId_toStoreId_idx" ON "stock_transfer"("tenantId", "toStoreId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_tenantId_number_key" ON "stock_transfer"("tenantId", "number");

-- CreateIndex
CREATE INDEX "stock_transfer_line_tenantId_idx" ON "stock_transfer_line"("tenantId");

-- CreateIndex
CREATE INDEX "stock_adjustment_tenantId_storeId_idx" ON "stock_adjustment"("tenantId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_adjustment_tenantId_number_key" ON "stock_adjustment"("tenantId", "number");

-- CreateIndex
CREATE INDEX "stock_adjustment_line_tenantId_idx" ON "stock_adjustment_line"("tenantId");

-- CreateIndex
CREATE INDEX "stock_count_tenantId_storeId_idx" ON "stock_count"("tenantId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_count_tenantId_number_key" ON "stock_count"("tenantId", "number");

-- CreateIndex
CREATE INDEX "stock_count_line_tenantId_idx" ON "stock_count_line"("tenantId");

-- CreateIndex
CREATE INDEX "vendor_tenantId_idx" ON "vendor"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_tenantId_code_key" ON "vendor"("tenantId", "code");

-- CreateIndex
CREATE INDEX "vendor_item_tenantId_itemId_idx" ON "vendor_item"("tenantId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_item_vendorId_itemId_key" ON "vendor_item"("vendorId", "itemId");

-- CreateIndex
CREATE INDEX "purchase_request_tenantId_locationId_idx" ON "purchase_request"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_request_tenantId_number_key" ON "purchase_request"("tenantId", "number");

-- CreateIndex
CREATE INDEX "purchase_request_line_tenantId_idx" ON "purchase_request_line"("tenantId");

-- CreateIndex
CREATE INDEX "rfq_tenantId_idx" ON "rfq"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_tenantId_number_key" ON "rfq"("tenantId", "number");

-- CreateIndex
CREATE INDEX "rfq_quote_tenantId_idx" ON "rfq_quote"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_quote_rfqId_vendorId_key" ON "rfq_quote"("rfqId", "vendorId");

-- CreateIndex
CREATE INDEX "rfq_quote_line_tenantId_idx" ON "rfq_quote_line"("tenantId");

-- CreateIndex
CREATE INDEX "purchase_order_tenantId_vendorId_idx" ON "purchase_order"("tenantId", "vendorId");

-- CreateIndex
CREATE INDEX "purchase_order_tenantId_status_idx" ON "purchase_order"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_tenantId_companyId_number_key" ON "purchase_order"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "purchase_order_line_tenantId_idx" ON "purchase_order_line"("tenantId");

-- CreateIndex
CREATE INDEX "goods_receipt_tenantId_vendorId_idx" ON "goods_receipt"("tenantId", "vendorId");

-- CreateIndex
CREATE INDEX "goods_receipt_tenantId_poId_idx" ON "goods_receipt"("tenantId", "poId");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_tenantId_companyId_number_key" ON "goods_receipt"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "goods_receipt_line_tenantId_idx" ON "goods_receipt_line"("tenantId");

-- CreateIndex
CREATE INDEX "purchase_invoice_tenantId_vendorId_idx" ON "purchase_invoice"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoice_tenantId_companyId_number_key" ON "purchase_invoice"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "purchase_invoice_line_tenantId_idx" ON "purchase_invoice_line"("tenantId");

-- CreateIndex
CREATE INDEX "vendor_note_tenantId_vendorId_idx" ON "vendor_note"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_note_tenantId_companyId_number_key" ON "vendor_note"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "vendor_payment_tenantId_vendorId_idx" ON "vendor_payment"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payment_tenantId_companyId_number_key" ON "vendor_payment"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "vendor_payment_allocation_tenantId_invoiceId_idx" ON "vendor_payment_allocation"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "vendor_ledger_tenantId_vendorId_businessDate_idx" ON "vendor_ledger"("tenantId", "vendorId", "businessDate");

-- CreateIndex
CREATE INDEX "recipe_tenantId_idx" ON "recipe"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_tenantId_code_key" ON "recipe"("tenantId", "code");

-- CreateIndex
CREATE INDEX "recipe_ingredient_tenantId_recipeId_idx" ON "recipe_ingredient"("tenantId", "recipeId");

-- CreateIndex
CREATE INDEX "recipe_version_tenantId_idx" ON "recipe_version"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_version_recipeId_version_key" ON "recipe_version"("recipeId", "version");

-- CreateIndex
CREATE INDEX "production_order_tenantId_storeId_idx" ON "production_order"("tenantId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_tenantId_number_key" ON "production_order"("tenantId", "number");

-- CreateIndex
CREATE INDEX "pos_order_tenantId_outletId_businessDate_idx" ON "pos_order"("tenantId", "outletId", "businessDate");

-- CreateIndex
CREATE INDEX "pos_order_tenantId_status_idx" ON "pos_order"("tenantId", "status");

-- CreateIndex
CREATE INDEX "pos_order_tenantId_customerId_idx" ON "pos_order"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "pos_order_tenantId_companyId_number_key" ON "pos_order"("tenantId", "companyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "pos_order_tenantId_terminalId_clientOpId_key" ON "pos_order"("tenantId", "terminalId", "clientOpId");

-- CreateIndex
CREATE INDEX "pos_order_item_tenantId_orderId_idx" ON "pos_order_item"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "pos_order_item_modifier_tenantId_idx" ON "pos_order_item_modifier"("tenantId");

-- CreateIndex
CREATE INDEX "kot_tenantId_kitchenStationId_status_idx" ON "kot"("tenantId", "kitchenStationId", "status");

-- CreateIndex
CREATE INDEX "kot_item_tenantId_idx" ON "kot_item"("tenantId");

-- CreateIndex
CREATE INDEX "pos_payment_tenantId_cashSessionId_idx" ON "pos_payment"("tenantId", "cashSessionId");

-- CreateIndex
CREATE INDEX "pos_payment_tenantId_orderId_idx" ON "pos_payment"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "order_discount_tenantId_idx" ON "order_discount"("tenantId");

-- CreateIndex
CREATE INDEX "cash_session_tenantId_outletId_businessDate_idx" ON "cash_session"("tenantId", "outletId", "businessDate");

-- CreateIndex
CREATE INDEX "cash_movement_tenantId_idx" ON "cash_movement"("tenantId");

-- CreateIndex
CREATE INDEX "room_type_tenantId_locationId_idx" ON "room_type"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "room_type_tenantId_code_key" ON "room_type"("tenantId", "code");

-- CreateIndex
CREATE INDEX "room_tenantId_locationId_idx" ON "room"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "room_tenantId_locationId_number_key" ON "room"("tenantId", "locationId", "number");

-- CreateIndex
CREATE INDEX "rate_plan_tenantId_idx" ON "rate_plan"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_plan_tenantId_code_key" ON "rate_plan"("tenantId", "code");

-- CreateIndex
CREATE INDEX "rate_override_tenantId_idx" ON "rate_override"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_override_ratePlanId_date_key" ON "rate_override"("ratePlanId", "date");

-- CreateIndex
CREATE INDEX "guest_profile_tenantId_phone_idx" ON "guest_profile"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "guest_profile_tenantId_email_idx" ON "guest_profile"("tenantId", "email");

-- CreateIndex
CREATE INDEX "reservation_tenantId_locationId_checkInDate_idx" ON "reservation"("tenantId", "locationId", "checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_tenantId_number_key" ON "reservation"("tenantId", "number");

-- CreateIndex
CREATE INDEX "reservation_room_tenantId_idx" ON "reservation_room"("tenantId");

-- CreateIndex
CREATE INDEX "stay_tenantId_locationId_status_idx" ON "stay"("tenantId", "locationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_folio_stayId_key" ON "hotel_folio"("stayId");

-- CreateIndex
CREATE INDEX "hotel_folio_tenantId_idx" ON "hotel_folio"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_folio_tenantId_companyId_number_key" ON "hotel_folio"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "folio_charge_tenantId_folioId_idx" ON "folio_charge"("tenantId", "folioId");

-- CreateIndex
CREATE INDEX "folio_payment_tenantId_folioId_idx" ON "folio_payment"("tenantId", "folioId");

-- CreateIndex
CREATE INDEX "housekeeping_task_tenantId_locationId_status_idx" ON "housekeeping_task"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "bar_bottle_tenantId_storeId_status_idx" ON "bar_bottle"("tenantId", "storeId", "status");

-- CreateIndex
CREATE INDEX "bar_pour_tenantId_bottleId_idx" ON "bar_pour"("tenantId", "bottleId");

-- CreateIndex
CREATE INDEX "customer_tenantId_email_idx" ON "customer"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tenantId_phone_key" ON "customer"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "wallet_ledger_tenantId_customerId_idx" ON "wallet_ledger"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "loyalty_ledger_tenantId_customerId_idx" ON "loyalty_ledger"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_program_tenantId_key" ON "loyalty_program"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_tenantId_code_key" ON "gift_card"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_tenantId_code_key" ON "coupon"("tenantId", "code");

-- CreateIndex
CREATE INDEX "campaign_tenantId_status_idx" ON "campaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "chart_of_account_tenantId_companyId_idx" ON "chart_of_account"("tenantId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_account_tenantId_companyId_code_key" ON "chart_of_account"("tenantId", "companyId", "code");

-- CreateIndex
CREATE INDEX "journal_tenantId_companyId_businessDate_idx" ON "journal"("tenantId", "companyId", "businessDate");

-- CreateIndex
CREATE INDEX "journal_tenantId_sourceType_sourceId_idx" ON "journal"("tenantId", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "journal_tenantId_companyId_number_key" ON "journal"("tenantId", "companyId", "number");

-- CreateIndex
CREATE INDEX "journal_line_tenantId_accountId_idx" ON "journal_line"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "journal_line_tenantId_journalId_idx" ON "journal_line"("tenantId", "journalId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_group_tenantId_code_key" ON "tax_group"("tenantId", "code");

-- CreateIndex
CREATE INDEX "tax_component_tenantId_idx" ON "tax_component"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_year_tenantId_companyId_label_key" ON "fiscal_year"("tenantId", "companyId", "label");

-- CreateIndex
CREATE INDEX "accounting_period_tenantId_idx" ON "accounting_period"("tenantId");

-- CreateIndex
CREATE INDEX "bank_account_tenantId_companyId_idx" ON "bank_account"("tenantId", "companyId");

-- CreateIndex
CREATE INDEX "bank_transaction_tenantId_bankAccountId_status_idx" ON "bank_transaction"("tenantId", "bankAccountId", "status");

-- CreateIndex
CREATE INDEX "budget_tenantId_companyId_idx" ON "budget"("tenantId", "companyId");

-- CreateIndex
CREATE INDEX "budget_line_tenantId_idx" ON "budget_line"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_line_budgetId_accountId_month_key" ON "budget_line"("budgetId", "accountId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "employee_userId_key" ON "employee"("userId");

-- CreateIndex
CREATE INDEX "employee_tenantId_locationId_idx" ON "employee"("tenantId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_tenantId_employeeCode_key" ON "employee"("tenantId", "employeeCode");

-- CreateIndex
CREATE INDEX "employee_document_tenantId_idx" ON "employee_document"("tenantId");

-- CreateIndex
CREATE INDEX "shift_tenantId_locationId_idx" ON "shift"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "roster_entry_tenantId_date_idx" ON "roster_entry"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "roster_entry_employeeId_date_shiftId_key" ON "roster_entry"("employeeId", "date", "shiftId");

-- CreateIndex
CREATE INDEX "attendance_record_tenantId_date_idx" ON "attendance_record"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_record_employeeId_date_key" ON "attendance_record"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_tenantId_code_key" ON "leave_type"("tenantId", "code");

-- CreateIndex
CREATE INDEX "leave_request_tenantId_employeeId_idx" ON "leave_request"("tenantId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_run_tenantId_companyId_period_key" ON "payroll_run"("tenantId", "companyId", "period");

-- CreateIndex
CREATE INDEX "payslip_tenantId_idx" ON "payslip"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "payslip_payrollRunId_employeeId_key" ON "payslip"("payrollRunId", "employeeId");

-- CreateIndex
CREATE INDEX "asset_tenantId_companyId_idx" ON "asset"("tenantId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_tenantId_code_key" ON "asset"("tenantId", "code");

-- CreateIndex
CREATE INDEX "depreciation_entry_tenantId_idx" ON "depreciation_entry"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "depreciation_entry_assetId_period_key" ON "depreciation_entry"("assetId", "period");

-- CreateIndex
CREATE INDEX "amc_contract_tenantId_endDate_idx" ON "amc_contract"("tenantId", "endDate");

-- CreateIndex
CREATE INDEX "maintenance_ticket_tenantId_status_idx" ON "maintenance_ticket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "outbox_event_publishedAt_createdAt_idx" ON "outbox_event"("publishedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "processed_event_id_consumer_key" ON "processed_event"("id", "consumer");

-- CreateIndex
CREATE INDEX "idempotency_key_expiresAt_idx" ON "idempotency_key"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_key_tenantId_key_endpoint_key" ON "idempotency_key"("tenantId", "key", "endpoint");

-- CreateIndex
CREATE INDEX "webhook_endpoint_tenantId_idx" ON "webhook_endpoint"("tenantId");

-- CreateIndex
CREATE INDEX "webhook_delivery_tenantId_status_idx" ON "webhook_delivery"("tenantId", "status");

-- CreateIndex
CREATE INDEX "demand_forecast_tenantId_outletId_date_idx" ON "demand_forecast"("tenantId", "outletId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "demand_forecast_tenantId_outletId_menuItemId_inventoryItemI_key" ON "demand_forecast"("tenantId", "outletId", "menuItemId", "inventoryItemId", "date");

-- CreateIndex
CREATE INDEX "anomaly_alert_tenantId_status_detectedAt_idx" ON "anomaly_alert"("tenantId", "status", "detectedAt");

-- AddForeignKey
ALTER TABLE "module_subscription" ADD CONSTRAINT "module_subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand" ADD CONSTRAINT "brand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor" ADD CONSTRAINT "floor_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_table" ADD CONSTRAINT "dining_table_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_station" ADD CONSTRAINT "kitchen_station_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_session" ADD CONSTRAINT "refresh_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_variant" ADD CONSTRAINT "menu_item_variant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier" ADD CONSTRAINT "modifier_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_level" ADD CONSTRAINT "reorder_level_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_line" ADD CONSTRAINT "stock_adjustment_line_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_count_line" ADD CONSTRAINT "stock_count_line_countId_fkey" FOREIGN KEY ("countId") REFERENCES "stock_count"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_item" ADD CONSTRAINT "vendor_item_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_line" ADD CONSTRAINT "purchase_request_line_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quote" ADD CONSTRAINT "rfq_quote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quote_line" ADD CONSTRAINT "rfq_quote_line_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "rfq_quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line" ADD CONSTRAINT "purchase_order_line_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_line" ADD CONSTRAINT "purchase_invoice_line_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payment_allocation" ADD CONSTRAINT "vendor_payment_allocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "vendor_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version" ADD CONSTRAINT "recipe_version_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_item" ADD CONSTRAINT "pos_order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pos_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_item_modifier" ADD CONSTRAINT "pos_order_item_modifier_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "pos_order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kot" ADD CONSTRAINT "kot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pos_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kot_item" ADD CONSTRAINT "kot_item_kotId_fkey" FOREIGN KEY ("kotId") REFERENCES "kot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_payment" ADD CONSTRAINT "pos_payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pos_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pos_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cash_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plan" ADD CONSTRAINT "rate_plan_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_override" ADD CONSTRAINT "rate_override_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "rate_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_room" ADD CONSTRAINT "reservation_room_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay" ADD CONSTRAINT "stay_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_folio" ADD CONSTRAINT "hotel_folio_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "stay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_charge" ADD CONSTRAINT "folio_charge_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "hotel_folio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_payment" ADD CONSTRAINT "folio_payment_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "hotel_folio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_pour" ADD CONSTRAINT "bar_pour_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "bar_bottle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_account" ADD CONSTRAINT "chart_of_account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "chart_of_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_component" ADD CONSTRAINT "tax_component_taxGroupId_fkey" FOREIGN KEY ("taxGroupId") REFERENCES "tax_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_period" ADD CONSTRAINT "accounting_period_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "fiscal_year"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line" ADD CONSTRAINT "budget_line_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_document" ADD CONSTRAINT "employee_document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_entry" ADD CONSTRAINT "roster_entry_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciation_entry" ADD CONSTRAINT "depreciation_entry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contract" ADD CONSTRAINT "amc_contract_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_ticket" ADD CONSTRAINT "maintenance_ticket_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

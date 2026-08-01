-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "clients" (
    "name" VARCHAR(255) NOT NULL,
    "industry" VARCHAR(150),
    "contact_email" VARCHAR(255),
    "contact_name" VARCHAR(150),
    "contact_phone" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logo_url" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "client_code" VARCHAR(50) NOT NULL,
    "country" TEXT,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),
    "gst_number" VARCHAR(30),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "pan_number" VARCHAR(20),
    "postal_code" TEXT,
    "state" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "updatedById" UUID,
    "website" VARCHAR(255),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_code_key" ON "clients"("client_code");

-- CreateIndex
CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "business_sites" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "business_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_business_sites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_site_id" TEXT NOT NULL,

    CONSTRAINT "customer_business_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_sites_business_id_slug_key" ON "business_sites"("business_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "customer_business_sites_user_id_business_site_id_key" ON "customer_business_sites"("user_id", "business_site_id");

-- AddForeignKey
ALTER TABLE "business_sites" ADD CONSTRAINT "business_sites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_business_sites" ADD CONSTRAINT "customer_business_sites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_business_sites" ADD CONSTRAINT "customer_business_sites_business_site_id_fkey" FOREIGN KEY ("business_site_id") REFERENCES "business_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

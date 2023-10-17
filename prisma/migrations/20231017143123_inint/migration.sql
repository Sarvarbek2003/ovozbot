/*
  Warnings:

  - You are about to drop the `Schools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Schools" DROP CONSTRAINT "Schools_region_id_fkey";

-- DropTable
DROP TABLE "Schools";

-- DropTable
DROP TABLE "regions";

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "info" JSONB NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategories" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "info" JSONB NOT NULL,
    "vote" INTEGER NOT NULL,

    CONSTRAINT "Subcategories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Subcategories" ADD CONSTRAINT "Subcategories_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

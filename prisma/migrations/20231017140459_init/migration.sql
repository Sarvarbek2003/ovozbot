-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "name" TEXT,
    "step" TEXT NOT NULL DEFAULT 'home',
    "action" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(5) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "info" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schools" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "info" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,

    CONSTRAINT "Schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chanell" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "chanell_id" TEXT NOT NULL,
    "chanell_username" TEXT NOT NULL,

    CONSTRAINT "Chanell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_chat_id_key" ON "users"("chat_id");

-- AddForeignKey
ALTER TABLE "Schools" ADD CONSTRAINT "Schools_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

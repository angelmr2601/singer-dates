-- Support multiple companions per event via join table
CREATE TABLE "EventCompanion" (
  "eventId" TEXT NOT NULL,
  "companionId" TEXT NOT NULL,
  CONSTRAINT "EventCompanion_pkey" PRIMARY KEY ("eventId", "companionId")
);

CREATE INDEX "EventCompanion_companionId_idx" ON "EventCompanion"("companionId");

ALTER TABLE "EventCompanion"
  ADD CONSTRAINT "EventCompanion_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventCompanion"
  ADD CONSTRAINT "EventCompanion_companionId_fkey"
  FOREIGN KEY ("companionId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "EventCompanion" ("eventId", "companionId")
SELECT "id", "companionId"
FROM "Event"
WHERE "companionId" IS NOT NULL;

ALTER TABLE "Event" DROP CONSTRAINT "Event_companionId_fkey";
DROP INDEX "Event_companionId_idx";
ALTER TABLE "Event" DROP COLUMN "companionId";

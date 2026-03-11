ALTER TABLE "EventCompanion"
ADD COLUMN "companionPrice" DECIMAL(10,2);

UPDATE "EventCompanion" ec
SET "companionPrice" = e."companionPrice"
FROM "Event" e
WHERE e."id" = ec."eventId";

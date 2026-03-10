-- Add companion-specific payment amount for events
ALTER TABLE "Event"
ADD COLUMN "companionPrice" DECIMAL(10,2);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT '',
    "deckUrl" TEXT NOT NULL DEFAULT '',
    "raiseAmount" TEXT NOT NULL DEFAULT '',
    "targetInvestors" TEXT NOT NULL DEFAULT '',
    "sectors" TEXT NOT NULL DEFAULT '[]',
    "location" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL
);
INSERT INTO "new_Project" ("createdAt", "deckUrl", "description", "id", "location", "name", "raiseAmount", "sectors", "stage", "targetInvestors", "website") SELECT "createdAt", "deckUrl", "description", "id", "location", "name", "raiseAmount", "sectors", "stage", "targetInvestors", "website" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

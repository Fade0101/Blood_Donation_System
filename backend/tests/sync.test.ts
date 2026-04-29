/**
 * QA Test Suite: Offline-First Sync System
 * Focus: Idempotency, Duplicate Prevention, Race Conditions, Data Safety
 */

import prisma from "../src/config/prisma";
import { syncOfflineData } from "../src/services/sync.service";

// ============================================================================
// TEST SETUP
// ============================================================================

async function setupTestData() {
  // Create a test campaign
  const campaign = await prisma.campaign.create({
    data: {
      campaignNumber: Math.floor(Math.random() * 100000),
      startDate: new Date(),
    },
  });

  return campaign;
}

async function cleanupTestData(campaignId: string) {
  // Clean up all test data
  await prisma.donorCampaign.deleteMany({
    where: { campaignId },
  });

  await prisma.campaign.delete({
    where: { id: campaignId },
  });

  // Clean up any orphaned donors
  const orphanedDonors = await prisma.donor.findMany({
    where: {
      campaigns: {
        none: {},
      },
    },
  });

  for (const donor of orphanedDonors) {
    await prisma.donor.delete({
      where: { id: donor.id },
    });
  }
}

// ============================================================================
// TEST 1: IDEMPOTENCY - Same Request Multiple Times
// ============================================================================

async function test1_Idempotency() {
  console.log("\n📋 TEST 1: IDEMPOTENCY");
  console.log("Scenario: Send SAME request 3 times");

  const campaign = await setupTestData();
  const syncId = "sync-idempotent-001";

  const donorPayload = {
    nationalId: "ID-IDEM-001",
    name: "John Doe",
    phone: "555-0001",
    address: "123 Main St",
    offlineSyncId: syncId,
  };

  try {
    // Send request 1
    console.log("  → Request 1...");
    const result1 = await syncOfflineData(campaign.id, [donorPayload]);
    console.log(`    Status: ${result1.results[0].status}`);

    // Send request 2 (identical)
    console.log("  → Request 2 (identical)...");
    const result2 = await syncOfflineData(campaign.id, [donorPayload]);
    console.log(`    Status: ${result2.results[0].status}`);

    // Send request 3 (identical)
    console.log("  → Request 3 (identical)...");
    const result3 = await syncOfflineData(campaign.id, [donorPayload]);
    console.log(`    Status: ${result3.results[0].status}`);

    // Verify only ONE record exists
    const registrations = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    console.log(`\n  ✓ Expected: 1 registration, Got: ${registrations.length}`);
    console.log(`  ✓ Expected: result2 & result3 = "duplicate_sync", Got: ${result2.results[0].status}, ${result3.results[0].status}`);

    const passed =
      registrations.length === 1 &&
      result2.results[0].status === "duplicate_sync" &&
      result3.results[0].status === "duplicate_sync";

    console.log(`\n  ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    return passed;
  } finally {
    await cleanupTestData(campaign.id);
  }
}

// ============================================================================
// TEST 2: DUPLICATE PREVENTION - Same Donor, Different Sync IDs
// ============================================================================

async function test2_DuplicatePrevention() {
  console.log("\n📋 TEST 2: DUPLICATE PREVENTION");
  console.log("Scenario: Same donor (nationalId), different offlineSyncIds");

  const campaign = await setupTestData();

  const donor1 = {
    nationalId: "ID-DUP-001",
    name: "Jane Smith",
    phone: "555-0002",
    address: "456 Oak Ave",
    offlineSyncId: "sync-dup-001",
  };

  const donor2 = {
    nationalId: "ID-DUP-001", // SAME nationalId
    name: "Jane Smith",
    phone: "555-0002",
    address: "456 Oak Ave",
    offlineSyncId: "sync-dup-002", // DIFFERENT syncId
  };

  try {
    console.log("  → Request 1 (syncId: sync-dup-001)...");
    const result1 = await syncOfflineData(campaign.id, [donor1]);
    console.log(`    Status: ${result1.results[0].status}`);

    console.log("  → Request 2 (syncId: sync-dup-002, same nationalId)...");
    const result2 = await syncOfflineData(campaign.id, [donor2]);
    console.log(`    Status: ${result2.results[0].status}`);

    // Verify only ONE registration exists
    const registrations = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    console.log(`\n  ✓ Expected: 1 registration, Got: ${registrations.length}`);
    console.log(`  ✓ Expected: result2 = "already_registered", Got: ${result2.results[0].status}`);

    const passed =
      registrations.length === 1 &&
      result2.results[0].status === "already_registered";

    console.log(`\n  ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    return passed;
  } finally {
    await cleanupTestData(campaign.id);
  }
}

// ============================================================================
// TEST 3: RACE CONDITION - Concurrent Requests with Same Donor
// ============================================================================

async function test3_RaceCondition() {
  console.log("\n📋 TEST 3: RACE CONDITION SIMULATION");
  console.log("Scenario: Two concurrent requests, same donor, different syncIds");

  const campaign = await setupTestData();

  const requestA = {
    nationalId: "ID-RACE-001",
    name: "Bob Johnson",
    phone: "555-0003",
    address: "789 Pine Rd",
    offlineSyncId: "sync-race-001",
  };

  const requestB = {
    nationalId: "ID-RACE-001", // SAME donor
    name: "Bob Johnson",
    phone: "555-0003",
    address: "789 Pine Rd",
    offlineSyncId: "sync-race-002", // DIFFERENT syncId
  };

  try {
    console.log("  → Sending Request A and B simultaneously...");
    // Simulate concurrent requests
    const [resultA, resultB] = await Promise.all([
      syncOfflineData(campaign.id, [requestA]),
      syncOfflineData(campaign.id, [requestB]),
    ]);

    console.log(`    Request A Status: ${resultA.results[0].status}`);
    console.log(`    Request B Status: ${resultB.results[0].status}`);

    // Verify only ONE registration exists
    const registrations = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    const syncIds = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
      select: { offlineSyncId: true },
    });

    console.log(`\n  ✓ Expected: 1 registration, Got: ${registrations.length}`);
    console.log(`  ✓ SyncIds in DB: ${syncIds.map((s) => s.offlineSyncId).join(", ")}`);

    const passed = registrations.length === 1;

    console.log(`\n  ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    return passed;
  } finally {
    await cleanupTestData(campaign.id);
  }
}

// ============================================================================
// TEST 4: RETRY BEHAVIOR - Network Retry Simulation
// ============================================================================

async function test4_RetryBehavior() {
  console.log("\n📋 TEST 4: RETRY BEHAVIOR");
  console.log("Scenario: Same request retried 3 times (network failure simulation)");

  const campaign = await setupTestData();
  const syncId = "sync-retry-001";

  const donorPayload = {
    nationalId: "ID-RETRY-001",
    name: "Alice Brown",
    phone: "555-0004",
    address: "321 Elm St",
    offlineSyncId: syncId,
  };

  try {
    console.log("  → Attempt 1...");
    const attempt1 = await syncOfflineData(campaign.id, [donorPayload]);
    console.log(`    Status: ${attempt1.results[0].status}`);

    console.log("  → Attempt 2 (retry)...");
    const attempt2 = await syncOfflineData(campaign.id, [donorPayload]);
    console.log(`    Status: ${attempt2.results[0].status}`);

    console.log("  → Attempt 3 (retry)...");
    const attempt3 = await syncOfflineData(campaign.id, [donorPayload]);
    console.log(`    Status: ${attempt3.results[0].status}`);

    // Verify only ONE record exists
    const registrations = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    const donorCount = await prisma.donor.count({
      where: {
        nationalId: "ID-RETRY-001",
      },
    });

    console.log(`\n  ✓ Expected: 1 registration, Got: ${registrations.length}`);
    console.log(`  ✓ Expected: 1 donor record, Got: ${donorCount}`);

    const passed =
      registrations.length === 1 &&
      donorCount === 1 &&
      attempt2.results[0].status === "duplicate_sync" &&
      attempt3.results[0].status === "duplicate_sync";

    console.log(`\n  ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    return passed;
  } finally {
    await cleanupTestData(campaign.id);
  }
}

// ============================================================================
// TEST 5: DATA SAFETY - Overwrite Risk
// ============================================================================

async function test5_DataSafety() {
  console.log("\n📋 TEST 5: DATA SAFETY");
  console.log("Scenario: Sync with incomplete data, then complete data");

  const campaign = await setupTestData();

  const incompletePayload = {
    nationalId: "ID-SAFETY-001",
    name: "Charlie Davis",
    phone: "555-0005",
    // address is missing
    offlineSyncId: "sync-safety-001",
  };

  const completePayload = {
    nationalId: "ID-SAFETY-001",
    name: "Charlie Davis",
    phone: "555-0005",
    address: "654 Maple Dr",
    offlineSyncId: "sync-safety-002",
  };

  try {
    console.log("  → Request 1 (incomplete data - no address)...");
    const result1 = await syncOfflineData(campaign.id, [incompletePayload]);
    console.log(`    Status: ${result1.results[0].status}`);

    const donor1 = await prisma.donor.findUnique({
      where: { nationalId: "ID-SAFETY-001" },
    });
    console.log(`    Donor address after request 1: ${donor1?.address || "null"}`);

    console.log("  → Request 2 (complete data with address)...");
    const result2 = await syncOfflineData(campaign.id, [completePayload]);
    console.log(`    Status: ${result2.results[0].status}`);

    const donor2 = await prisma.donor.findUnique({
      where: { nationalId: "ID-SAFETY-001" },
    });
    console.log(`    Donor address after request 2: ${donor2?.address || "null"}`);

    console.log(`\n  ⚠️  OBSERVATION: Donor data was ${donor2?.address ? "UPDATED" : "NOT UPDATED"}`);
    console.log(`  ⚠️  RISK: If incomplete data overwrites complete data, this is a DATA LOSS risk`);

    const registrations = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    console.log(`\n  ✓ Expected: 1 registration, Got: ${registrations.length}`);

    const passed = registrations.length === 1;

    console.log(`\n  ${passed ? "✅ PASSED (but check data integrity)" : "❌ FAILED"}`);
    return passed;
  } finally {
    await cleanupTestData(campaign.id);
  }
}

// ============================================================================
// TEST 6: BATCH SYNC - Multiple Donors in One Request
// ============================================================================

async function test6_BatchSync() {
  console.log("\n📋 TEST 6: BATCH SYNC");
  console.log("Scenario: Multiple donors in single sync request");

  const campaign = await setupTestData();

  const batch = [
    {
      nationalId: "ID-BATCH-001",
      name: "Donor 1",
      phone: "555-0010",
      offlineSyncId: "sync-batch-001",
    },
    {
      nationalId: "ID-BATCH-002",
      name: "Donor 2",
      phone: "555-0011",
      offlineSyncId: "sync-batch-002",
    },
    {
      nationalId: "ID-BATCH-003",
      name: "Donor 3",
      phone: "555-0012",
      offlineSyncId: "sync-batch-003",
    },
  ];

  try {
    console.log("  → Syncing 3 donors in batch...");
    const result = await syncOfflineData(campaign.id, batch);

    console.log(`    Results: ${result.results.map((r) => r.status).join(", ")}`);

    const registrations = await prisma.donorCampaign.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    console.log(`\n  ✓ Expected: 3 registrations, Got: ${registrations.length}`);

    const passed =
      registrations.length === 3 &&
      result.results.every((r) => r.status === "success");

    console.log(`\n  ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    return passed;
  } finally {
    await cleanupTestData(campaign.id);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  OFFLINE-FIRST SYNC SYSTEM - QA TEST SUITE                ║");
  console.log("║  MVP Level Testing: Idempotency, Duplicates, Race Conds   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results = [];

  try {
    results.push(await test1_Idempotency());
    results.push(await test2_DuplicatePrevention());
    results.push(await test3_RaceCondition());
    results.push(await test4_RetryBehavior());
    results.push(await test5_DataSafety());
    results.push(await test6_BatchSync());
  } catch (error) {
    console.error("\n❌ Test suite error:", error);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  TEST SUMMARY                                              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`Passed: ${results.filter((r) => r).length}/${results.length}`);
  console.log(`Failed: ${results.filter((r) => !r).length}/${results.length}`);
}

runAllTests();

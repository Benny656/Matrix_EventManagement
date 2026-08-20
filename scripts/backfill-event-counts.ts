/**
 * Backfill Script: Populate registrationCount, volunteerCount, and computed stats on all events.
 * 
 * IMPORTANT: This script should be run manually after deployment:
 * npx tsx scripts/backfill-event-counts.ts
 */

import { adminDb } from "../src/lib/firebase-admin";

async function backfillEventCounts() {
  console.log("Starting backfill of event registrationCount, volunteerCount, and attendance stats...");

  const eventsSnapshot = await adminDb.collection("events").get();
  console.log(`Found ${eventsSnapshot.size} events to process.`);

  for (const eventDoc of eventsSnapshot.docs) {
    const eventId = eventDoc.id;
    const eventData = eventDoc.data();

    // 1. Count confirmed registrations and volunteers for this event
    const regsSnapshot = await adminDb
      .collection("registrations")
      .where("eventId", "==", eventId)
      .where("status", "==", "REGISTERED")
      .get();

    let regCount = 0;
    let volCount = 0;

    regsSnapshot.docs.forEach((d) => {
      const data = d.data();
      if (data.eventRole === "volunteer") {
        volCount++;
      } else {
        regCount++;
      }
    });

    // 2. Compute attendance rate and check-ins if completed
    let attendanceRate = eventData.attendanceRate ?? 0;
    let uniqueCheckIns = eventData.uniqueCheckIns ?? 0;

    if (eventData.status === "COMPLETED") {
      const sessionsSnapshot = await adminDb
        .collection("sessions")
        .where("eventId", "==", eventId)
        .get();

      const sessionIds = sessionsSnapshot.docs.map((d) => d.id);
      if (sessionIds.length > 0) {
        const attSnapshots = await Promise.all(
          sessionIds.map((sessionId) =>
            adminDb.collection("attendances").where("sessionId", "==", sessionId).get()
          )
        );

        const checkedInStudentIds = new Set<string>();
        attSnapshots.forEach((snap) => {
          snap.docs.forEach((doc) => {
            const att = doc.data();
            if (att.studentId) checkedInStudentIds.add(att.studentId);
          });
        });

        uniqueCheckIns = checkedInStudentIds.size;
        attendanceRate = regCount > 0 ? Number(((uniqueCheckIns / regCount) * 100).toFixed(1)) : 0;
      }
    }

    await eventDoc.ref.update({
      registrationCount: regCount,
      volunteerCount: volCount,
      uniqueCheckIns,
      attendanceRate,
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `Event ${eventId} ("${eventData.title}") updated: registrations=${regCount}, volunteers=${volCount}, attendanceRate=${attendanceRate}%`
    );
  }

  console.log("Backfill completed successfully.");
}

if (require.main === module) {
  backfillEventCounts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}

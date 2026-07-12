import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const userCount = await prisma.user.count();
  const registrationCount = await prisma.registration.count();
  const eventCount = await prisma.event.count();
  const sessionCount = await prisma.session.count();
  const attendanceCount = await prisma.attendance.count();

  console.log("DB Stats:");
  console.log(`Users: ${userCount}`);
  console.log(`Registrations: ${registrationCount}`);
  console.log(`Events: ${eventCount}`);
  console.log(`Sessions: ${sessionCount}`);
  console.log(`Attendances: ${attendanceCount}`);

  if (userCount > 0) {
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Sample Users:", users.map(u => ({ id: u.id, name: u.name, role: u.role, rollNumber: u.rollNumber })));
  }

  if (eventCount > 0) {
    const events = await prisma.event.findMany({ take: 5, include: { sessions: true } });
    console.log("Sample Events:", events.map(e => ({ id: e.id, title: e.title, status: e.status, sessions: e.sessions.map(s => ({ id: s.id, title: s.title })) })));
  }

  if (registrationCount > 0) {
    const registrations = await prisma.registration.findMany({ take: 5, include: { student: true, event: true } });
    console.log("Sample Registrations:", registrations.map(r => ({ id: r.id, student: r.student.name, event: r.event.title, status: r.status })));
  }
}

main().catch(console.error);

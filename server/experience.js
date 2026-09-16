import crypto from "node:crypto";
import { dayStart, uaeDay } from "./subjects.js";

export function localize(record, lang = "en") {
  const { translations, ...rest } = record;
  return { ...rest, ...translations?.[lang === "ar" ? "ar" : "en"] };
}
const pair = (en, ar) => ({ en, ar });
export function enrichDemo(db, now = Date.now()) {
  if (!db.settings.campusDemoV1) return false;
  let changed = false;
  for (const c of db.classes || [])
    if (c.isDemo && !c.translations) {
      const lab = c.host === "noura.ai@demo.rasid.test";
      c.translations = pair(
        {
          title: lab ? "AI applications lab" : "AI foundations",
          location: `Learning studio ${lab ? 2 : 1}`,
        },
        {
          title: lab
            ? "مختبر تطبيقات الذكاء الاصطناعي"
            : "أساسيات الذكاء الاصطناعي",
          location: `قاعة التعلم ${lab ? 2 : 1}`,
        },
      );
      changed = true;
    }
  for (const g of db.groups || [])
    if (g.isDemo && !g.translations) {
      g.translations = pair(
        {
          name:
            g.teacher === "noura.ai@demo.rasid.test"
              ? "AI applications"
              : "AI pioneers",
        },
        { name: g.name },
      );
      changed = true;
    }
  for (const a of db.absences || [])
    if (a.isDemo && !a.translations) {
      a.translations = pair(
        {
          note:
            a.status === "approved"
              ? "Sample leave to demonstrate coverage alerts"
              : "Sample absence request",
        },
        { note: a.note },
      );
      changed = true;
    }
  if (db.settings.experienceDemoV1) return changed;
  db.messages ||= [];
  db.slots ||= [];
  db.bookings ||= [];
  db.alerts ||= [];
  const teachers = ["khalid.ai@demo.rasid.test", "noura.ai@demo.rasid.test"];
  const students = Object.values(db.users).filter(
    (u) => u.isDemo && u.role === "student",
  );
  const base = dayStart(uaeDay(now)) + 86400000;
  teachers.forEach((host, i) => {
    if (!db.users[host]?.isDemo) return;
    const members = students
      .filter((u) => u.teacherEmail === host)
      .map((u) => u.email);
    const translations = pair(
      {
        subject: i
          ? "Try the AI model sandbox"
          : "Your next AI learning session",
        body: i
          ? "Move the threshold slider in the AI lab. Compare precision and recall, then explain your choice. This is a sample announcement."
          : "Your next session covers search algorithms. Explore BFS and DFS in the AI lab before class. This is a sample announcement.",
      },
      {
        subject: i
          ? "جرّب مختبر نموذج الذكاء الاصطناعي"
          : "جلستك القادمة لتعلم الذكاء الاصطناعي",
        body: i
          ? "حرّك مؤشر العتبة في المختبر وقارن الدقة والاسترجاع ثم اشرح اختيارك. هذا إعلان تجريبي."
          : "تتناول الجلسة القادمة خوارزميات البحث. استكشف البحث بالعرض والعمق في المختبر قبل الحصة. هذا إعلان تجريبي.",
      },
    );
    db.messages.push({
      id: crypto.randomUUID(),
      sender: host,
      recipients: members,
      readBy: members.slice(0, 2),
      priority: i ? "normal" : "high",
      subject: translations.en.subject,
      body: translations.en.body,
      translations,
      at: now - (i + 1) * 3600000,
      isDemo: true,
    });
    for (let d = 0; d < 5; d++)
      db.slots.push({
        id: crypto.randomUUID(),
        host,
        start: base + d * 86400000 + (17 + i) * 3600000,
        end: base + d * 86400000 + (17 + i) * 3600000 + 30 * 60000,
        isDemo: true,
      });
    if (members.length) {
      const start = base + (17 + i) * 3600000;
      const booking = {
        id: crypto.randomUUID(),
        slotId: db.slots.find((s) => s.host === host && s.start === start)?.id,
        host,
        requester: members[0],
        start,
        end: start + 30 * 60000,
        status: i ? "approved" : "pending",
        type: "tuition",
        topic: i ? "Model evaluation coaching" : "Search algorithms coaching",
        translations: pair(
          {
            topic: i
              ? "Model evaluation coaching"
              : "Search algorithms coaching",
          },
          {
            topic: i
              ? "جلسة إرشاد لتقييم النماذج"
              : "جلسة إرشاد لخوارزميات البحث",
          },
        ),
        created: now,
        at: now,
        isDemo: true,
      };
      db.bookings.push(booking);
      db.alerts.push({
        id: crypto.randomUUID(),
        email: host,
        kind: "announcement",
        bookingId: booking.id,
        message: "Sample tuition booking. Open Calendar & bookings to review.",
        translations: pair(
          {
            message:
              "Sample tuition booking. Open Calendar & bookings to review.",
          },
          { message: "حجز درس خاص تجريبي. افتح التقويم والحجوزات للمراجعة." },
        ),
        at: now,
        read: false,
        isDemo: true,
      });
    }
  });
  for (const u of students)
    db.alerts.push({
      id: crypto.randomUUID(),
      email: u.email,
      kind: "announcement",
      message: "Sample: explore your AI lab and upcoming class.",
      translations: pair(
        { message: "Sample: explore your AI lab and upcoming class." },
        { message: "مثال: استكشف مختبر الذكاء الاصطناعي وحصتك القادمة." },
      ),
      at: now,
      read: false,
      isDemo: true,
    });
  db.settings.experienceDemoV1 = true;
  return true;
}

// Visible examples for a signed-in owner are internal test records only.
export function ensureOwnerExamples(db, u, now = Date.now()) {
  if (!db.settings.campusDemoV1 || u.role !== "admin") return false;
  let changed=false;
  if(!u.experienceInbox && db.users['khalid.ai@demo.rasid.test']?.isDemo){
    const translations=pair({subject:'Sample: weekly AI teaching update',body:'The sample cohort is ready for search algorithms. Review attendance, inspect learner progress, and approve the pending support meeting. This message demonstrates the staff inbox.'},{subject:'مثال: تحديث أسبوعي لتدريس الذكاء الاصطناعي',body:'المجموعة التجريبية جاهزة لخوارزميات البحث. راجع الحضور وتقدم المتعلمين وطلب اجتماع الدعم المعلق. توضح هذه الرسالة عمل البريد الداخلي.'});
    db.messages.push({id:crypto.randomUUID(),sender:'khalid.ai@demo.rasid.test',recipients:[u.email],readBy:[],priority:'high',subject:translations.en.subject,body:translations.en.body,translations,at:now,isDemo:true});
    u.experienceInbox=true;changed=true;
  }
  if(u.experienceExamples)return changed;
  const student = db.users["student01@demo.rasid.test"];
  if (!student?.isDemo) return changed;
  const start = dayStart(uaeDay(now)) + 86400000 + 15 * 3600000;
  const id = crypto.randomUUID();
  for (let d = 0; d < 3; d++)
    db.slots.push({
      id: crypto.randomUUID(),
      host: u.email,
      start: start + d * 86400000,
      end: start + d * 86400000 + 30 * 60000,
      isDemo: true,
    });
  db.bookings.push({
    id,
    slotId: db.slots.find((s) => s.host === u.email && s.start === start)?.id,
    host: u.email,
    requester: student.email,
    start,
    end: start + 30 * 60000,
    status: "pending",
    type: "meeting",
    topic: "Sample: learning progress review",
    translations: pair(
      { topic: "Sample: learning progress review" },
      { topic: "مثال: اجتماع مراجعة التقدم الدراسي" },
    ),
    created: now,
    at: now,
    isDemo: true,
  });
  db.alerts.push({
    id: crypto.randomUUID(),
    email: u.email,
    kind: "announcement",
    message:
      "Sample meeting request: Aisha would like to review her learning plan. Open Calendar & bookings to approve or decline.",
    translations: pair(
      {
        message:
          "Sample meeting request: Aisha would like to review her learning plan. Open Calendar & bookings to approve or decline.",
      },
      {
        message:
          "طلب اجتماع تجريبي: ترغب عائشة في مراجعة خطتها الدراسية. افتح التقويم والحجوزات للموافقة أو الرفض.",
      },
    ),
    bookingId: id,
    at: now,
    read: false,
    isDemo: true,
  });
  u.experienceExamples = true;
  return true;
}

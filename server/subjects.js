export const SUBJECTS = [
  {
    id: "ai",
    en: "Artificial intelligence",
    ar: "الذكاء الاصطناعي",
    color: "#7056bb",
  },
  { id: "math", en: "Mathematics", ar: "الرياضيات", color: "#35638a" },
  { id: "science", en: "Science", ar: "العلوم", color: "#36776b" },
  {
    id: "arabic",
    en: "Arabic language",
    ar: "اللغة العربية",
    color: "#ae7240",
  },
  {
    id: "english",
    en: "English language",
    ar: "اللغة الإنجليزية",
    color: "#aa5573",
  },
];
export const subjectOf = (u) =>
  SUBJECTS.some((s) => s.id === u?.subject) ? u.subject : "ai";
export const hasAI = (u) => u?.role === "admin" || subjectOf(u) === "ai";
export const uaeDay = (t = Date.now()) =>
  new Date(t + 14400000).toISOString().slice(0, 10);
export const dayStart = (day) => Date.parse(day + "T00:00:00+04:00");

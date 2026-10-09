/** All copy and data for the page. Kavira is a fictional hospital. */

export const BRAND = {
  name: "Kavira",
  full: "Kavira Hospital",
  tagline: "Care, built around you.",
  emergency: "1800 555 0108",
  emergencyHref: "tel:18005550108",
  phone: "+91 20 5555 0100",
  phoneHref: "tel:+912055550100",
  email: "care@kavira.example",
  address: ["Kavira Hospital, Riverside Health Campus", "Baner Road, Pune 411045"],
};

export const NAV = [
  ["Emergency", "#emergency"],
  ["Departments", "#departments"],
  ["Technology", "#technology"],
  ["Doctors", "#doctors"],
  ["Book a visit", "#contact"],
] as const;

export const PILLARS = [
  ["Daylight in every ward", "Narrow floor plates put every bed within nine metres of a window. Patients sleep better and leave sooner."],
  ["Four minutes, door to theatre", "Emergency, imaging and operating theatres are stacked on one vertical spine with dedicated lifts."],
  ["A room of your own", "All 420 inpatient beds are single rooms with space for a family member to stay overnight."],
] as const;

export const EMERGENCY_STATS = [
  { n: 24, suffix: "×7", label: "Trauma team on site" },
  { n: 9, suffix: " min", label: "Avg. city response" },
  { n: 18, suffix: "", label: "ALS ambulances" },
] as const;

export const EMERGENCY_LINES = ["Trauma & accidents", "Stroke — thrombolysis in under 30 min", "Cardiac arrest & chest pain", "Paediatric emergency"];

/** floor: index into the tower's floors (see scene/hospital.ts DEPT_FLOORS) */
export const DEPARTMENTS = [
  {
    no: "04",
    name: "Cardiology",
    body: "A 24-hour cath lab, hybrid theatre and cardiac ICU on one floor — from first ECG to stent without leaving the level.",
    stat: "3,800",
    statLabel: "procedures a year",
    color: "#ff6b6b",
  },
  {
    no: "05",
    name: "Neurosciences",
    body: "Stroke unit, epilepsy monitoring and neuro-rehab, with neurosurgeons and neurologists sharing one team room.",
    stat: "28 min",
    statLabel: "median door-to-needle",
    color: "#a78bfa",
  },
  {
    no: "06",
    name: "Orthopaedics",
    body: "Joint replacement, sports injury and spine care, with physiotherapy gyms beside the wards so recovery starts on day one.",
    stat: "Day 1",
    statLabel: "walking after knee surgery",
    color: "#7dd3fc",
  },
  {
    no: "07",
    name: "Mother & Child",
    body: "Birthing suites, a level-III NICU and paediatric wards, quieter and warmer, on the floor with the best morning light.",
    stat: "Level III",
    statLabel: "neonatal intensive care",
    color: "#fbbf77",
  },
  {
    no: "08",
    name: "Oncology",
    body: "Medical, surgical and radiation oncology working from one tumour board. Day-care chemo bays look out over the river.",
    stat: "1 board",
    statLabel: "every case, every week",
    color: "#6ee7b7",
  },
];

export const TECH = [
  ["3T MRI", "Wide-bore scanner with quiet mode — less noise, shorter scans, fewer sedations for children."],
  ["256-slice CT", "Whole-heart imaging in a single heartbeat, at a fraction of the usual radiation dose."],
  ["Robotic-assisted surgery", "Smaller incisions and faster recovery for urology, gynaecology and general surgery."],
  ["Digital PET-CT", "Earlier, sharper cancer staging that guides every oncology treatment plan."],
  ["Hybrid cath lab", "Catheter and open surgery in the same room, so complex cardiac cases need one procedure, not two."],
] as const;

export const DOCTORS = [
  { name: "Dr. Meera Kulkarni", role: "Chief of Cardiology", years: 22 },
  { name: "Dr. Arjun Rao", role: "Head, Neurosurgery", years: 18 },
  { name: "Dr. Sana Qureshi", role: "Lead, Mother & Child", years: 15 },
  { name: "Dr. Vikram Desai", role: "Director, Oncology", years: 20 },
];

export const STATS = [
  { n: 180, suffix: "+", label: "Specialists" },
  { n: 420, suffix: "", label: "Single-room beds" },
  { n: 14, suffix: "", label: "Operating theatres" },
  { n: 96, suffix: "", label: "ICU beds" },
] as const;

export const NIGHT = [
  ["Rooftop helipad", "Critical patients from across the region land two lifts away from theatre."],
  ["96-bed ICU", "One nurse for every two critical-care patients, around the clock."],
  ["24-hour pharmacy & labs", "Results and medicines at 3 a.m. arrive as fast as they do at noon."],
] as const;

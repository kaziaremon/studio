/**
 * Auto-Scaling Company Statistics Engine
 * Anchor Date: September 25, 2026
 */
const ANCHOR_DATE = new Date('2026-09-25T00:00:00Z');

export function getCompanyStats() {
  const now = new Date();
  
  // 1. Experience Counter Logic:
  // Starts at 2+ Years. Calculates full years elapsed since Sept 25, 2026.
  const diffTime = Math.max(0, now.getTime() - ANCHOR_DATE.getTime());
  const oneYearMs = 365.25 * 24 * 60 * 60 * 1000;
  const yearsPassed = Math.floor(diffTime / oneYearMs);
  const totalExperienceYears = 2 + yearsPassed;

  // 2. Project Counter Logic:
  // Starts at 20+. Formula: 20 + (MonthsPassed * 3).
  let monthsPassed = 0;
  if (now >= ANCHOR_DATE) {
    monthsPassed = (now.getFullYear() - ANCHOR_DATE.getFullYear()) * 12 + (now.getMonth() - ANCHOR_DATE.getMonth());
    if (now.getDate() < ANCHOR_DATE.getDate()) {
      monthsPassed = Math.max(0, monthsPassed - 1);
    }
  }
  const totalProjects = 20 + (monthsPassed * 3);

  // 3. Success Rate:
  // Realistic industry metric strictly set to 98.2%
  const successRate = 98.2;

  return {
    experienceText: `${totalExperienceYears}+ Years`,
    experienceValue: totalExperienceYears,
    projectsText: `${totalProjects}+`,
    projectsValue: totalProjects,
    successRateText: `${successRate}%`,
    successRateValue: successRate,
    avgRoasText: "4.8x",
    uptimeSla: "99.98%"
  };
}

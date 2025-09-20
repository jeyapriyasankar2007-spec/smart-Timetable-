const readline = require("readline");

// Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans)));
}

// Parse "9.30" or "9:30" or "09:30" into minutes since midnight
function parseTimeToMinutes(input) {
  if (!input) return null;
  const s = input.trim().replace(".", ":");
  const parts = s.split(":");
  if (parts.length === 0) return null;
  const h = parseInt(parts[0], 10);
  const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// Format minutes -> HH:MM
function formatMinutes(mins) {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Main
async function main() {
  console.log("📅 Smart Automatic Timetable (CLI Version)\n");

  const subjectsText = await ask("Enter subjects (comma separated): ");
  const subjectList = subjectsText
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const startTimeStr = await ask("Enter college start time (HH:MM or 9.30): ");
  const endTimeStr = await ask("Enter college end time (HH:MM or 16.30): ");
  const subjectDurationStr = await ask(
    "Enter duration per subject (minutes): "
  );
  const intervalTimeStr = await ask("Enter interval time (optional) (HH:MM): ");
  const intervalDurationStr = await ask(
    "Enter interval duration (minutes, default 15): "
  );
  const lunchTimeStr = await ask("Enter lunch time (optional) (HH:MM): ");
  const lunchDurationStr = await ask(
    "Enter lunch duration (minutes, default 60): "
  );

  const startMin = parseTimeToMinutes(startTimeStr);
  let endMin = parseTimeToMinutes(endTimeStr);
  const subjDur = parseInt(subjectDurationStr, 10);
  const intervalMinRaw = parseTimeToMinutes(intervalTimeStr);
  const intervalDur = parseInt(intervalDurationStr, 10) || 15;
  const lunchMinRaw = parseTimeToMinutes(lunchTimeStr);
  const lunchDur = parseInt(lunchDurationStr, 10) || 60;

  if (endMin <= startMin) endMin += 12 * 60; // handle PM end time
  let intervalMin = intervalMinRaw;
  if (intervalMin !== null && intervalMin <= startMin) intervalMin += 12 * 60;
  let lunchMin = lunchMinRaw;
  if (lunchMin !== null && lunchMin <= startMin) lunchMin += 12 * 60;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const timetable = {};
  let globalSubjectIndex = 0;

  for (let day of days) {
    const slots = [];
    let current = startMin;
    let loopGuard = 0;
    while (current < endMin && loopGuard < 1000) {
      loopGuard++;

      if (intervalMin !== null && current === intervalMin) {
        slots.push({ time: formatMinutes(current), subject: "Interval" });
        current += intervalDur;
        continue;
      }

      if (lunchMin !== null && current === lunchMin) {
        slots.push({ time: formatMinutes(current), subject: "Lunch Break" });
        current += lunchDur;
        continue;
      }

      if (current + subjDur > endMin) break;

      const subj = subjectList[globalSubjectIndex % subjectList.length];
      slots.push({ time: formatMinutes(current), subject: subj });
      current += subjDur;
      globalSubjectIndex++;
    }
    timetable[day] = slots;
  }

  // Display timetable
  console.log("\n========== Timetable ==========");
  for (let day of days) {
    console.log(`\n${day}:`);
    if (timetable[day].length === 0) {
      console.log("  No slots");
    } else {
      timetable[day].forEach((slot) => {
        console.log(`  ${slot.time} → ${slot.subject}`);
      });
    }
  }

  rl.close();
}

// Run the CLI timetable
main();

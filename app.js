const STORAGE_KEY = "luckyAnalyticsResults";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const coefficientInput = document.getElementById("coefficient");
const addBtn = document.getElementById("addBtn");
const lastEl = document.getElementById("last");
const meanEl = document.getElementById("mean");
const medianEl = document.getElementById("median");
const volatilityEl = document.getElementById("volatility");
const distributionEl = document.getElementById("distribution");
const streakEl = document.getElementById("streak");
const resultsEl = document.getElementById("results");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearBtn = document.getElementById("clearBtn");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function category(value) {
  if (value < 2) return "< 2x";
  if (value < 3) return "2x – 3x";
  if (value < 5) return "3x – 5x";
  return "> 5x";
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;

  const avg = average(values);

  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) /
    values.length;

  return Math.sqrt(variance);
}

function addCoefficient() {
  const value = parseFloat(coefficientInput.value);

  if (!Number.isFinite(value) || value < 1) {
    alert("Entre un coefficient valide, par exemple 2.35.");
    return;
  }

  data.push({
    date: new Date().toISOString(),
    coefficient: value
  });

  save();
  coefficientInput.value = "";
  update();
}

function getCurrentStreak() {
  if (!data.length) return "—";

  const lastCategory = category(
    data[data.length - 1].coefficient
  );

  let count = 0;

  for (let i = data.length - 1; i >= 0; i--) {
    if (category(data[i].coefficient) === lastCategory) {
      count++;
    } else {
      break;
    }
  }

  return `${count} résultat(s) consécutif(s) dans la catégorie ${lastCategory}`;
}

function update() {
  const recent = data.slice(-50);
  const values = recent.map(item => item.coefficient);

  if (!values.length) {
    lastEl.textContent = "—";
    meanEl.textContent = "—";
    medianEl.textContent = "—";
    volatilityEl.textContent = "—";
    distributionEl.innerHTML = "Aucune donnée.";
    streakEl.textContent = "—";
    resultsEl.innerHTML = "Aucun résultat.";
    return;
  }

  lastEl.textContent =
    values[values.length - 1].toFixed(2) + "x";

  meanEl.textContent =
    average(values).toFixed(2) + "x";

  medianEl.textContent =
    median(values).toFixed(2) + "x";

  volatilityEl.textContent =
    standardDeviation(values).toFixed(2);

  const counts = {
    "< 2x": 0,
    "2x – 3x": 0,
    "3x – 5x": 0,
    "> 5x": 0
  };

  values.forEach(value => {
    counts[category(value)]++;
  });

  distributionEl.innerHTML = Object.entries(counts)
    .map(([name, count]) => {
      const percentage = (count / values.length) * 100;

      return `
        <div>
          <strong>${name}</strong> :
          ${count} / ${values.length}
          (${percentage.toFixed(1)}%)
        </div>
      `;
    })
    .join("");

  streakEl.textContent = getCurrentStreak();

  resultsEl.innerHTML = recent
    .slice()
    .reverse()
    .map(item => {
      return `
        <span class="result">
          ${item.coefficient.toFixed(2)}x
        </span>
      `;
    })
    .join("");
}

function exportCSV() {
  if (!data.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  let csv = "date,coefficient\n";

  data.forEach(item => {
    csv += `${item.date},${item.coefficient}\n`;
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "lucky-analytics.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function importCSV(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const lines = e.target.result.split(/\r?\n/);

    const imported = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      const parts = line.split(",");

      if (parts.length < 2) continue;

      const coefficient = parseFloat(parts[1]);

      if (Number.isFinite(coefficient) && coefficient >= 1) {
        imported.push({
          date: parts[0] || new Date().toISOString(),
          coefficient
        });
      }
    }

    data = data.concat(imported);
    save();
    update();

    alert(`${imported.length} résultat(s) importé(s).`);
  };

  reader.readAsText(file);
}

function clearData() {
  if (!data.length) return;

  const confirmation = confirm(
    "Supprimer tout l'historique ?"
  );

  if (!confirmation) return;

  data = [];
  save();
  update();
}

addBtn.addEventListener("click", addCoefficient);

coefficientInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addCoefficient();
  }
});

exportBtn.addEventListener("click", exportCSV);

importFile.addEventListener("change", importCSV);

clearBtn.addEventListener("click", clearData);

update();

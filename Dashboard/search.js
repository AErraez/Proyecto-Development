let playerData = [];
// persistent selection state so it survives re-renders
let currentSelected = { name: null, season: null };


fetch('players.json')
  .then(res => res.json())
  .then(data => {
    playerData = data;
    initPredictForm()
  })
  .catch(err => console.error("Error loading JSON:", err));

const playerInput = document.getElementById('playerInput');
const seasonInput = document.getElementById('seasonInput');
const suggestions = document.getElementById('suggestions');

// 🟢 Auto-suggestion logic (unchanged)
playerInput.addEventListener('input', () => {
  const query = playerInput.value.trim().toLowerCase();
  const season = seasonInput.value.trim();
  suggestions.innerHTML = '';

  if (query.length < 3) {
    suggestions.style.display = 'none';
    return;
  }

  // Filter by name + season
  const filtered = playerData
    .filter(p =>
      p.player_name &&
      p.player_name.toLowerCase().includes(query) &&
      (!p.transfer_season || p.transfer_season.includes(season))
    )
    .map(p => p.player_name);

  const uniqueNames = [...new Set(filtered)].slice(0, 10);

  if (uniqueNames.length === 0) {
    suggestions.style.display = 'none';
    return;
  }

  uniqueNames.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', () => {
      playerInput.value = name;
      suggestions.style.display = 'none';
    });
    suggestions.appendChild(li);
  });

  suggestions.style.display = 'block';
});

document.addEventListener('click', (e) => {
  if (!playerInput.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.style.display = 'none';
  }
});

// 🟢 Main search button
// 🟢 Main search button
document.getElementById('searchBtn').addEventListener('click', () => {
  const name = playerInput.value.trim().toUpperCase();
  const season = parseInt(seasonInput.value);

  if (!name || !season) {
    alert("Por favor ingresa el nombre del jugador y la temporada.");
    return;
  }

  const player = playerData.find(
    p =>
      p.player_name &&
      p.player_name.toUpperCase() === name &&
      (!p.season_year || p.season_year == season)
  );

  if (!player) {
    alert("Jugador no encontrado para esa temporada.");
    return;
  }

  // 🧩 Datos personales
  document.getElementById('name').innerText = `Nombre: ${player.player_name}`;
  document.getElementById('nationality').innerText = `Nacionalidad: ${player.Nation}`;
  document.getElementById('birthYear').innerText = `Edad: ${player.Age}`;
  document.getElementById('position').innerText = `Posición: ${player.Pos}`;
  document.getElementById('club').innerText = `Club: ${player.Squad}`;
  document.getElementById('league').innerText = `Liga: ${player.Comp}`;

  // 🧠 Limpiar y rellenar estadísticas dinámicamente
  const statsBox = document.getElementById('stats_card');
  statsBox.innerHTML = '<h4>Estadísticas</h4><hr>'; // reset header

  const pos = (player.Pos || '');
  let statsHTML = '';

  if (pos=='FW') {
    // 🟥 Forward
    statsHTML = `
      <p>Partidos: ${player.MP}</p>
      <p>Goles: ${player.Gls || 0}</p>
      <p>Asistencias: ${player.Ast || 0}</p>
      <p>Goles sin considerar penales: ${player['G-PK'] || 0}</p>
      <p>Goles Esperados: ${player.xG || 0}</p>
      <p>Pases clave: ${player.KP || 0}</p>
    `;
  } else if (pos == 'MF') {
    // 🟩 Midfielder
    statsHTML = `
      <p>Partidos: ${player.MP}</p>
      <p>% de Pases completados: ${player["Cmp%"] || 0}%</p>
      <p>Asistencias: ${player.Ast || 0}</p>
      <p>Intercepciones: ${player.Int || 0}</p>
      <p>Duelos ganados: ${player.TklW || 0}</p>
      <p>Posesiones progresivas: ${player.PrgR || 0}</p>
    `;
  } else if (pos == 'DF') {
    // 🟦 Defender
    statsHTML = `
      <p>Partidos: ${player.MP}</p>
      <p>Duelos ganados: ${player.TklW || 0}</p>
      <p>Intercepciones: ${player.Int || 0}</p>
      <p>Despejes: ${player.Clr || 0}</p>
      <p>Errores resultantes en gol: ${player.Err || 0}</p>
      <p>% de Pases completados: ${player["Cmp%"] || 0}%</p>
    `;
  } else if (pos == 'GK') {
    // 🟨 Goalkeeper
    statsHTML = `
      <p>Partidos: ${player.MP}</p>
      <p>Goles encajados: ${player.GA || 0}</p>
      <p>Atajadas: ${player.Saves || 0}</p>
      <p>% de Atajadas: ${player["Save%"] || 0}%</p>
      <p>Porterías a cero: ${player.CS || 0}</p>
      <p>Penales atajados: ${player.PKsv || 0}</p>
    `;
  } else {
    // default fallback
    statsHTML = `
      <p>Partidos: ${player.MP}</p>
      <p>% de Pases completados: ${player["Cmp%"] || 0}%</p>
      <p>Asistencias: ${player.Ast || 0}</p>
    `;
  }

  statsBox.innerHTML += statsHTML;

  // 🖼️ Foto
  const photo = document.getElementById('playerPhoto');
  if (player.image_url) {
    photo.src = player.image_url;
  } else {
    photo.src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  }
  photo.style.display = 'block';

  // 💰 Valor de traspaso
  const value = player.prediccion ? player.prediccion.toFixed(2) : 0;
  document.getElementById('transferValue').innerText = `€ ${value} millones`;

  // Highlight the current player in the scatter plot
  currentSelected.name = player.player_name;
  currentSelected.season = player.season_year;

  // Now update charts (this will call updateScatter which reads currentSelected)
  updateAllCharts();

});


import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Function to create/update scatter plot
// Function to create/update scatter plot
function updateScatter(data, xVar) {
  const svg = d3.select("#scatterPlot");
  svg.selectAll("*").remove();

  const width = +svg.attr("width") || svg.node().clientWidth;
  const height = +svg.attr("height") || svg.node().clientHeight;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => +d[xVar])).nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => +d.prediccion)).nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  const tooltip = d3.select("#tooltip");

  // helper to test equality (name + season) to avoid collisions across seasons
  function isSelected(d) {
    return d.player_name === currentSelected.name;
  }

  const circles = svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(+d[xVar]))
    .attr("cy", d => y(+d.prediccion))
    .attr("r", d => isSelected(d) ? 9 : 6)
    .attr("fill", d => isSelected(d) ? "#27ae60" : "#3498db")
    .attr("opacity", d => isSelected(d) ? 1 : 0.8)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      // If it's the currently selected - we may still enlarge slightly but DO NOT change fill
      if (isSelected(d)) {
        d3.select(this)
          .transition().duration(100)
          .attr("r", 10); // slight hover increase but keep the green fill
      } else {
        d3.select(this)
          .transition().duration(100)
          .attr("r", 9)
          .attr("fill", "#27ae60"); // temporary highlight on hover
      }

      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(`
        <strong>${d.player_name}</strong><br>
        ${xVar}: ${d[xVar]}<br>
        Valor Estimado: € ${(+d.prediccion).toFixed(2)} M
      `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (event, d) {
      // Restore appearance based on whether this is the selected one
      if (isSelected(d)) {
        d3.select(this)
          .transition().duration(100)
          .attr("r", 9)
          .attr("fill", "#27ae60")
          .attr("opacity", 1);
      } else {
        d3.select(this)
          .transition().duration(100)
          .attr("r", 6)
          .attr("fill", "#3498db")
          .attr("opacity", 0.8);
      }
      tooltip.transition().duration(150).style("opacity", 0);
    })
    .on("click", function (event, d) {
      // 1) Persist selection BEFORE re-rendering or triggering search
      currentSelected.name = d.player_name;

      // 2) Update search inputs
      playerInput.value = d.player_name;
      seasonInput.value = d.season_year;
      suggestions.style.display = 'none';
      // 3) Recolor current circles immediately (user feedback)
      circles
        .attr("fill", d2 => (d2.player_name === currentSelected.name) ? "#27ae60" : "#3498db")
        .attr("opacity", d2 => (d2.player_name === currentSelected.name) ? 1 : 0.8)
        .attr("r", d2 => (d2.player_name === currentSelected.name) ? 9 : 6);

      // 4) Trigger search action that updates details & may re-render charts
      // Because currentSelected is set, updateScatter will keep the highlight after re-render.
      document.getElementById("searchBtn").click();
    });
    if (currentSelected.name) {
  circles
    .filter(d => d.player_name === currentSelected.name)
    .raise();
}
}





// Function to create/update pie chart
function updatePie(data, pieVar) {
  const svg = d3.select("#pieChart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width") || svg.node().clientWidth;
  const height = +svg.attr("height") || svg.node().clientHeight;
  const radius = Math.min(width, height) / 2 - 40;

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const color = d3.scaleOrdinal(d3.schemeObservable10);

  const counts = d3.rollups(data, v => v.length, d => d[pieVar]);
  const pie = d3.pie().value(d => d[1]);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const tooltip = d3.select("#tooltip");

  g.selectAll("path")
    .data(pie(counts))
    .join("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data[0]))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition().duration(150)
        .attr("transform", "scale(1.05)");

      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(`
        <strong>${pieVar}:</strong> ${d.data[0]}<br>
        <strong>Jugadores:</strong> ${d.data[1]}
      `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition().duration(150)
        .attr("transform", "scale(1)");

      tooltip.transition().duration(150).style("opacity", 0);
    });
}

// 🎚️ Position and Value Range Filters
// 🎚️ Dashboard Filters
const positionFilter = document.getElementById("positionFilter");
const seasonFilter = document.getElementById("seasonFilter");
const minRange = document.getElementById("minRange");
const maxRange = document.getElementById("maxRange");
const rangeValue = document.getElementById("rangeValue");
const xVariable = document.getElementById("xVariable");
const pieVariable = document.getElementById("pieVariable");

// 🟢 Update displayed range
function updateRangeLabel() {
  const min = +minRange.value;
  const max = +maxRange.value;
  rangeValue.textContent = `€ ${min}M – € ${max}M`;
}

// 🟢 Get filtered dataset
function getFilteredData() {
  const pos = positionFilter.value;
  const minVal = +minRange.value;
  const maxVal = +maxRange.value;
  const season = seasonFilter.value;

  return playerData.filter(p => {
    const val = +p.prediccion || 0;
    const matchesPos = (pos === "All" || p.Pos === pos);
    const matchesSeason = (season === "All" || p.season_year == season);
    return matchesPos && matchesSeason && val >= minVal && val <= maxVal;
  });
}



// 🟢 Unified chart update
function updateAllCharts() {
  const filteredData = getFilteredData();
  const xVar = xVariable.value;
  const pieVar = pieVariable.value;

  if (filteredData.length > 0) {
    updateScatter(filteredData, xVar);
    updatePie(filteredData, pieVar);

  } else {
    d3.select("#scatterPlot").selectAll("*").remove();
    d3.select("#pieChart").selectAll("*").remove();
  }
}

// 🔄 Automatically update when any filter changes
[positionFilter, seasonFilter, minRange, maxRange, xVariable, pieVariable]
  .forEach(el => el.addEventListener("input", () => {
    updateRangeLabel();
    if (el === positionFilter) updateVariableOptions(); // 🧩 update variable list when GK selected
    updateAllCharts();
  }));

// Initialize range label and first draw
updateRangeLabel();
setTimeout(updateAllCharts, 500);

// ⚽ Field player and Goalkeeper variable sets
const fieldPlayerVars = [
  { value: "Ast", label: "Asistencias" },
  { value: "Gls", label: "Goles" },
  { value: "Tkl", label: "Entradas" },
  { value: "Cmp%", label: "Precisión de pase (%)" },
  { value: "KP", label: "Pases clave" },
  { value: "PrgC", label: "Controles progresivos" },
  { value: "Touches", label: "Pases" },
  { value: "MP", label: "Partidos jugados" }
];

const goalkeeperVars = [
  { value: "GA", label: "Goles concedidos" },
  { value: "CS", label: "Porterías a cero" },
  { value: "Save%", label: "Porcentaje de atajadas (%)" },
  { value: "PKsv", label: "Penales atajados" },
  { value: "MP", label: "Partidos jugados" }
];


// 🧠 Update the X-variable dropdown based on position
function updateVariableOptions() {
  const pos = positionFilter.value;
  const select = document.getElementById("xVariable");

  // Determine which variable list to use
  const vars = pos === "GK" ? goalkeeperVars : fieldPlayerVars;

  // Clear current options
  select.innerHTML = "";

  // Add new options
  vars.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.value;
    opt.textContent = v.label;
    select.appendChild(opt);
  });
}
updateVariableOptions();

const playerInput2 = document.getElementById('playerInput2');
const seasonInput2 = document.getElementById('seasonInput2');
const suggestions2 = document.getElementById('suggestions2');

// 🟢 Auto-suggestion logic (unchanged)
playerInput2.addEventListener('input', () => {
  const query = playerInput2.value.trim().toLowerCase();
  const season = seasonInput2.value.trim();
  suggestions2.innerHTML = '';

  if (query.length < 3) {
    suggestions2.style.display = 'none';
    return;
  }

  // Filter by name + season
  const filtered = playerData
    .filter(p =>
      p.player_name &&
      p.player_name.toLowerCase().includes(query) &&
      (!p.transfer_season || p.transfer_season.includes(season))
    )
    .map(p => p.player_name);

  const uniqueNames = [...new Set(filtered)].slice(0, 10);

  if (uniqueNames.length === 0) {
    suggestions2.style.display = 'none';
    return;
  }

  uniqueNames.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', () => {
      playerInput2.value = name;
      suggestions2.style.display = 'none';
    });
    suggestions2.appendChild(li);
  });

  suggestions2.style.display = 'block';
});

document.addEventListener('click', (e) => {
  if (!playerInput2.contains(e.target) && !suggestions2.contains(e.target)) {
    suggestions2.style.display = 'none';
  }
});


// ==========================
//   PREDICTOR DE VALOR
// ==========================

const FIELD_MAP = {
    "market_value_in_eur": "market_value_in_eur",
    "Squad": "Squad",
    "KP": "KP",
    "Carries": "Carries",
    "G+A": "G+A",
    "Touches": "Touches",
    "Comp_eng Premier League": "Comp_eng Premier League",
    "Age": "Age",
    "npxG": "npxG",
    "MP": "MP",
    "Ast": "Ast",
    "xG": "xG",
    "Starts": "Starts",
    "PrgC": "PrgC",
    "Nation": "Nation",
    "Dis": "Dis",
    "Min": "Min",
    "G-PK": "G-PK",
    "90s": "90s",
    "Gls": "Gls",
    "Tkl+Int": "Tkl+Int",
    "xAG": "xAG",
    "TklW": "TklW",
    "PrgP": "PrgP",
    "Recov": "Recov",
    "PKwon": "PKwon",
    "Cmp%": "Cmp%",
    "Int": "Int",
    "CrdR": "CrdR",
    "PPA": "PPA",
    "Comp_fr Ligue 1": "Comp_fr Ligue 1",
    "CS%": "CS%",
    "Pos_GK": "Pos_GK",
    "GA": "GA",
    "Comp_it Serie A": "Comp_it Serie A",
    "PrgR": "PrgR"
};


const predictorSection = document.getElementById("predictorSection");
const predictFields = document.getElementById("predictFields");
const predictBtn = document.getElementById("predictBtn");
const predictionResult = document.getElementById("predictionResult");
const LABEL_MAP = {
    "market_value_in_eur": "Valor de mercado en Transfermarkt (€)",
    "Squad": "Equipo",
    "KP": "Pases clave",
    "Carries": "Conducciones",
    "G+A": "Goles + Asistencias",
    "Touches": "Pases",
    "Age": "Edad",
    "npxG": "xG sin penales",
    "MP": "Partidos jugados",
    "Ast": "Asistencias",
    "xG": "Goles esperados (xG)",
    "Starts": "Partidos como titular",
    "PrgC": "Conducciones progresivas",
    "Nation": "Nacionalidad",
    "Dis": "Pérdidas de balón",
    "Min": "Minutos jugados",
    "G-PK": "Goles (sin penales)",
    "90s": "Intervalos de 90 min",
    "Gls": "Goles",
    "Tkl+Int": "Entradas + Intercepciones",
    "xAG": "Asistencias esperadas (xAG)",
    "TklW": "Entradas ganadas",
    "PrgP": "Pases progresivos",
    "Recov": "Recuperaciones",
    "PKwon": "Penales ganados",
    "Cmp%": "Precisión de pase (%)",
    "Int": "Intercepciones",
    "CrdR": "Tarjetas rojas",
    "PPA": "Pases al área de penal",
    "CS%": "Porcentaje de porterías a cero",
    "GA": "Goles concedidos",
    "PrgR": "Carreras progresivas",

    // Estos casi no se muestran pero los dejo traducidos:
    "Comp_eng Premier League": "¿Premier League?",
    "Comp_fr Ligue 1": "¿Ligue 1?",
    "Comp_it Serie A": "¿Serie A?",
    "Pos_GK": "¿Es portero?"
};

  // Obtener ligas únicas del JSON


// Obtener posiciones únicas
var ALL_POSITIONS
var ALL_LEAGUES
function initPredictForm() {
    ALL_LEAGUES = [...new Set(playerData.map(p => p.Comp).filter(Boolean))];
    console.log(ALL_LEAGUES);
    ALL_POSITIONS = [...new Set(playerData.map(p => p.Pos).filter(Boolean))];
    console.log(ALL_POSITIONS);

}


// Campos especiales que NO deben renderizarse como inputs
const SKIP_FIELDS = [
    "Comp_eng Premier League",
    "Comp_fr Ligue 1",
    "Comp_it Serie A",
    "Pos_GK"
];

document.getElementById("importBtn").addEventListener("click", () => {
  const playerName = document.getElementById("playerInput2").value.trim().toUpperCase();
  const season = parseInt(document.getElementById("seasonInput2").value);

  if (!playerName) {
    alert("Ingresa un nombre de jugador válido.");
    return;
  }

  const player = playerData.find(
    p => p.player_name.toUpperCase().includes(playerName) && p.season_year === season
  );

  if (!player) {
    alert("Jugador no encontrado en esa temporada.");
    return;
  }



  // Definir SOLO los campos requeridos por la API
  const fields = {
    "market_value_in_eur": player.market_value_in_eur || 0,
    "Squad": player.Squad || "",
    "KP": player.KP || 0,
    "Carries": player.Carries || 0,
    "G+A": player["G+A"] || 0,
    "Touches": player.Touches || 0,
    "Comp_eng Premier League": player.Comp === "eng Premier League",
    "Age": player.Age || 0,
    "npxG": player.npxG || 0,
    "MP": player.MP || 0,
    "Ast": player.Ast || 0,
    "xG": player.xG || 0,
    "Starts": player.Starts || 0,
    "PrgC": player.PrgC || 0,
    "Nation": player.Nation || "",
    "Dis": player.Dis || 0,
    "Min": player.Min || 0,
    "G-PK": player["G-PK"] || 0,
    "90s": player["90s"] || 0,
    "Gls": player.Gls || 0,
    "Tkl+Int": player["Tkl+Int"] || 0,
    "xAG": player.xAG || 0,
    "TklW": player.TklW || 0,
    "PrgP": player.PrgP || 0,
    "Recov": player.Recov || 0,
    "PKwon": player.PKwon || 0,
    "Cmp%": player["Cmp%"] || 0,
    "Int": player.Int || 0,
    "CrdR": player.CrdR || 0,
    "PPA": player.PPA || 0,
    "Comp_fr Ligue 1": player.Comp === "fr Ligue 1",
    "CS%": player["CS%"] || 0,
    "Pos_GK": player.Pos === "GK",
    "GA": player.GA || 0,
    "Comp_it Serie A": player.Comp === "it Serie A",
    "PrgR": player.PrgR || 0
  };

  // RENDERIZAR CAMPOS EN EL FORM
predictFields.innerHTML = "";

// ========== SELECT DINÁMICO DE LIGA ==========
predictFields.innerHTML += `
    <div class="col-md-4">
        <label class="predict-label">Liga</label>
        <select id="field_League" class="form-control">
            ${ALL_LEAGUES.map(l => `
                <option value="${l}" ${player.Comp === l ? "selected" : ""}>
                    ${l}
                </option>
            `).join("")}
        </select>
    </div>
`;

// ========== SELECT DINÁMICO DE POSICIÓN ==========
predictFields.innerHTML += `
    <div class="col-md-4">
        <label class="predict-label">Posición</label>
        <select id="field_Pos" class="form-control">
            ${ALL_POSITIONS.map(pos => `
                <option value="${pos}" ${player.Pos === pos ? "selected" : ""}>
                    ${pos}
                </option>
            `).join("")}
        </select>
    </div>
`;

// ========== RENDERIZAR EL RESTO DE CAMPOS ==========
Object.entries(FIELD_MAP).forEach(([jsonKey, trueKey]) => {
    if (SKIP_FIELDS.includes(jsonKey)) return;
    if (jsonKey === "Comp" || jsonKey === "Pos") return; // ya renderizados

    const rawValue = player[jsonKey];
    const isBool = typeof rawValue === "boolean";
    const isText = typeof rawValue === "string";

    predictFields.innerHTML += `
        <div class="col-md-4">
            <label class="predict-label">${LABEL_MAP[jsonKey] || jsonKey}</label>
            <input
                id="field_${jsonKey}"
                class="form-control"
                type="${isBool ? "checkbox" : (isText ? "text" : "number")}"
                ${isBool ? (rawValue ? "checked" : "") : `value="${rawValue}"`}
            >
        </div>
    `;
});


predictorSection.style.display = "block";
})


// ==========================
//    ENVIAR PREDICCIÓN
// ==========================
const API_URL = `http://${window.location.hostname}:8001/api/v1/predict`;
predictBtn.addEventListener("click", async () => {

    const bodyObject = {};

    // 1) PROCESAR INPUTS NORMALES
    Object.keys(FIELD_MAP).forEach((jsonKey) => {
        if (SKIP_FIELDS.includes(jsonKey)) return;
        if (jsonKey === "Comp" || jsonKey === "Pos") return;

        const element = document.getElementById(`field_${jsonKey}`);
        if (!element) return;

        if (element.type === "checkbox") {
            bodyObject[jsonKey] = element.checked;
        } else {
            const value = element.value;
            bodyObject[jsonKey] = isNaN(value) ? value : Number(value);
        }
    });

    // ============= LIGA (3 BOOLEANS) =============
    const selectedLeague = document.getElementById("field_League").value;

    bodyObject["Comp_eng Premier League"] = selectedLeague === "eng Premier League";
    bodyObject["Comp_fr Ligue 1"] = selectedLeague === "fr Ligue 1";
    bodyObject["Comp_it Serie A"] = selectedLeague === "it Serie A";

    // ============= POSICIÓN (solo booleano GK) =============
    const selectedPos = document.getElementById("field_Pos").value;
    bodyObject["Pos_GK"] = (selectedPos === "GK");

    // Construir payload final
    const payload = { inputs: [bodyObject] };

    console.log("FINAL SEND:", payload);

    // Enviar a la API
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const json = await res.json();
    predictionResult.innerHTML =
        `Valor de mercado predicho: €${json.predictions[0].toFixed(2)} millones`;
});


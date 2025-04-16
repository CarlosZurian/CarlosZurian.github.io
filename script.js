document.addEventListener("DOMContentLoaded", function() {
  /***************************************************
   * Variables y Diccionario de Ciudades
   ***************************************************/
  const cities = {
    "CDMX": { lat: 19.43, lon: -99.13 },
    "Guadalajara": { lat: 20.67, lon: -103.35 },
    "Monterrey": { lat: 25.67, lon: -100.31 },
    "Morelia": { lat: 19.70, lon: -101.19 },
    "Cancún": { lat: 21.17, lon: -86.85 },
    "Tijuana": { lat: 32.52, lon: -117.02 },
    "Puebla": { lat: 19.04, lon: -98.20 },
    "Chihuahua": { lat: 28.63, lon: -106.08 },
    "León": { lat: 21.12, lon: -101.68 },
    "Toluca": { lat: 19.29, lon: -99.65 },
    "Querétaro": { lat: 20.59, lon: -100.39 },
    "Aguascalientes": { lat: 21.88, lon: -102.29 },
    "San Luis Potosí": { lat: 22.15, lon: -100.98 },
    "Culiacán": { lat: 24.80, lon: -107.39 },
    "Hermosillo": { lat: 29.07, lon: -110.95 },
    "Veracruz": { lat: 19.19, lon: -96.14 },
    "Saltillo": { lat: 25.42, lon: -101.00 },
    "Tampico": { lat: 22.25, lon: -97.86 },
    "Villahermosa": { lat: 17.99, lon: -92.93 },
    "Oaxaca": { lat: 17.07, lon: -96.72 },
    "Tuxtla Gutiérrez": { lat: 16.75, lon: -93.12 },
    "Chetumal": { lat: 18.50, lon: -88.30 },
    "Campeche": { lat: 19.84, lon: -90.53 },
    "La Paz": { lat: 24.14, lon: -110.31 },
    "Mazatlán": { lat: 23.22, lon: -106.42 },
    "Irapuato": { lat: 20.67, lon: -101.35 },
    "Mexicali": { lat: 32.63, lon: -115.45 },
    "Colima": { lat: 19.24, lon: -103.72 },
    "Cuernavaca": { lat: 18.92, lon: -99.23 }
  };

  window.requiredPanels = 0;
  window.dailyEnergy = 0;
  window.dailyConsumption = 0;

  /***************************************************
   * Inicialización de Selects (Ciudades)
   ***************************************************/
  const consumoCitySelect = document.getElementById("consumoCitySelect");
  const city2Select = document.getElementById("city2");
  Object.keys(cities).forEach(city => {
    let opt1 = document.createElement("option");
    opt1.value = city;
    opt1.textContent = city;
    consumoCitySelect.appendChild(opt1);
    let opt2 = document.createElement("option");
    opt2.value = city;
    opt2.textContent = city;
    city2Select.appendChild(opt2);
  });
  consumoCitySelect.value = "CDMX";
  city2Select.value = "Guadalajara";

  /***************************************************
   * Funciones showSection y returnHome
   ***************************************************/
  window.showSection = function(sectionId) {
    const sections = document.querySelectorAll(".container");
    sections.forEach(sec => sec.style.display = (sec.id === sectionId) ? "block" : "none");
    document.getElementById("heroSection").style.display = (sectionId === "hero") ? "flex" : "none";
    let bgUrl;
    switch(sectionId) {
      case "consumoSection": bgUrl = "consumo.png"; break;
      case "regressionSection": bgUrl = "Regresion.png"; break;
      case "parabolaSection":
      case "planeSection": bgUrl = "graficas.png"; break;
      case "algebraSection": bgUrl = "matrices.png"; break;
      case "helpSection": bgUrl = "Estadistica.png"; break;
      case "panelesInfoSection": bgUrl = "paneles.png"; break;
      default: bgUrl = "solar_image.png";
    }
    document.body.style.backgroundImage = "url('" + bgUrl + "')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (sectionId === "consumoSection") { setTimeout(calculateSystem, 500); }
  };

  window.returnHome = function() {
    document.getElementById("heroSection").style.display = "flex";
    const sections = document.querySelectorAll(".container");
    sections.forEach(sec => sec.style.display = "none");
    document.body.style.backgroundImage = "url('solar_image.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /***************************************************
   * getSolarRadiation(lat, lon)
   * Consulta la NASA POWER API y devuelve { dates, values }
   ***************************************************/
  async function getSolarRadiation(lat, lon) {
    const refDate = document.getElementById("referenceDate").value; // YYYY-MM-DD
    const year = refDate.slice(0,4);
    const month = refDate.slice(5,7);
    const daysInMonth = new Date(year, parseInt(month), 0).getDate();
    const baseUrl = "https://power.larc.nasa.gov/api/temporal/daily/point";
    const params = `?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON&start=${year}${month}01&end=${year}${month}${daysInMonth}`;
    try {
      const res = await fetch(baseUrl + params);
      const data = await res.json();
      const radObj = data.properties.parameter.ALLSKY_SFC_SW_DWN;
      const dates = Object.keys(radObj);
      const values = Object.values(radObj);
      return { dates, values };
    } catch (err) {
      console.error("Error en la NASA API:", err);
      return null;
    }
  }

  /***************************************************
   * Renderizar gráfica comparativa (línea)
   ***************************************************/
  let radiationChartInstance = null;
  function renderRadiationCharts(mainData, mainDates, compareData = null) {
    const ctx = document.getElementById("radiationComparisonChart").getContext("2d");
    if (radiationChartInstance) radiationChartInstance.destroy();
    const datasets = [
      {
        label: "Ciudad 1",
        data: mainData,
        borderColor: "#e74c3c",
        fill: false,
        tension: 0.1
      }
    ];
    if (compareData) {
      datasets.push({
        label: "Ciudad 2",
        data: compareData,
        borderColor: "#3498db",
        fill: false,
        tension: 0.1
      });
    }
    radiationChartInstance = new Chart(ctx, {
      type: "line",
      data: { labels: mainDates, datasets }
    });
  }

  /***************************************************
   * calculateSystem: calcula producción y simula paneles
   ***************************************************/
  window.calculateSystem = async function() {
    const dailyC = parseFloat(document.getElementById("dailyConsumption").value);
    let idealProd = parseFloat(document.getElementById("idealProduction").value);
    const panelArea = parseFloat(document.getElementById("panelArea").value);
    const eff = parseFloat(document.getElementById("efficiency").value) / 100;
    if (!dailyC || dailyC <= 0 || !idealProd || idealProd <= 0 || !panelArea || !eff) {
      alert("Revisa tus datos de consumo y panel.");
      return;
    }
    window.dailyConsumption = dailyC;
    // Obtener datos de la ciudad principal
    const city1 = document.getElementById("consumoCitySelect").value;
    const d1 = cities[city1];
    const rad1Obj = await getSolarRadiation(d1.lat, d1.lon);
    if (!rad1Obj) { alert("No se pudo obtener radiación para la ciudad principal."); return; }
    const avg1 = rad1Obj.values.reduce((a, b) => a + b, 0) / rad1Obj.values.length;
    window.dailyEnergy = avg1 * panelArea * eff;
    idealProd = window.dailyEnergy;
    
    // Obtener datos opcionales de la ciudad 2
    const city2 = document.getElementById("city2").value;
    let rad2Values = null;
    if (cities[city2]) {
      const d2 = cities[city2];
      const rad2Obj = await getSolarRadiation(d2.lat, d2.lon);
      if (rad2Obj) rad2Values = rad2Obj.values;
    }
    window.solarData = { dates: rad1Obj.dates, values: rad1Obj.values };
    renderRadiationCharts(rad1Obj.values, rad1Obj.dates, rad2Values);
    
    // Simulación Monte Carlo para producción
    const sims = 1000;
    let productions = [];
    for (let i = 0; i < sims; i++) {
      let factor = 0.85 + (Math.random()-0.5)*0.2;
      factor = Math.max(0.6, Math.min(1.0, factor));
      productions.push(idealProd * factor);
    }
    productions.sort((a, b) => a - b);
    const idx5 = Math.floor(0.05 * sims);
    const worst5 = productions[idx5];
    const reqPanels = Math.ceil(dailyC / worst5);
    window.requiredPanels = reqPanels;
    document.getElementById("optResult").innerHTML = `
      Se requieren <strong>${reqPanels} paneles</strong> para cubrir ${dailyC} kWh/día (95% de confianza).
    `;
    const totalProd = productions.map(p => p * reqPanels);
    renderProductionHistogram(totalProd);
  };

  let optChartInstance = null;
  function renderProductionHistogram(arr) {
    const ctx = document.getElementById("optChart").getContext("2d");
    if (optChartInstance) optChartInstance.destroy();
    const bins = 20;
    const hist = getHistogramData(arr, bins);
    const labels = Array.from({ length: bins }, (_, i) => `Bin ${i+1}`);
    optChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Producción Total (kWh)",
          data: hist,
          backgroundColor: "#2ecc71"
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  function getHistogramData(data, bins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    let hist = new Array(bins).fill(0);
    data.forEach(val => {
      let idx = Math.floor((val - min) / binWidth);
      if (idx >= bins) idx = bins - 1;
      hist[idx]++;
    });
    return hist;
  }

  function linspace(start, stop, num) {
    const arr = [];
    const step = (stop - start) / (num - 1);
    for (let i = 0; i < num; i++) arr.push(start + step * i);
    return arr;
  }

  /***************************************************
   * PANEL MODELS y CÁLCULO DE COSTOS
   ***************************************************/
  const residentialPanels = [
    { name: "Residencial Model 1", area: 1.7, watt: 370, price: 5000, link: "https://www.example.com/res1", img: "https://via.placeholder.com/300x200?text=Resid+1" },
    { name: "Residencial Model 2", area: 1.7, watt: 365, price: 4800, link: "https://www.example.com/res2", img: "https://via.placeholder.com/300x200?text=Resid+2" },
    { name: "Residencial Model 3", area: 1.7, watt: 375, price: 5200, link: "https://www.example.com/res3", img: "https://via.placeholder.com/300x200?text=Resid+3" }
  ];
  const industrialPanels = [
    { name: "Industrial Model 1", area: 2.0, watt: 550, price: 7500, link: "https://www.example.com/ind1", img: "https://via.placeholder.com/300x200?text=Ind+1" },
    { name: "Industrial Model 2", area: 2.0, watt: 500, price: 7000, link: "https://www.example.com/ind2", img: "https://via.placeholder.com/300x200?text=Ind+2" },
    { name: "Industrial Model 3", area: 2.0, watt: 530, price: 7200, link: "https://www.example.com/ind3", img: "https://via.placeholder.com/300x200?text=Ind+3" }
  ];

  window.renderPanelModels = function() {
    const type = document.getElementById("panelType").value;
    const container = document.getElementById("panelModelsContainer");
    container.innerHTML = "";
    let models = (type === "industrial") ? industrialPanels : residentialPanels;
    models.forEach(model => {
      const div = document.createElement("div");
      div.classList.add("panel-item");
      div.innerHTML = `
        <img src="${model.img}" alt="${model.name}">
        <h3>${model.name}</h3>
        <p>Tamaño: ${model.area} m² | Potencia: ${model.watt}W<br>Precio: $${model.price} MXN</p>
        <p><a href="${model.link}" target="_blank">Ver Producto</a></p>
        <button onclick="calculateCostsForModel(${model.price})">Calcular Costos para este modelo</button>
      `;
      container.appendChild(div);
    });
  };

  // Función de Cálculo de Costos (definida en window para ser global)
  window.calculateCostsForModel = function(panelPrice) {
    if (!window.requiredPanels || window.requiredPanels === 0) {
      alert("Primero calcula el sistema en la sección de Datos de Consumo.");
      return;
    }
    const installationCost = parseFloat(document.getElementById("installationCost").value);
    const energyRate = parseFloat(document.getElementById("energyRate").value);
    const totalCost = window.requiredPanels * panelPrice + installationCost;
    const annualSavings = window.dailyConsumption * 365 * energyRate;
    const paybackYears = totalCost / annualSavings;
    document.getElementById("costResult").innerHTML = `
      <p>Costo total: $${totalCost.toLocaleString()} MXN</p>
      <p>Retorno de inversión: ${paybackYears.toFixed(1)} años</p>
    `;
  };

  /***************************************************
   * SIMULACIÓN DE BATERÍAS
   ***************************************************/
  window.simulateAndDisplayBattery = function() {
    if (!window.requiredPanels || !window.dailyEnergy) {
      alert("Primero presiona 'Calcular Sistema y Comparar'.");
      return;
    }
    const cap = parseFloat(document.getElementById("batteryCapacity").value);
    const effB = parseFloat(document.getElementById("batteryEfficiency").value) / 100;
    if (!cap || !effB) {
      alert("Revisa los valores de Capacidad y Eficiencia de la Batería.");
      return;
    }
    const sims = 1000;
    let productions = [];
    for (let i = 0; i < sims; i++) {
      let factor = 0.85 + (Math.random()-0.5)*0.2;
      factor = Math.max(0.6, Math.min(1.0, factor));
      productions.push(window.dailyEnergy * factor);
    }
    let storedArr = productions.map(prod => {
      let net = prod * window.requiredPanels;
      let surplus = net - window.dailyConsumption;
      if (surplus < 0) surplus = 0;
      return Math.min(surplus, cap) * effB;
    });
    const avgStored = storedArr.reduce((a, b) => a + b, 0) / storedArr.length;
    document.getElementById("batteryResult").innerHTML = `<p>Energía promedio almacenada: ${avgStored.toFixed(2)} kWh</p>`;
  };

  /***************************************************
   * COMPARACIÓN DE UBICACIONES (Integrada en la gráfica de radiación)
   ***************************************************/
  async function compareLocations() {
    const city1 = consumoCitySelect.value;
    const city2 = document.getElementById("city2").value;
    if (!cities[city1] || !cities[city2]) {
      alert("Selecciona dos ciudades válidas.");
      return;
    }
    const d2 = cities[city2];
    const rad2Obj = await getSolarRadiation(d2.lat, d2.lon);
    if (!rad2Obj) {
      alert("No se pudo obtener radiación para la ciudad de comparación.");
      return;
    }
    renderRadiationCharts(window.solarData.values, window.solarData.dates, rad2Obj.values);
  }

  /***************************************************
   * Funciones para Archivos CSV
   ***************************************************/
  function parseCSV(data) {
    const rows = data.split('\n');
    return rows.map(row => {
      const [date, radiation] = row.split(',');
      return { date, radiation: parseFloat(radiation) };
    });
  }

  async function handleCSVUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvData = parseCSV(e.target.result);
      window.solarData = {
        dates: csvData.map(d => d.date),
        values: csvData.map(d => d.radiation)
      };
      renderRadiationCharts(window.solarData.values, window.solarData.dates);
    };
    reader.readAsText(file);
  }

  /***************************************************
   * REGRESIÓN LINEAL (Funciones existentes)
   ***************************************************/
  window.processRegression = function() {
    const method = document.getElementById("dataInputMethod").value;
    if (method === "manual") processManualRegression();
    else processFileRegression();
  };

  function processManualRegression() {
    const input = document.getElementById("regressionInput").value.trim();
    if (!input) { alert("Ingresa datos en formato: x,y; x,y; ..."); return; }
    let dataPoints = parseData(input);
    if (!dataPoints) return;
    calculateAndRenderRegression(dataPoints);
  }

  function processFileRegression() {
    const fileInput = document.getElementById("fileUpload");
    if (!fileInput.files.length) { alert("Selecciona un archivo Excel."); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!jsonData.length || jsonData[0].length < 2) { alert("El archivo debe tener 2 columnas (X e Y)."); return; }
      let dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]) }))
                                .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
      if (dataPoints.length === 0) { alert("No se encontraron datos válidos."); return; }
      calculateAndRenderRegression(dataPoints);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseData(input) {
    const pairs = input.split(";").map(p => p.trim()).filter(p => p !== "");
    let dataPoints = [];
    for (let pair of pairs) {
      const nums = pair.split(",").map(n => Number(n.trim()));
      if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
        alert("Datos no válidos. Usa: x,y; x,y; ...");
        return null;
      }
      dataPoints.push({ x: nums[0], y: nums[1] });
    }
    return dataPoints;
  }

  function calculateAndRenderRegression(dataPoints) {
    const resultElem = document.getElementById("regressionResult");
    const ctx = document.getElementById("regressionChart").getContext("2d");
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    resultElem.innerHTML = `<p>Recta: y = ${m.toFixed(2)}x + ${b.toFixed(2)}</p>`;
    const minX = Math.min(...dataPoints.map(pt => pt.x));
    const maxX = Math.max(...dataPoints.map(pt => pt.x));
    const regressionLine = [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
    if (window.dataChartInstance) window.dataChartInstance.destroy();
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Línea", data: regressionLine, type: "line", fill: false, borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { responsive: true, scales: { x: { title: { display: true, text: "Eje X" } }, y: { title: { display: true, text: "Eje Y" } } } }
    });
  }

  /***************************************************
   * AJUSTE CUADRÁTICO
   ***************************************************/
  window.toggleParabolaInput = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    document.getElementById("parabolaManualContainer").style.display = (method === "manual") ? "block" : "none";
    document.getElementById("parabolaFileContainer").style.display = (method === "file") ? "block" : "none";
  };

  window.processParabola = async function() {
    const method = document.getElementById("parabolaInputMethod").value;
    let dataPoints = [];
    if (method === "manual") {
      const input = document.getElementById("parabolaInput").value.trim();
      dataPoints = parseData(input);
    } else {
      const file = document.getElementById("parabolaFileUpload").files[0];
      if (!file) { alert("Sube un archivo Excel."); return; }
      dataPoints = await parseExcelData(file);
    }
    if (!dataPoints || dataPoints.length < 3) { alert("Se requieren al menos 3 puntos."); return; }
    const n = dataPoints.length;
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumY = 0, sumXY = 0, sumX2Y = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumX2 += pt.x ** 2;
      sumX3 += pt.x ** 3;
      sumX4 += pt.x ** 4;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumX2Y += (pt.x ** 2) * pt.y;
    });
    const matrix = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const vector = [sumY, sumXY, sumX2Y];
    try {
      const coefficients = math.lusolve(matrix, vector).flat();
      renderParabolaChart(dataPoints, coefficients);
      document.getElementById("parabolaResult").innerHTML = `<p>Ecuación: y = ${coefficients[0].toFixed(2)}x² + ${coefficients[1].toFixed(2)}x + ${coefficients[2].toFixed(2)}</p>`;
    } catch (error) {
      alert("Error en el ajuste cuadrático: " + error);
    }
  };

  function renderParabolaChart(dataPoints, coeffs) {
    const ctx = document.getElementById("parabolaChart").getContext("2d");
    if (window.parabolaChartInstance) window.parabolaChartInstance.destroy();
    const xs = dataPoints.map(pt => pt.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const step = (maxX - minX) / 100;
    let parabolaPoints = [];
    for (let x = minX - 2; x <= maxX + 2; x += step) {
      parabolaPoints.push({ x: x, y: coeffs[0] * x ** 2 + coeffs[1] * x + coeffs[2] });
    }
    window.parabolaChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Parábola ajustada", data: parabolaPoints, type: "line", borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { scales: { x: { title: { display: true, text: "X" } }, y: { title: { display: true, text: "Y" } } } }
    });
  }

  async function parseExcelData(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const points = jsonData.filter(row => row.length >= 2)
          .map(row => ({ x: row[0], y: row[1] }));
        resolve(points);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /***************************************************
   * AJUSTE 3D
   ***************************************************/
  window.togglePlaneDataInput = function() {
    const method = document.getElementById("planeDataInputMethod").value;
    if (method === "manual") {
      document.getElementById("planeManualContainer").style.display = "block";
      document.getElementById("planeFileContainer").style.display = "none";
    } else {
      document.getElementById("planeManualContainer").style.display = "none";
      document.getElementById("planeFileContainer").style.display = "block";
    }
  };

  window.addPlaneRow = function() {
    const table = document.getElementById("planeDataTable").getElementsByTagName("tbody")[0];
    const newRow = table.rows[0].cloneNode(true);
    newRow.querySelectorAll("input").forEach(input => input.value = "");
    table.appendChild(newRow);
  };

  window.removePlaneRow = function(btn) {
    const row = btn.parentNode.parentNode;
    const table = row.parentNode;
    if (table.rows.length > 1) { table.removeChild(row); }
  };

  window.processPlane = function() {
    const rows = document.querySelectorAll("#planeDataTable tbody tr");
    let points = [];
    rows.forEach(row => {
      const x = parseFloat(row.querySelector(".plane-input-x").value);
      const y = parseFloat(row.querySelector(".plane-input-y").value);
      const z = parseFloat(row.querySelector(".plane-input-z").value);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) { points.push({ x, y, z }); }
    });
    if (points.length < 3) { alert("Ingresa al menos 3 puntos para ajustar un plano."); return; }
    let X = points.map(pt => [pt.x, pt.y, 1]);
    let Z = points.map(pt => pt.z);
    try {
      const XT = math.transpose(X);
      const XTX = math.multiply(XT, X);
      const invXTX = math.inv(XTX);
      const XTZ = math.multiply(XT, Z);
      const coeffs = math.multiply(invXTX, XTZ);
      const A_coeff = coeffs[0],
            B_coeff = coeffs[1],
            C_coeff = coeffs[2];
      document.getElementById("planeResult").innerHTML = `<p>Plano ajustado: z = ${A_coeff.toFixed(2)}x + ${B_coeff.toFixed(2)}y + ${C_coeff.toFixed(2)}</p>`;
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const gridSize = 20;
      let xGrid = linspace(minX, maxX, gridSize);
      let yGrid = linspace(minY, maxY, gridSize);
      let zGrid = [];
      for (let i = 0; i < gridSize; i++) {
        let row = [];
        for (let j = 0; j < gridSize; j++) {
          row.push(A_coeff * xGrid[j] + B_coeff * yGrid[i] + C_coeff);
        }
        zGrid.push(row);
      }
      const data = [
        {
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          z: points.map(p => p.z),
          mode: 'markers',
          type: 'scatter3d',
          marker: { size: 4, color: 'red' },
          name: 'Datos'
        },
        {
          x: xGrid,
          y: yGrid,
          z: zGrid,
          type: 'surface',
          opacity: 0.7,
          colorscale: 'Viridis',
          name: 'Plano Ajustado'
        }
      ];
      const layout = {
        title: 'Ajuste 3D (Plano)',
        autosize: true,
        scene: { xaxis: { title: 'X' }, yaxis: { title: 'Y' }, zaxis: { title: 'Z' } }
      };
      Plotly.newPlot('planeChart', data, layout);
    } catch (error) {
      alert("Error en el ajuste 3D: " + error);
    }
  };

  /***************************************************
   * Funciones para Archivos CSV
   ***************************************************/
  function parseCSV(data) {
    const rows = data.split('\n');
    return rows.map(row => {
      const [date, radiation] = row.split(',');
      return { date, radiation: parseFloat(radiation) };
    });
  }

  async function handleCSVUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvData = parseCSV(e.target.result);
      window.solarData = {
        dates: csvData.map(d => d.date),
        values: csvData.map(d => d.radiation)
      };
      renderRadiationCharts(window.solarData.values, window.solarData.dates);
    };
    reader.readAsText(file);
  }

  /***************************************************
   * REGRESIÓN LINEAL (Funciones existentes)
   ***************************************************/
  window.processRegression = function() {
    const method = document.getElementById("dataInputMethod").value;
    if (method === "manual") processManualRegression();
    else processFileRegression();
  };

  function processManualRegression() {
    const input = document.getElementById("regressionInput").value.trim();
    if (!input) { alert("Ingresa datos en formato: x,y; x,y; ..."); return; }
    let dataPoints = parseData(input);
    if (!dataPoints) return;
    calculateAndRenderRegression(dataPoints);
  }

  function processFileRegression() {
    const fileInput = document.getElementById("fileUpload");
    if (!fileInput.files.length) { alert("Selecciona un archivo Excel."); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!jsonData.length || jsonData[0].length < 2) { alert("El archivo debe tener 2 columnas (X e Y)."); return; }
      let dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]) }))
                                .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
      if (dataPoints.length === 0) { alert("No se encontraron datos válidos."); return; }
      calculateAndRenderRegression(dataPoints);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseData(input) {
    const pairs = input.split(";").map(p => p.trim()).filter(p => p !== "");
    let dataPoints = [];
    for (let pair of pairs) {
      const nums = pair.split(",").map(n => Number(n.trim()));
      if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
        alert("Datos no válidos. Usa: x,y; x,y; ...");
        return null;
      }
      dataPoints.push({ x: nums[0], y: nums[1] });
    }
    return dataPoints;
  }

  function calculateAndRenderRegression(dataPoints) {
    const resultElem = document.getElementById("regressionResult");
    const ctx = document.getElementById("regressionChart").getContext("2d");
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    resultElem.innerHTML = `<p>Recta: y = ${m.toFixed(2)}x + ${b.toFixed(2)}</p>`;
    const minX = Math.min(...dataPoints.map(pt => pt.x));
    const maxX = Math.max(...dataPoints.map(pt => pt.x));
    const regressionLine = [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
    if (window.dataChartInstance) window.dataChartInstance.destroy();
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Línea", data: regressionLine, type: "line", fill: false, borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { responsive: true, scales: { x: { title: { display: true, text: "Eje X" } }, y: { title: { display: true, text: "Eje Y" } } } }
    });
  }

  /***************************************************
   * AJUSTE CUADRÁTICO
   ***************************************************/
  window.toggleParabolaInput = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    document.getElementById("parabolaManualContainer").style.display = (method === "manual") ? "block" : "none";
    document.getElementById("parabolaFileContainer").style.display = (method === "file") ? "block" : "none";
  };

  window.processParabola = async function() {
    const method = document.getElementById("parabolaInputMethod").value;
    let dataPoints = [];
    if (method === "manual") {
      const input = document.getElementById("parabolaInput").value.trim();
      dataPoints = parseData(input);
    } else {
      const file = document.getElementById("parabolaFileUpload").files[0];
      if (!file) { alert("Sube un archivo Excel."); return; }
      dataPoints = await parseExcelData(file);
    }
    if (!dataPoints || dataPoints.length < 3) { alert("Se requieren al menos 3 puntos."); return; }
    const n = dataPoints.length;
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumY = 0, sumXY = 0, sumX2Y = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumX2 += pt.x ** 2;
      sumX3 += pt.x ** 3;
      sumX4 += pt.x ** 4;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumX2Y += (pt.x ** 2) * pt.y;
    });
    const matrix = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const vector = [sumY, sumXY, sumX2Y];
    try {
      const coefficients = math.lusolve(matrix, vector).flat();
      renderParabolaChart(dataPoints, coefficients);
      document.getElementById("parabolaResult").innerHTML = `<p>Ecuación: y = ${coefficients[0].toFixed(2)}x² + ${coefficients[1].toFixed(2)}x + ${coefficients[2].toFixed(2)}</p>`;
    } catch (error) {
      alert("Error en el ajuste cuadrático: " + error);
    }
  };

  function renderParabolaChart(dataPoints, coeffs) {
    const ctx = document.getElementById("parabolaChart").getContext("2d");
    if (window.parabolaChartInstance) window.parabolaChartInstance.destroy();
    const xs = dataPoints.map(pt => pt.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const step = (maxX - minX) / 100;
    let parabolaPoints = [];
    for (let x = minX - 2; x <= maxX + 2; x += step) {
      parabolaPoints.push({ x: x, y: coeffs[0] * x ** 2 + coeffs[1] * x + coeffs[2] });
    }
    window.parabolaChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Parábola ajustada", data: parabolaPoints, type: "line", borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { scales: { x: { title: { display: true, text: "X" } }, y: { title: { display: true, text: "Y" } } } }
    });
  }

  async function parseExcelData(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const points = jsonData.filter(row => row.length >= 2)
          .map(row => ({ x: row[0], y: row[1] }));
        resolve(points);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /***************************************************
   * AJUSTE 3D
   ***************************************************/
  window.togglePlaneDataInput = function() {
    const method = document.getElementById("planeDataInputMethod").value;
    if (method === "manual") {
      document.getElementById("planeManualContainer").style.display = "block";
      document.getElementById("planeFileContainer").style.display = "none";
    } else {
      document.getElementById("planeManualContainer").style.display = "none";
      document.getElementById("planeFileContainer").style.display = "block";
    }
  };

  window.addPlaneRow = function() {
    const table = document.getElementById("planeDataTable").getElementsByTagName("tbody")[0];
    const newRow = table.rows[0].cloneNode(true);
    newRow.querySelectorAll("input").forEach(input => input.value = "");
    table.appendChild(newRow);
  };

  window.removePlaneRow = function(btn) {
    const row = btn.parentNode.parentNode;
    const table = row.parentNode;
    if (table.rows.length > 1) { table.removeChild(row); }
  };

  window.processPlane = function() {
    const rows = document.querySelectorAll("#planeDataTable tbody tr");
    let points = [];
    rows.forEach(row => {
      const x = parseFloat(row.querySelector(".plane-input-x").value);
      const y = parseFloat(row.querySelector(".plane-input-y").value);
      const z = parseFloat(row.querySelector(".plane-input-z").value);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) { points.push({ x, y, z }); }
    });
    if (points.length < 3) { alert("Ingresa al menos 3 puntos para ajustar un plano."); return; }
    let X = points.map(pt => [pt.x, pt.y, 1]);
    let Z = points.map(pt => pt.z);
    try {
      const XT = math.transpose(X);
      const XTX = math.multiply(XT, X);
      const invXTX = math.inv(XTX);
      const XTZ = math.multiply(XT, Z);
      const coeffs = math.multiply(invXTX, XTZ);
      const A_coeff = coeffs[0],
            B_coeff = coeffs[1],
            C_coeff = coeffs[2];
      document.getElementById("planeResult").innerHTML = `<p>Plano ajustado: z = ${A_coeff.toFixed(2)}x + ${B_coeff.toFixed(2)}y + ${C_coeff.toFixed(2)}</p>`;
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const gridSize = 20;
      let xGrid = linspace(minX, maxX, gridSize);
      let yGrid = linspace(minY, maxY, gridSize);
      let zGrid = [];
      for (let i = 0; i < gridSize; i++) {
        let row = [];
        for (let j = 0; j < gridSize; j++) {
          row.push(A_coeff * xGrid[j] + B_coeff * yGrid[i] + C_coeff);
        }
        zGrid.push(row);
      }
      const data = [
        {
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          z: points.map(p => p.z),
          mode: 'markers',
          type: 'scatter3d',
          marker: { size: 4, color: 'red' },
          name: 'Datos'
        },
        {
          x: xGrid,
          y: yGrid,
          z: zGrid,
          type: 'surface',
          opacity: 0.7,
          colorscale: 'Viridis',
          name: 'Plano Ajustado'
        }
      ];
      const layout = {
        title: 'Ajuste 3D (Plano)',
        autosize: true,
        scene: { xaxis: { title: 'X' }, yaxis: { title: 'Y' }, zaxis: { title: 'Z' } }
      };
      Plotly.newPlot('planeChart', data, layout);
    } catch (error) {
      alert("Error en el ajuste 3D: " + error);
    }
  };

  /***************************************************
   * Funciones para Archivos CSV
   ***************************************************/
  function parseCSV(data) {
    const rows = data.split('\n');
    return rows.map(row => {
      const [date, radiation] = row.split(',');
      return { date, radiation: parseFloat(radiation) };
    });
  }

  async function handleCSVUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvData = parseCSV(e.target.result);
      window.solarData = {
        dates: csvData.map(d => d.date),
        values: csvData.map(d => d.radiation)
      };
      renderRadiationCharts(window.solarData.values, window.solarData.dates);
    };
    reader.readAsText(file);
  }

  /***************************************************
   * REGRESIÓN LINEAL (Funciones existentes)
   ***************************************************/
  window.processRegression = function() {
    const method = document.getElementById("dataInputMethod").value;
    if (method === "manual") processManualRegression();
    else processFileRegression();
  };

  function processManualRegression() {
    const input = document.getElementById("regressionInput").value.trim();
    if (!input) { alert("Ingresa datos en formato: x,y; x,y; ..."); return; }
    let dataPoints = parseData(input);
    if (!dataPoints) return;
    calculateAndRenderRegression(dataPoints);
  }

  function processFileRegression() {
    const fileInput = document.getElementById("fileUpload");
    if (!fileInput.files.length) { alert("Selecciona un archivo Excel."); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!jsonData.length || jsonData[0].length < 2) { alert("El archivo debe tener 2 columnas (X e Y)."); return; }
      let dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]) }))
                                .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
      if (dataPoints.length === 0) { alert("No se encontraron datos válidos."); return; }
      calculateAndRenderRegression(dataPoints);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseData(input) {
    const pairs = input.split(";").map(p => p.trim()).filter(p => p !== "");
    let dataPoints = [];
    for (let pair of pairs) {
      const nums = pair.split(",").map(n => Number(n.trim()));
      if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
        alert("Datos no válidos. Usa: x,y; x,y; ...");
        return null;
      }
      dataPoints.push({ x: nums[0], y: nums[1] });
    }
    return dataPoints;
  }

  function calculateAndRenderRegression(dataPoints) {
    const resultElem = document.getElementById("regressionResult");
    const ctx = document.getElementById("regressionChart").getContext("2d");
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    resultElem.innerHTML = `<p>Recta: y = ${m.toFixed(2)}x + ${b.toFixed(2)}</p>`;
    const minX = Math.min(...dataPoints.map(pt => pt.x));
    const maxX = Math.max(...dataPoints.map(pt => pt.x));
    const regressionLine = [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
    if (window.dataChartInstance) window.dataChartInstance.destroy();
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Línea", data: regressionLine, type: "line", fill: false, borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { responsive: true, scales: { x: { title: { display: true, text: "Eje X" } }, y: { title: { display: true, text: "Eje Y" } } } }
    });
  }

  /***************************************************
   * AJUSTE CUADRÁTICO
   ***************************************************/
  window.toggleParabolaInput = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    document.getElementById("parabolaManualContainer").style.display = (method === "manual") ? "block" : "none";
    document.getElementById("parabolaFileContainer").style.display = (method === "file") ? "block" : "none";
  };

  window.processParabola = async function() {
    const method = document.getElementById("parabolaInputMethod").value;
    let dataPoints = [];
    if (method === "manual") {
      const input = document.getElementById("parabolaInput").value.trim();
      dataPoints = parseData(input);
    } else {
      const file = document.getElementById("parabolaFileUpload").files[0];
      if (!file) { alert("Sube un archivo Excel."); return; }
      dataPoints = await parseExcelData(file);
    }
    if (!dataPoints || dataPoints.length < 3) { alert("Se requieren al menos 3 puntos."); return; }
    const n = dataPoints.length;
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumY = 0, sumXY = 0, sumX2Y = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumX2 += pt.x ** 2;
      sumX3 += pt.x ** 3;
      sumX4 += pt.x ** 4;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumX2Y += (pt.x ** 2) * pt.y;
    });
    const matrix = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const vector = [sumY, sumXY, sumX2Y];
    try {
      const coefficients = math.lusolve(matrix, vector).flat();
      renderParabolaChart(dataPoints, coefficients);
      document.getElementById("parabolaResult").innerHTML = `<p>Ecuación: y = ${coefficients[0].toFixed(2)}x² + ${coefficients[1].toFixed(2)}x + ${coefficients[2].toFixed(2)}</p>`;
    } catch (error) {
      alert("Error en el ajuste cuadrático: " + error);
    }
  };

  /***************************************************
   * AJUSTE 3D
   ***************************************************/
  window.togglePlaneDataInput = function() {
    const method = document.getElementById("planeDataInputMethod").value;
    if (method === "manual") {
      document.getElementById("planeManualContainer").style.display = "block";
      document.getElementById("planeFileContainer").style.display = "none";
    } else {
      document.getElementById("planeManualContainer").style.display = "none";
      document.getElementById("planeFileContainer").style.display = "block";
    }
  };

  window.addPlaneRow = function() {
    const table = document.getElementById("planeDataTable").getElementsByTagName("tbody")[0];
    const newRow = table.rows[0].cloneNode(true);
    newRow.querySelectorAll("input").forEach(input => input.value = "");
    table.appendChild(newRow);
  };

  window.removePlaneRow = function(btn) {
    const row = btn.parentNode.parentNode;
    const table = row.parentNode;
    if (table.rows.length > 1) { table.removeChild(row); }
  };

  window.processPlane = function() {
    const rows = document.querySelectorAll("#planeDataTable tbody tr");
    let points = [];
    rows.forEach(row => {
      const x = parseFloat(row.querySelector(".plane-input-x").value);
      const y = parseFloat(row.querySelector(".plane-input-y").value);
      const z = parseFloat(row.querySelector(".plane-input-z").value);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) { points.push({ x, y, z }); }
    });
    if (points.length < 3) { alert("Ingresa al menos 3 puntos para ajustar un plano."); return; }
    let X = points.map(pt => [pt.x, pt.y, 1]);
    let Z = points.map(pt => pt.z);
    try {
      const XT = math.transpose(X);
      const XTX = math.multiply(XT, X);
      const invXTX = math.inv(XTX);
      const XTZ = math.multiply(XT, Z);
      const coeffs = math.multiply(invXTX, XTZ);
      const A_coeff = coeffs[0],
            B_coeff = coeffs[1],
            C_coeff = coeffs[2];
      document.getElementById("planeResult").innerHTML = `<p>Plano ajustado: z = ${A_coeff.toFixed(2)}x + ${B_coeff.toFixed(2)}y + ${C_coeff.toFixed(2)}</p>`;
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const gridSize = 20;
      let xGrid = linspace(minX, maxX, gridSize);
      let yGrid = linspace(minY, maxY, gridSize);
      let zGrid = [];
      for (let i = 0; i < gridSize; i++) {
        let row = [];
        for (let j = 0; j < gridSize; j++) {
          row.push(A_coeff * xGrid[j] + B_coeff * yGrid[i] + C_coeff);
        }
        zGrid.push(row);
      }
      const data = [
        {
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          z: points.map(p => p.z),
          mode: 'markers',
          type: 'scatter3d',
          marker: { size: 4, color: 'red' },
          name: 'Datos'
        },
        {
          x: xGrid,
          y: yGrid,
          z: zGrid,
          type: 'surface',
          opacity: 0.7,
          colorscale: 'Viridis',
          name: 'Plano Ajustado'
        }
      ];
      const layout = {
        title: 'Ajuste 3D (Plano)',
        autosize: true,
        scene: { xaxis: { title: 'X' }, yaxis: { title: 'Y' }, zaxis: { title: 'Z' } }
      };
      Plotly.newPlot('planeChart', data, layout);
    } catch (error) {
      alert("Error en el ajuste 3D: " + error);
    }
  };

  /***************************************************
   * Funciones para Archivos CSV
   ***************************************************/
  function parseCSV(data) {
    const rows = data.split('\n');
    return rows.map(row => {
      const [date, radiation] = row.split(',');
      return { date, radiation: parseFloat(radiation) };
    });
  }

  async function handleCSVUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvData = parseCSV(e.target.result);
      window.solarData = {
        dates: csvData.map(d => d.date),
        values: csvData.map(d => d.radiation)
      };
      renderRadiationCharts(window.solarData.values, window.solarData.dates);
    };
    reader.readAsText(file);
  }

  /***************************************************
   * REGRESIÓN LINEAL (Funciones existentes)
   ***************************************************/
  window.processRegression = function() {
    const method = document.getElementById("dataInputMethod").value;
    if (method === "manual") processManualRegression();
    else processFileRegression();
  };

  function processManualRegression() {
    const input = document.getElementById("regressionInput").value.trim();
    if (!input) { alert("Ingresa datos en formato: x,y; x,y; ..."); return; }
    let dataPoints = parseData(input);
    if (!dataPoints) return;
    calculateAndRenderRegression(dataPoints);
  }

  function processFileRegression() {
    const fileInput = document.getElementById("fileUpload");
    if (!fileInput.files.length) { alert("Selecciona un archivo Excel."); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!jsonData.length || jsonData[0].length < 2) { alert("El archivo debe tener 2 columnas (X e Y)."); return; }
      let dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]) }))
                                .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
      if (dataPoints.length === 0) { alert("No se encontraron datos válidos."); return; }
      calculateAndRenderRegression(dataPoints);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseData(input) {
    const pairs = input.split(";").map(p => p.trim()).filter(p => p !== "");
    let dataPoints = [];
    for (let pair of pairs) {
      const nums = pair.split(",").map(n => Number(n.trim()));
      if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
        alert("Datos no válidos. Usa: x,y; x,y; ...");
        return null;
      }
      dataPoints.push({ x: nums[0], y: nums[1] });
    }
    return dataPoints;
  }

  function calculateAndRenderRegression(dataPoints) {
    const resultElem = document.getElementById("regressionResult");
    const ctx = document.getElementById("regressionChart").getContext("2d");
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    resultElem.innerHTML = `<p>Recta: y = ${m.toFixed(2)}x + ${b.toFixed(2)}</p>`;
    const minX = Math.min(...dataPoints.map(pt => pt.x));
    const maxX = Math.max(...dataPoints.map(pt => pt.x));
    const regressionLine = [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
    if (window.dataChartInstance) window.dataChartInstance.destroy();
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Línea", data: regressionLine, type: "line", fill: false, borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { responsive: true, scales: { x: { title: { display: true, text: "Eje X" } }, y: { title: { display: true, text: "Eje Y" } } } }
    });
  }

  /***************************************************
   * AJUSTE CUADRÁTICO
   ***************************************************/
  window.toggleParabolaInput = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    document.getElementById("parabolaManualContainer").style.display = (method === "manual") ? "block" : "none";
    document.getElementById("parabolaFileContainer").style.display = (method === "file") ? "block" : "none";
  };

  window.processParabola = async function() {
    const method = document.getElementById("parabolaInputMethod").value;
    let dataPoints = [];
    if (method === "manual") {
      const input = document.getElementById("parabolaInput").value.trim();
      dataPoints = parseData(input);
    } else {
      const file = document.getElementById("parabolaFileUpload").files[0];
      if (!file) { alert("Sube un archivo Excel."); return; }
      dataPoints = await parseExcelData(file);
    }
    if (!dataPoints || dataPoints.length < 3) { alert("Se requieren al menos 3 puntos."); return; }
    const n = dataPoints.length;
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumY = 0, sumXY = 0, sumX2Y = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumX2 += pt.x ** 2;
      sumX3 += pt.x ** 3;
      sumX4 += pt.x ** 4;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumX2Y += (pt.x ** 2) * pt.y;
    });
    const matrix = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const vector = [sumY, sumXY, sumX2Y];
    try {
      const coefficients = math.lusolve(matrix, vector).flat();
      renderParabolaChart(dataPoints, coefficients);
      document.getElementById("parabolaResult").innerHTML = `<p>Ecuación: y = ${coefficients[0].toFixed(2)}x² + ${coefficients[1].toFixed(2)}x + ${coefficients[2].toFixed(2)}</p>`;
    } catch (error) {
      alert("Error en el ajuste cuadrático: " + error);
    }
  };

  function renderParabolaChart(dataPoints, coeffs) {
    const ctx = document.getElementById("parabolaChart").getContext("2d");
    if (window.parabolaChartInstance) window.parabolaChartInstance.destroy();
    const xs = dataPoints.map(pt => pt.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const step = (maxX - minX) / 100;
    let parabolaPoints = [];
    for (let x = minX - 2; x <= maxX + 2; x += step) {
      parabolaPoints.push({ x: x, y: coeffs[0] * x ** 2 + coeffs[1] * x + coeffs[2] });
    }
    window.parabolaChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Parábola ajustada", data: parabolaPoints, type: "line", borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { scales: { x: { title: { display: true, text: "X" } }, y: { title: { display: true, text: "Y" } } } }
    });
  }

  async function parseExcelData(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const points = jsonData.filter(row => row.length >= 2)
          .map(row => ({ x: row[0], y: row[1] }));
        resolve(points);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /***************************************************
   * AJUSTE 3D
   ***************************************************/
  window.togglePlaneDataInput = function() {
    const method = document.getElementById("planeDataInputMethod").value;
    if (method === "manual") {
      document.getElementById("planeManualContainer").style.display = "block";
      document.getElementById("planeFileContainer").style.display = "none";
    } else {
      document.getElementById("planeManualContainer").style.display = "none";
      document.getElementById("planeFileContainer").style.display = "block";
    }
  };

  window.addPlaneRow = function() {
    const table = document.getElementById("planeDataTable").getElementsByTagName("tbody")[0];
    const newRow = table.rows[0].cloneNode(true);
    newRow.querySelectorAll("input").forEach(input => input.value = "");
    table.appendChild(newRow);
  };

  window.removePlaneRow = function(btn) {
    const row = btn.parentNode.parentNode;
    const table = row.parentNode;
    if (table.rows.length > 1) { table.removeChild(row); }
  };

  window.processPlane = function() {
    const rows = document.querySelectorAll("#planeDataTable tbody tr");
    let points = [];
    rows.forEach(row => {
      const x = parseFloat(row.querySelector(".plane-input-x").value);
      const y = parseFloat(row.querySelector(".plane-input-y").value);
      const z = parseFloat(row.querySelector(".plane-input-z").value);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) { points.push({ x, y, z }); }
    });
    if (points.length < 3) { alert("Ingresa al menos 3 puntos para ajustar un plano."); return; }
    let X = points.map(pt => [pt.x, pt.y, 1]);
    let Z = points.map(pt => pt.z);
    try {
      const XT = math.transpose(X);
      const XTX = math.multiply(XT, X);
      const invXTX = math.inv(XTX);
      const XTZ = math.multiply(XT, Z);
      const coeffs = math.multiply(invXTX, XTZ);
      const A_coeff = coeffs[0],
            B_coeff = coeffs[1],
            C_coeff = coeffs[2];
      document.getElementById("planeResult").innerHTML = `<p>Plano ajustado: z = ${A_coeff.toFixed(2)}x + ${B_coeff.toFixed(2)}y + ${C_coeff.toFixed(2)}</p>`;
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const gridSize = 20;
      let xGrid = linspace(minX, maxX, gridSize);
      let yGrid = linspace(minY, maxY, gridSize);
      let zGrid = [];
      for (let i = 0; i < gridSize; i++) {
        let row = [];
        for (let j = 0; j < gridSize; j++) {
          row.push(A_coeff * xGrid[j] + B_coeff * yGrid[i] + C_coeff);
        }
        zGrid.push(row);
      }
      const data = [
        {
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          z: points.map(p => p.z),
          mode: 'markers',
          type: 'scatter3d',
          marker: { size: 4, color: 'red' },
          name: 'Datos'
        },
        {
          x: xGrid,
          y: yGrid,
          z: zGrid,
          type: 'surface',
          opacity: 0.7,
          colorscale: 'Viridis',
          name: 'Plano Ajustado'
        }
      ];
      const layout = {
        title: 'Ajuste 3D (Plano)',
        autosize: true,
        scene: { xaxis: { title: 'X' }, yaxis: { title: 'Y' }, zaxis: { title: 'Z' } }
      };
      Plotly.newPlot('planeChart', data, layout);
    } catch (error) {
      alert("Error en el ajuste 3D: " + error);
    }
  };

  /***************************************************
   * Funciones para Archivos CSV
   ***************************************************/
  function parseCSV(data) {
    const rows = data.split('\n');
    return rows.map(row => {
      const [date, radiation] = row.split(',');
      return { date, radiation: parseFloat(radiation) };
    });
  }

  async function handleCSVUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvData = parseCSV(e.target.result);
      window.solarData = {
        dates: csvData.map(d => d.date),
        values: csvData.map(d => d.radiation)
      };
      renderRadiationCharts(window.solarData.values, window.solarData.dates);
    };
    reader.readAsText(file);
  }

  /***************************************************
   * REGRESIÓN LINEAL (Funciones existentes)
   ***************************************************/
  window.processRegression = function() {
    const method = document.getElementById("dataInputMethod").value;
    if (method === "manual") processManualRegression();
    else processFileRegression();
  };

  function processManualRegression() {
    const input = document.getElementById("regressionInput").value.trim();
    if (!input) { alert("Ingresa datos en formato: x,y; x,y; ..."); return; }
    let dataPoints = parseData(input);
    if (!dataPoints) return;
    calculateAndRenderRegression(dataPoints);
  }

  function processFileRegression() {
    const fileInput = document.getElementById("fileUpload");
    if (!fileInput.files.length) { alert("Selecciona un archivo Excel."); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!jsonData.length || jsonData[0].length < 2) { alert("El archivo debe tener 2 columnas (X e Y)."); return; }
      let dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]) }))
                                .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
      if (dataPoints.length === 0) { alert("No se encontraron datos válidos."); return; }
      calculateAndRenderRegression(dataPoints);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseData(input) {
    const pairs = input.split(";").map(p => p.trim()).filter(p => p !== "");
    let dataPoints = [];
    for (let pair of pairs) {
      const nums = pair.split(",").map(n => Number(n.trim()));
      if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
        alert("Datos no válidos. Usa: x,y; x,y; ...");
        return null;
      }
      dataPoints.push({ x: nums[0], y: nums[1] });
    }
    return dataPoints;
  }

  function calculateAndRenderRegression(dataPoints) {
    const resultElem = document.getElementById("regressionResult");
    const ctx = document.getElementById("regressionChart").getContext("2d");
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    resultElem.innerHTML = `<p>Recta: y = ${m.toFixed(2)}x + ${b.toFixed(2)}</p>`;
    const minX = Math.min(...dataPoints.map(pt => pt.x));
    const maxX = Math.max(...dataPoints.map(pt => pt.x));
    const regressionLine = [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
    if (window.dataChartInstance) window.dataChartInstance.destroy();
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "Datos", data: dataPoints, backgroundColor: "#e74c3c", borderColor: "#c0392b", pointRadius: 5 },
          { label: "Línea", data: regressionLine, type: "line", fill: false, borderColor: "#2ecc71", borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: { responsive: true, scales: { x: { title: { display: true, text: "Eje X" } }, y: { title: { display: true, text: "Eje Y" } } } }
    });
  }

  /***************************************************
   * Fin del Script
   ***************************************************/
});


const bwInput = document.getElementById('bodyWeight');
const useBwCheckbox = document.getElementById('useBodyWeight');
const exerciseSelect = document.getElementById('exercise');
const metricSelect = document.getElementById('metric');
const valueInput = document.getElementById('value');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('addBtn');
const statsDiv = document.getElementById('stats');
const chartCanvas = document.getElementById('chart');

const todayISO = new Date().toISOString().split('T')[0];
dateInput.value = todayISO;

let data = JSON.parse(localStorage.getItem('progressData') || '{}');

let chart = null;

function saveData() {
    localStorage.setItem('progressData', JSON.stringify(data));
}

function addEntry() {
    const exercise = exerciseSelect.value;
    const metric = metricSelect.value;
    let value = Number(valueInput.value);
    const date = dateInput.value;

    if (!exercise) {
        alert('Please select an exercise.');
        return;
    }
    if (!value || value <= 0) {
        alert('Please enter a valid value.');
        return;
    }
    if (!date) {
        alert('Please select a date.');
        return;
    }

    if (metric === 'weight' && useBwCheckbox.checked) {
        const bw = Number(bwInput.value);
        if (!bw || bw <= 0) {
            alert('Please enter a valid body weight.');
            return;
        }
        value = bw;
    }

    if (!data[exercise]) data[exercise] = [];
    data[exercise].push({ date, metric, value });
    data[exercise].sort((a, b) => new Date(a.date) - new Date(b.date));

    saveData();
    valueInput.value = '';
    dateInput.value = todayISO;

    renderExercise(exercise);
}

function getStats(entries) {
    if (entries.length === 0) return null;

    const groupedByDate = {};
    entries.forEach(e => {
        if (!groupedByDate[e.date]) groupedByDate[e.date] = [];
        groupedByDate[e.date].push(e);
    });

    let totalVolume = 0;
    let volumeCount = 0;

    Object.values(groupedByDate).forEach(dayEntries => {
        const repsEntry = dayEntries.find(e => e.metric === 'reps');
        const weightEntry = dayEntries.find(e => e.metric === 'weight');
        if (repsEntry && weightEntry) {
            totalVolume += repsEntry.value * weightEntry.value;
            volumeCount++;
        }
    });

    const avgVolume = volumeCount ? totalVolume / volumeCount : 0;

    const maxValue = Math.max(...entries.map(e => e.value));
    const total = entries.reduce((sum, e) => sum + e.value, 0);
    const avg = total / entries.length;

    return { maxValue, total, avg, count: entries.length, totalVolume, avgVolume };
}

function renderExercise(exercise) {
    if (!data[exercise] || data[exercise].length === 0) {
        statsDiv.style.display = 'none';
        chartCanvas.style.display = 'none';
        return;
    }

    const entries = data[exercise];

    const selectedMetric = metricSelect.value;
    const filteredEntries = entries.filter(e => e.metric === selectedMetric || (selectedMetric === 'reps' && e.metric === 'weight'));

    if (filteredEntries.length === 0) {
        statsDiv.style.display = 'none';
        chartCanvas.style.display = 'none';
        return;
    }

    const chartEntries = entries.filter(e => e.metric === selectedMetric);
    if (chartEntries.length === 0) {
        statsDiv.style.display = 'none';
        chartCanvas.style.display = 'none';
        return;
    }

    const labels = chartEntries.map(e => e.date);
    const values = chartEntries.map(e => e.value);

    const stats = getStats(entries);

    statsDiv.style.display = 'block';
    statsDiv.innerHTML = `
        <strong>Exercise:</strong> ${exercise} <br />
        <strong>Metric:</strong> ${selectedMetric} <br />
        <strong>Entries count:</strong> ${stats.count} <br />
        <strong>Total:</strong> ${stats.total.toFixed(2)} <br />
        <strong>Average:</strong> ${stats.avg.toFixed(2)} <br />
        <strong>Max value:</strong> ${stats.maxValue} <br />
        ${selectedMetric === 'reps' ? `<strong>Total volume (reps×weight):</strong> ${stats.totalVolume.toFixed(2)} <br />
        <strong>Average volume per day:</strong> ${stats.avgVolume.toFixed(2)}` : ''}
      `;
    chartCanvas.style.display = 'block';

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${exercise} - ${selectedMetric}`,
                data: values,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.3)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: 'Date' },
                    ticks: { color: '#eee' },
                    grid: { color: '#333' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: selectedMetric },
                    ticks: { color: '#eee' },
                    grid: { color: '#333' }
                }
            },
            plugins: {
                legend: { labels: { color: '#eee' } }
            }
        }
    });
}

exerciseSelect.addEventListener('change', () => {
    renderExercise(exerciseSelect.value);
});
metricSelect.addEventListener('change', () => {
    if (!exerciseSelect.value) return;
    renderExercise(exerciseSelect.value);
});

addBtn.addEventListener('click', addEntry);

if (exerciseSelect.value) renderExercise(exerciseSelect.value);

let currentSemester = [];
let allSemesters = JSON.parse(localStorage.getItem('cgpaData')) || [];
let chart;

// Initialize Chart
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    loadHistory();
});

function addCourse() {
    const course = {
        name: document.getElementById('courseName').value,
        credits: parseInt(document.getElementById('credits').value),
        grade: parseInt(document.getElementById('grade').value)
    };

    currentSemester.push(course);
    updateDisplay();
}

function calculateCGPA() {
    if (currentSemester.length === 0) return 0;
    
    const totalCredits = currentSemester.reduce((sum, course) => sum + course.credits, 0);
    const totalPoints = currentSemester.reduce((sum, course) => sum + (course.grade * course.credits), 0);
    
    return totalPoints / totalCredits;
}

function updateDisplay() {
    const cgpa = calculateCGPA();
    document.getElementById('cgpaValue').textContent = cgpa.toFixed(2);
    document.getElementById('progressFill').style.width = `${cgpa * 10}%`;
    
    updateChart();
}

function saveSemester() {
    const semesterData = {
        date: new Date().toLocaleDateString(),
        cgpa: calculateCGPA(),
        courses: [...currentSemester]
    };

    allSemesters.push(semesterData);
    localStorage.setItem('cgpaData', JSON.stringify(allSemesters));
    currentSemester = [];
    updateDisplay();
    loadHistory();
}

function loadHistory() {
    const historyDiv = document.getElementById('semesterList');
    historyDiv.innerHTML = allSemesters
        .map((sem, index) => `
            <div class="semester">
                <strong>Semester ${index + 1}</strong> (${sem.date}):
                CGPA ${sem.cgpa.toFixed(2)}
            </div>
        `).join('');
}

function initializeChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allSemesters.map((_, i) => `Sem ${i + 1}`),
            datasets: [{
                label: 'CGPA Trend',
                data: allSemesters.map(sem => sem.cgpa),
                borderColor: '#4CAF50',
                tension: 0.4
            }]
        }
    });
}

function updateChart() {
    chart.data.labels = allSemesters.map((_, i) => `Sem ${i + 1}`);
    chart.data.datasets[0].data = allSemesters.map(sem => sem.cgpa);
    chart.update();
}

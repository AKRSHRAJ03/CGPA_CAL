let currentSemester = [];
let allSemesters = JSON.parse(localStorage.getItem('cgpaData')) || [];
let chart;

// Initialize Chart
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    updateCgpaDisplay();
    //loadHistory();
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
    let totalCredits = 0;
    let totalPoints = 0;

    // Use ONLY saved semesters
    allSemesters.forEach(sem => {
        sem.courses.forEach(course => {
            totalCredits += course.credits;
            totalPoints += course.credits * course.grade;
        });
    });

    if (totalCredits === 0) return 0;
    return totalPoints / totalCredits;
}
function calculateCurrentSemesterSGPA() {
    const totalCredits = currentSemester.reduce((sum, c) => sum + c.credits, 0);
    const totalPoints = currentSemester.reduce((sum, c) => sum + (c.grade * c.credits), 0);
    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
}


function calculateSGPA(courses) {
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const totalPoints = courses.reduce((sum, c) => sum + (c.grade * c.credits), 0);
    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
}



function updateDisplay() {
    const sgpa = calculateCurrentSemesterSGPA();
    document.getElementById('cgpaValue').textContent = sgpa.toFixed(2);
    document.getElementById('progressFill').style.width = `${sgpa * 10}%`;

    updateChart();
}
function updateCgpaDisplay() {
    const cgpa = calculateCGPA();
    const cgpaText = cgpa ? cgpa.toFixed(2) : '-';
    if (document.getElementById('cgpaValue')) {
        document.getElementById('cgpaValue').textContent = cgpaText;
    }
    if (document.getElementById('cgpaValueBelowGraph')) {
        document.getElementById('cgpaValueBelowGraph').textContent = cgpaText;
    }
}



function saveSemester() {
    const semesterSGPA = calculateCurrentSemesterSGPA();

    const semesterData = {
        date: new Date().toLocaleDateString(),
        cgpa: semesterSGPA,  // store this semester's SGPA for chart
        courses: [...currentSemester]
    };

    allSemesters.push(semesterData);
    localStorage.setItem('cgpaData', JSON.stringify(allSemesters));
    currentSemester = [];

    updateDisplay(); // Will now show CGPA (from saved data only)
    updateCgpaDisplay();
    loadHistory();
}


function loadHistory() {
    const historyDiv = document.getElementById('semesterList');
    historyDiv.innerHTML = allSemesters
        .map((sem, index) => `
            <div class="semester">
                <h4>Semester ${index + 1} (${sem.date}) - SGPA: ${calculateSGPA(sem.courses).toFixed(2)}</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Course Name</th>
                            <th>Credits</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sem.courses.map(course => `
                            <tr>
                                <td>${course.name}</td>
                                <td>${course.credits}</td>
                                <td>${getGradeLetter(course.grade)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');
}

function getGradeLetter(value) {
    switch (value) {
        case 10: return "O";
        case 9: return "E";
        case 8: return "A";
        case 7: return "B";
        case 6: return "C";
        case 5: return "D";
        case 0: return "F";
        default: return value;
    }
}

function initializeChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    let cumulativeCredits = 0;
    let cumulativePoints = 0;
    const cgpaPoints = [];

    allSemesters.forEach(sem => {
        sem.courses.forEach(course => {
            cumulativeCredits += course.credits;
            cumulativePoints += course.credits * course.grade;
        });
        const cgpa = cumulativeCredits === 0 ? 0 : cumulativePoints / cumulativeCredits;
        cgpaPoints.push(parseFloat(cgpa.toFixed(3)));
    });

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allSemesters.map((_, i) => `Sem ${i + 1}`),
            datasets: [{
                label: 'CGPA Trend',
                data: cgpaPoints,
                borderColor: '#4CAF50', // fallback
                borderWidth: 3,
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointBackgroundColor: '#4CAF50',
                segment: {
                    borderColor: ctx => {
                        const { p0, p1 } = ctx;
                        return p1.parsed.y < p0.parsed.y ? 'red' : '#4CAF50';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'CGPA'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Semester'
                    }
                }
            }
        }
    });
}



function updateChart() {
    let cumulativeCredits = 0;
    let cumulativePoints = 0;
    const cgpaPoints = [];

    allSemesters.forEach(sem => {
        sem.courses.forEach(course => {
            cumulativeCredits += course.credits;
            cumulativePoints += course.credits * course.grade;
        });

        const cgpa = cumulativeCredits === 0 ? 0 : cumulativePoints / cumulativeCredits;
        cgpaPoints.push(parseFloat(cgpa.toFixed(3)));  // keep 3 decimals for accuracy
    });

    chart.data.labels = allSemesters.map((_, i) => `Sem ${i + 1}`);
    chart.data.datasets[0].data = cgpaPoints;
    chart.update();
}

function resetAll() {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        // Clear local storage and in-memory data
        localStorage.removeItem('cgpaData');
        currentSemester = [];
        allSemesters = [];

        // Reset CGPA display
        document.getElementById('cgpaValue').textContent = '-';
        document.getElementById('cgpaValueBelowGraph').textContent = '-';

        // Reset progress bar
        document.getElementById('progressFill').style.width = '0%';

        // Clear semester history if present
        const historyDiv = document.getElementById('semesterList');
        if (historyDiv) historyDiv.innerHTML = '';

        // Reset and clear chart
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update();
        }
    }
}



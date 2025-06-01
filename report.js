const allSemesters = JSON.parse(localStorage.getItem('cgpaData')) || [];

function calculateSGPA(courses) {
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const totalPoints = courses.reduce((sum, c) => sum + c.grade * c.credits, 0);
    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
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
function generateAITips(sgpaList) {
    const latestSGPA = sgpaList[sgpaList.length - 1];
    const avgSGPA = sgpaList.reduce((a, b) => a + b, 0) / sgpaList.length;

    // Calculate current CGPA across all semesters
    const totalCredits = allSemesters.reduce((sum, sem) =>
        sum + sem.courses.reduce((cSum, c) => cSum + c.credits, 0), 0);

    const totalPoints = allSemesters.reduce((sum, sem) =>
        sum + sem.courses.reduce((cSum, c) => cSum + (c.credits * c.grade), 0), 0);

    const currentCGPA = totalCredits === 0 ? 0 : totalPoints / totalCredits;

    let tip = "";
    if (latestSGPA < 6) {
        tip = "Focus on understanding fundamental concepts and consider attending extra tutoring sessions.";
    } else if (latestSGPA < 7.5) {
        tip = "Revise regularly, solve past papers, and manage your time better during exams.";
    } else if (latestSGPA < 9) {
        tip = "You're doing well! Try engaging in study groups and take part in quizzes to improve even more.";
    } else {
        tip = "Excellent work! Maintain consistency and consider helping peers to reinforce your knowledge.";
    }

    return `
        <div class="ai-tips pdf-section">
            <h3>🎓 AI Tips for Academic Improvement</h3>
            <p><strong>Latest SGPA:</strong> ${latestSGPA.toFixed(2)}</p>
            <p><strong>Average SGPA:</strong> ${avgSGPA.toFixed(2)}</p>
            <p><strong>Current CGPA:</strong> ${currentCGPA.toFixed(2)}</p>
            <p>${tip}</p>
        </div>
    `;
}


function loadReport() {
    const container = document.getElementById('reportContainer');
    container.innerHTML = allSemesters.map((sem, index) => `
        <div class="semester pdf-section">
            <div class="pdf-header">
                <h4>Semester ${index + 1}</h4>
                <div class="pdf-meta">
                    <span class="pdf-date">${sem.date}</span>
                    <span class="sgpa-badge">SGPA: ${calculateSGPA(sem.courses).toFixed(2)}</span>
                </div>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th class="course-name">Course Name</th>
                        <th class="credits">Credits</th>
                        <th class="grade">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${sem.courses.map(course => `
                        <tr class="course-row">
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


function drawChart() {
    const canvas = document.getElementById('cgpaChart');
    if (!canvas) {
        console.error('Canvas element with id "cgpaChart" not found');
        return;
    }

    if (allSemesters.length === 0) {
        console.warn('No semester data available for chart');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Properly check and destroy existing chart
    if (window.cgpaChart instanceof Chart) {
        window.cgpaChart.destroy();
    }

    // Calculate trend with NUMBERS (not strings)
    const trend = allSemesters.map(sem => 
        Number(calculateSGPA(sem.courses).toFixed(2))
    );

    // Create new chart with full configuration
    window.cgpaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allSemesters.map((_, i) => `Sem ${i + 1}`),
            datasets: [{
                label: 'SGPA Trend',
                data: trend,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'SGPA'
                    }
                },
                x: {
                   title: {
                       display: true,
                       text: 'Semester' // Optional but useful
            }
        }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadReport();
    drawChart();
});
function generatePDF() {
    const pdfContent = document.createElement('div');

    const header = `
        <div class="pdf-header">
            <h1>📘 Official Academic Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <hr>
        </div>
    `;

    const footer = `
        <div class="pdf-footer">
            <hr>
            <p>© 2025 CGPA Calculator | Confidential Academic Record</p>
        </div>
    `;

    const chartCanvas = document.getElementById('cgpaChart');

    // Convert Chart to Image
    const chartImage = document.createElement('img');
    chartImage.src = chartCanvas.toDataURL('image/png');
    chartImage.style.maxWidth = '100%';
    chartImage.style.marginBottom = '20px';

    // Report and AI Tips Section
    const reportClone = document.querySelector('#reportContainer').cloneNode(true);
    const sgpaList = allSemesters.map(s => calculateSGPA(s.courses));
    const tipsHTML = generateAITips(sgpaList); // your if-else based version

    pdfContent.innerHTML = header;
    pdfContent.appendChild(chartImage); // Use image instead of canvas
    pdfContent.innerHTML += tipsHTML;
    pdfContent.appendChild(reportClone);
    pdfContent.innerHTML += footer;

    // Remove unwanted styles that may cause page breaks
    pdfContent.querySelectorAll('.semester').forEach(el => {
        el.style.pageBreakInside = 'avoid';
    });

    html2pdf()
        .set({
            margin: 10,
            filename: `CGPA_Report_${new Date().toLocaleDateString()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        })
        .from(pdfContent)
        .toPdf()
        .get('pdf')
        .then(pdf => {
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);
            }
        })
        .save();
}



// Add event listener to your existing download button
document.getElementById('downloadPDF').addEventListener('click', generatePDF);

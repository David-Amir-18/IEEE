let allMembers = [];
let filteredMembers = [];
let headers = {};
let interviewData = {}; // Store interview scheduling data
let firebaseInitialized = false;

// Helper function to encode email for Firebase (replace . with ,)
function encodeEmail(email) {
    return email.replace(/\./g, ',');
}

// Helper function to decode email from Firebase (replace , with .)
function decodeEmail(encodedEmail) {
    return encodedEmail.replace(/,/g, '.');
}

// Question mappings for different committees
const questionMap = {
    'Column7': 'How do you usually manage your time between college, activities, and personal life?',
    'Column9': 'What makes a team work effectively together?',
    'Column10': 'How would you make new members feel welcomed and comfortable?',
    'Column11': 'Suggest one creative bonding activity',
    'Column12': 'Questions (HR)',
    'Column13': 'Define the difference between marketing and content creation',
    'Column14': 'Suggest a fun idea for an EMBS post or campaign',
    'Column15': 'What makes a caption attractive to readers?',
    'Column16': 'Mention one platform you think EMBS should focus on and why',
    'Column17': 'Questions (Marketing)',
    'Column18': 'Why do you think PR is important for any organization',
    'Column19': 'Write a short message you would send to convince a company to sponsor EMBS',
    'Column20': 'What do you think makes a partnership successful?',
    'Column21': 'Questions (PR)',
    'Column22': 'What\'s the most important part of planning an event?',
    'Column23': 'How do you stay calm when things don\'t go as planned?',
    'Column24': 'Describe a time you helped in organizing something',
    'Column25': 'Questions (Logistics)',
    'Column26': 'What makes a design eye-catching?',
    'Column27': 'What tools do you use? (PS, AI, Canva)',
    'Column28': 'Mention one software or app you\'d like to learn',
    'Column29': 'If asked to design a post about an EMBS event, what would you include?',
    'Column30': 'Portfolio Link (Design)',
    'Column31': 'Questions (Design)',
    'Column32': 'Do you prefer photography, videography, or editing — and why?',
    'Column33': 'Do you own a professional camera or mobile phone?',
    'Column34': 'What will you be focusing on if you\'re covering an EMBS event?',
    'Column35': 'Mention any tools or apps you\'ve used before',
    'Column36': 'Portfolio Link (Media)',
    'Column37': 'Questions (Media)',
    'Column38': 'What do you know about AI or would like to learn about it?',
    'Column39': 'How do you think AI can help in medicine or healthcare?',
    'Column40': 'What excites you most about learning machine learning?',
    'Column41': 'Questions (AI)',
    'Column42': 'What comes to mind when you hear "embedded systems"?',
    'Column43': 'Have you ever tried using Arduino or sensors before?',
    'Column44': 'What kind of project would you like to build?',
    'Column45': 'Questions (Embedded)',
    'Column46': 'What makes a website design user-friendly?',
    'Column47': 'Mention one website you find well-designed and why',
    'Column48': 'What do you want to learn most about web design?',
    'Column49': 'Questions (Frontend)',
    'Column50': 'What do you think a "server" does in a website?',
    'Column51': 'What programming language would you like to learn?',
    'Column52': 'Why do you think back-end development is important?',
    'Column53': 'Questions (Backend)',
    'Column54': 'What do you think robotics can do in hospitals or labs?',
    'Column55': 'What kind of robot would you want to build?',
    'Column56': 'Do you prefer mechanical, electrical, or coding parts — and why?',
    'Column57': 'Questions (Robotics)',
    'Column58': 'What medical devices do you find most interesting?',
    'Column59': 'Why do hospitals need engineers for equipment planning?',
    'Column60': 'What do you want to learn from this committee?',
    'Column61': 'Questions (Medical Equipment)',
    'Column62': 'What makes a presentation engaging?',
    'Column63': 'How would you encourage shy people to speak in front of others?',
    'Column64': 'What\'s one communication skill you\'d like to improve?',
    'Column65': 'Questions (Training)',
    'Column66': 'What topic or problem in medicine interests you the most?',
    'Column67': 'How do you usually search for reliable information?',
    'Column68': 'What do you hope to learn about research?',
    'Column69': 'Questions (Research)'
};

// Load interview data from Firebase
function loadInterviewData() {
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.log('Firebase not loaded, using localStorage as fallback');
        const saved = localStorage.getItem('embs_interview_data');
        if (saved) {
            interviewData = JSON.parse(saved);
        }
        return;
    }

    // Listen for real-time updates from Firebase
    const interviewRef = firebase.database().ref('interviews');
    interviewRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Decode the Firebase keys back to original emails
            interviewData = {};
            Object.keys(data).forEach(encodedKey => {
                const decodedKey = decodeEmail(encodedKey);
                interviewData[decodedKey] = data[encodedKey];
                // Ensure all entries have contacted field
                if (interviewData[decodedKey].contacted === undefined) {
                    interviewData[decodedKey].contacted = false;
                }
            });
            // Re-render the display to show updated data
            if (firebaseInitialized) {
                displayMembers();
            }
        }
        firebaseInitialized = true;
    });
}

// Save interview data to Firebase
function saveInterviewData() {
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.log('Firebase not loaded, using localStorage as fallback');
        localStorage.setItem('embs_interview_data', JSON.stringify(interviewData));
        return;
    }

    // Encode email keys for Firebase (replace . with ,)
    const encodedData = {};
    Object.keys(interviewData).forEach(key => {
        const encodedKey = encodeEmail(key);
        encodedData[encodedKey] = interviewData[key];
    });

    // Save to Firebase
    const interviewRef = firebase.database().ref('interviews');
    interviewRef.set(encodedData)
        .catch((error) => {
            console.error('Error saving to Firebase:', error);
            // Fallback to localStorage
            localStorage.setItem('embs_interview_data', JSON.stringify(interviewData));
        });
}

// Load members data
async function loadMembers() {
    try {
        const response = await fetch('members.json');
        const data = await response.json();

        // Get headers from first row
        headers = data[0];

        // Load saved interview data
        loadInterviewData();

        // Skip the first row (headers) and process the rest
        allMembers = data.slice(1).map((member, index) => {
            // Collect all answers
            const answers = {};
            for (let key in member) {
                if (member[key] && member[key] !== 'N/A' && key !== 'Column1' && key !== 'Column2' &&
                    key !== 'Column3' && key !== 'Column4' && key !== 'Column5' && key !== 'Column6' && key !== 'Column8') {
                    answers[key] = member[key];
                }
            }

            const memberEmail = member.Column6 || `member_${index}`;

            return {
                id: memberEmail, // Use email as unique identifier
                timestamp: member.Column1 || 'N/A',
                name: member.Column2 || 'N/A',
                university: member.Column3 || 'N/A',
                major: member.Column4 || 'N/A',
                phone: member.Column5 || 'N/A',
                email: memberEmail,
                timeManagement: member.Column7 || 'N/A',
                committee: member.Column8 || 'N/A',
                answers: answers
            };
        });

        filteredMembers = [...allMembers];
        populateFilters();
        updateStats();
        displayMembers();
    } catch (error) {
        console.error('Error loading members:', error);
        document.getElementById('membersGrid').innerHTML = `
            <div class="no-results">
                <h2>Error loading member data</h2>
                <p>Please make sure members.json is in the same directory.</p>
            </div>
        `;
    }
}

// Populate filter dropdowns
function populateFilters() {
    const universities = [...new Set(allMembers.map(m => m.university))].filter(u => u !== 'N/A').sort();
    const committees = [...new Set(allMembers.map(m => m.committee))].filter(c => c !== 'N/A').sort();
    const majors = [...new Set(allMembers.map(m => m.major))].filter(m => m !== 'N/A').sort();

    const universityFilter = document.getElementById('universityFilter');
    const committeeFilter = document.getElementById('committeeFilter');
    const majorFilter = document.getElementById('majorFilter');

    universities.forEach(uni => {
        const option = document.createElement('option');
        option.value = uni;
        option.textContent = uni;
        universityFilter.appendChild(option);
    });

    committees.forEach(comm => {
        const option = document.createElement('option');
        option.value = comm;
        option.textContent = comm;
        committeeFilter.appendChild(option);
    });

    majors.forEach(maj => {
        const option = document.createElement('option');
        option.value = maj;
        option.textContent = maj;
        majorFilter.appendChild(option);
    });
}

// Update statistics
function updateStats() {
    const totalMembers = filteredMembers.length;
    const universities = new Set(filteredMembers.map(m => m.university).filter(u => u !== 'N/A')).size;
    const committees = new Set(filteredMembers.map(m => m.committee).filter(c => c !== 'N/A')).size;

    document.getElementById('stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalMembers}</div>
            <div class="stat-label">Total Members</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${universities}</div>
            <div class="stat-label">Universities</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${committees}</div>
            <div class="stat-label">Committees</div>
        </div>
    `;
}

// Display members
function displayMembers() {
    const grid = document.getElementById('membersGrid');

    if (filteredMembers.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <h2>No members found</h2>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredMembers.map((member, index) => {
        // Get saved interview data for this member
        const interview = interviewData[member.id] || { time: '', mode: '', notes: '', contacted: false };

        // Generate answers HTML
        let answersHTML = '';
        if (Object.keys(member.answers).length > 0) {
            answersHTML = Object.entries(member.answers).map(([key, value]) => {
                const question = questionMap[key] || headers[key] || key;
                return `
                    <div class="answer-item">
                        <div class="question">${question}</div>
                        <div class="answer">${value}</div>
                    </div>
                `;
            }).join('');
        }

        // Determine card color class based on contact status and interview mode
        let cardClass = 'member-card';
        if (!interview.contacted) {
            cardClass += ' not-contacted'; // Red
        } else if (interview.contacted && !interview.mode) {
            cardClass += ' contacted-no-interview'; // Yellow
        } else if (interview.contacted && interview.mode) {
            cardClass += ' contacted-scheduled'; // Green
        }

        return `
            <div class="${cardClass}">
                <div class="member-name">
                    <span>👤</span>
                    <span>${member.name}</span>
                </div>
                <div class="member-info">
                    <span class="info-icon">🎓</span>
                    <span><strong>University:</strong> ${member.university}</span>
                </div>
                <div class="member-info">
                    <span class="info-icon">📚</span>
                    <span><strong>Major:</strong> ${member.major}</span>
                </div>
                <div class="member-info">
                    <span class="info-icon">📧</span>
                    <span><strong>Email:</strong> ${member.email}</span>
                </div>
                <div class="member-info">
                    <span class="info-icon">📱</span>
                    <span><strong>Phone:</strong> ${member.phone}</span>
                </div>
                ${member.committee !== 'N/A' ? `<div class="committee-badge">${member.committee}</div>` : ''}

                <div class="interview-section">
                    <div class="contact-status-container">
                        <label class="contact-switch-label">
                            <span class="contact-label-text">Contact Status:</span>
                            <label class="switch">
                                <input type="checkbox"
                                       ${interview.contacted ? 'checked' : ''}
                                       onchange="saveInterview('${member.id}', 'contacted', this.checked)">
                                <span class="slider"></span>
                            </label>
                            <span class="contact-status-text">${interview.contacted ? 'Contacted' : 'Not Contacted'}</span>
                        </label>
                    </div>

                    <div class="interview-header">📅 Interview Scheduling</div>
                    <div class="interview-controls">
                        <div class="interview-field">
                            <label>Interview Time:</label>
                            <input type="datetime-local"
                                   class="interview-time-input"
                                   value="${interview.time}"
                                   onchange="saveInterview('${member.id}', 'time', this.value)">
                        </div>
                        <div class="interview-field">
                            <label>Mode:</label>
                            <select class="interview-mode-select"
                                    onchange="saveInterview('${member.id}', 'mode', this.value)">
                                <option value="" ${interview.mode === '' ? 'selected' : ''}>Not Set</option>
                                <option value="online" ${interview.mode === 'online' ? 'selected' : ''}>Online</option>
                                <option value="offline" ${interview.mode === 'offline' ? 'selected' : ''}>Offline</option>
                            </select>
                        </div>
                    </div>
                    <div class="interview-field">
                        <label>Notes:</label>
                        <textarea class="interview-notes"
                                  placeholder="Add notes about the interview..."
                                  onchange="saveInterview('${member.id}', 'notes', this.value)">${interview.notes}</textarea>
                    </div>
                    ${interview.time ? `<div class="interview-status scheduled">✓ Interview Scheduled</div>` : ''}
                </div>

                ${answersHTML ? `
                    <button class="expand-btn" onclick="toggleAnswers(${index})">
                        <span class="expand-icon">▼</span>
                        View Application Answers
                    </button>
                    <div class="answers-section" id="answers-${index}">
                        ${answersHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Toggle answers visibility
function toggleAnswers(index) {
    const answersSection = document.getElementById(`answers-${index}`);
    const button = event.target.closest('.expand-btn');
    const icon = button.querySelector('.expand-icon');

    if (answersSection.style.display === 'block') {
        answersSection.style.display = 'none';
        icon.textContent = '▼';
        button.innerHTML = '<span class="expand-icon">▼</span> View Application Answers';
    } else {
        answersSection.style.display = 'block';
        icon.textContent = '▲';
        button.innerHTML = '<span class="expand-icon">▲</span> Hide Application Answers';
    }
}

// Filter members
function filterMembers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const universityFilter = document.getElementById('universityFilter').value;
    const committeeFilter = document.getElementById('committeeFilter').value;
    const majorFilter = document.getElementById('majorFilter').value;

    filteredMembers = allMembers.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm);
        const matchesUniversity = !universityFilter || member.university === universityFilter;
        const matchesCommittee = !committeeFilter || member.committee === committeeFilter;
        const matchesMajor = !majorFilter || member.major === majorFilter;

        return matchesSearch && matchesUniversity && matchesCommittee && matchesMajor;
    });

    updateStats();
    displayMembers();
}

// Save interview scheduling data
function saveInterview(memberId, field, value) {
    if (!interviewData[memberId]) {
        interviewData[memberId] = { time: '', mode: '', notes: '', contacted: false };
    }
    interviewData[memberId][field] = value;
    saveInterviewData();

    // Show a brief confirmation
    showSaveConfirmation();

    // If mode or contacted status changed, re-render to update card colors
    if (field === 'mode' || field === 'contacted') {
        displayMembers();
    }
}

// Show save confirmation
function showSaveConfirmation() {
    const existingNotification = document.querySelector('.save-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '✓ Saved';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Export interview schedule to CSV
function exportSchedule() {
    const scheduled = allMembers.filter(m => interviewData[m.id] && interviewData[m.id].time);

    if (scheduled.length === 0) {
        alert('No interviews scheduled yet!');
        return;
    }

    let csv = 'Name,Email,Phone,University,Committee,Interview Time,Mode,Notes\n';

    scheduled.forEach(member => {
        const interview = interviewData[member.id];
        const time = interview.time ? new Date(interview.time).toLocaleString() : '';
        const row = [
            member.name,
            member.email,
            member.phone,
            member.university,
            member.committee,
            time,
            interview.mode || '',
            (interview.notes || '').replace(/\n/g, ' ')
        ].map(field => `"${field}"`).join(',');
        csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterMembers);
document.getElementById('universityFilter').addEventListener('change', filterMembers);
document.getElementById('committeeFilter').addEventListener('change', filterMembers);
document.getElementById('majorFilter').addEventListener('change', filterMembers);

// Initialize
loadMembers();

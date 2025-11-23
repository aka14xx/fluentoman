(function() {
  const gradeJsonPath = 'lessons/grade5.json';
  const gradeNumber = 5;

  // Load user data
  const savedAvatar = localStorage.getItem('userAvatar');
  const savedUsername = localStorage.getItem('username');
  const weeklyGoal = localStorage.getItem('weeklyGoal') || 40;
  
  const userAvatarEl = document.getElementById('userAvatar');
  const userNameEl = document.getElementById('userName');
  const weeklyGoalEl = document.getElementById('weeklyGoal');
  
  if (savedAvatar && userAvatarEl) userAvatarEl.src = savedAvatar;
  if (savedUsername && userNameEl) userNameEl.textContent = savedUsername;
  if (weeklyGoalEl) weeklyGoalEl.textContent = weeklyGoal;
  
  // Add click to change avatar (redirects to dashboard)
  if (userAvatarEl) {
    userAvatarEl.style.cursor = 'pointer';
    userAvatarEl.title = 'Click to change avatar on Dashboard';
    userAvatarEl.addEventListener('click', () => {
      window.location.href = '/dashboard';
    });
  }

  // Calculate lesson progress and stars
  function getLessonProgress(lessonId) {
    const progress = JSON.parse(localStorage.getItem(`progress:${lessonId}`) || '{}');
    return progress;
  }

  function getLessonStars(lessonId) {
    const stars = localStorage.getItem(`stars:${lessonId}`);
    return stars ? parseInt(stars, 10) : 0;
  }

  function calculateCompletion(progress) {
    if (!progress || !progress.completed) return 0;
    // If lesson is completed, calculate based on sections completed
    const totalSections = 4; // teach, read, practice, review
    const completed = progress.sectionsCompleted || 0;
    return Math.round((completed / totalSections) * 100);
  }

  fetch(`/lessons/grade5.json`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
      return r.json();
    })
    .then(data => {
      const unitsContainer = document.getElementById('unitsContainer');
      const unitNav = document.getElementById('unitNav');
      
      if (!unitsContainer || !data.units || !data.units.length) {
        if (unitsContainer) unitsContainer.innerHTML = `<p>No units found.</p>`;
        return;
      }

      let totalStarsEarned = 0;

      // Build unit navigation (show actual unit titles)
      data.units.forEach(unit => {
        const li = document.createElement('li');
        const label = unit.title || `Unit ${unit.unit}`;
        li.innerHTML = `<a href="#unit${unit.unit}" onclick="scrollToUnit(${unit.unit}); return false;"><span class="unit-icon">📚</span> ${label}</a>`;
        unitNav.appendChild(li);
      });

      // Build lessons
      data.units.forEach(unit => {
        const unitSection = document.createElement('div');
        unitSection.className = 'unit-section';
        unitSection.id = `unit${unit.unit}`;
        
        let lessonsHTML = '';
        if (unit.lessons && unit.lessons.length) {
          lessonsHTML = unit.lessons.map((lesson, index) => {
            const isLocked = lesson.status === 'locked';
            const link = isLocked ? 'javascript:void(0)' : `../lessons.html?id=${lesson.id}`;
            const imgSrc = lesson.image?.startsWith('images/') ? `../${lesson.image}` : (lesson.image || '../images/default_lesson.png');
            
            // Get progress data
            const progress = getLessonProgress(lesson.id);
            const completion = calculateCompletion(progress);
            const starsEarned = getLessonStars(lesson.id);
            const maxStars = lesson.stars || 3;
            
            totalStarsEarned += starsEarned;

            return `
              <a href="${link}" class="lesson-card ${isLocked ? 'locked' : ''}">
                <div class="lesson-card-image-wrap">
                  <img src="${imgSrc}" alt="${lesson.title}" class="lesson-card-image" onerror="this.src='../images/default_lesson.png';">
                  <div class="lesson-number-badge">${index + 1}</div>
                </div>
                <div class="lesson-card-body">
                  <h3 class="lesson-card-title">${lesson.title}</h3>
                  <div class="lesson-meta">
                    <div class="stars-display">
                      <span class="star-icon">⭐</span>
                      <span class="stars-earned">${starsEarned}</span>
                      <span class="stars-max">/ ${maxStars}</span>
                    </div>
                    <div class="completion-badge ${completion === 100 ? 'complete' : ''}">${completion}%</div>
                  </div>
                </div>
              </a>`;
          }).join('');
        }

        unitSection.innerHTML = `
          <div class="unit-header">
            <div class="unit-number">${unit.unit}</div>
            <div class="unit-title">${unit.title}</div>
          </div>
          <div class="lessons-grid">${lessonsHTML}</div>
        `;
        unitsContainer.appendChild(unitSection);
      });

  // Update total stars display
  document.getElementById('totalStars').textContent = totalStarsEarned;
      
  // Render resume-last-lesson pill if available
  renderResumeLastLesson();
      
  // Initialize search functionality
  initializeSearch();
    })
    .catch(err => {
      console.error("Error loading grade curriculum:", err);
      const el = document.getElementById('unitsContainer');
      if(el) el.innerHTML = `<p>Error loading lessons.</p>`;
    });

  // Search functionality
  function initializeSearch() {
    const searchInput = document.getElementById('lessonSearch');
    const searchClear = document.getElementById('searchClear');
    const searchResultsCount = document.getElementById('searchResultsCount');
    const unitsContainer = document.getElementById('unitsContainer');
    const searchKey = `grade${gradeNumber}:lessonSearch`;

    if (!searchInput) return;

    // Handle search input
    searchInput.addEventListener('input', function() {
      const raw = this.value;
      const query = raw.toLowerCase().trim();
      
      // Show/hide clear button
      searchClear.style.display = query ? 'flex' : 'none';
      // Persist query per-grade
      const rawTrimmed = raw.trim();
      if (rawTrimmed) {
        try { localStorage.setItem(searchKey, rawTrimmed); } catch (e) {}
      } else {
        try { localStorage.removeItem(searchKey); } catch (e) {}
      }
      
      if (!query) {
        clearSearch();
        return;
      }
      
      performSearch(query);
    });

    // Handle clear button
    searchClear.addEventListener('click', function() {
      searchInput.value = '';
      searchClear.style.display = 'none';
      try { localStorage.removeItem(searchKey); } catch (e) {}
      clearSearch();
      searchInput.focus();
    });

    // Restore saved query if present
    try {
      const saved = localStorage.getItem(searchKey);
      if (saved && typeof saved === 'string' && saved.trim()) {
        searchInput.value = saved;
        searchClear.style.display = 'flex';
        performSearch(saved.toLowerCase());
      }
    } catch (e) {}

    function performSearch(query) {
      const unitSections = unitsContainer.querySelectorAll('.unit-section');
      let totalMatches = 0;
      let visibleUnits = 0;

      unitSections.forEach(unitSection => {
        const unitTitle = unitSection.querySelector('.unit-title').textContent.toLowerCase();
        const lessonCards = unitSection.querySelectorAll('.lesson-card');
        let unitHasMatch = false;

        lessonCards.forEach(card => {
          const lessonTitle = card.querySelector('.lesson-card-title').textContent.toLowerCase();
          const matches = lessonTitle.includes(query) || unitTitle.includes(query);

          if (matches) {
            card.classList.remove('hidden-by-search');
            card.style.animation = 'fadeInScale 0.3s ease';
            totalMatches++;
            unitHasMatch = true;
          } else {
            card.classList.add('hidden-by-search');
          }
        });

        // Show/hide unit based on matches
        if (unitHasMatch) {
          unitSection.classList.remove('hidden-by-search');
          visibleUnits++;
        } else {
          unitSection.classList.add('hidden-by-search');
        }
      });

      // Update results count
      updateResultsCount(totalMatches, query);
      
      // Show no results message if needed
      showNoResultsMessage(totalMatches, query);
    }

    function clearSearch() {
      const allCards = unitsContainer.querySelectorAll('.lesson-card');
      const allUnits = unitsContainer.querySelectorAll('.unit-section');
      
      allCards.forEach(card => {
        card.classList.remove('hidden-by-search');
        card.style.animation = '';
      });
      
      allUnits.forEach(unit => {
        unit.classList.remove('hidden-by-search');
      });

      searchResultsCount.textContent = '';
      
      // Remove no results message if exists
      const noResultsMsg = document.querySelector('.no-results-message');
      if (noResultsMsg) noResultsMsg.remove();
    }

    function updateResultsCount(count, query) {
      if (count === 0) {
        searchResultsCount.innerHTML = `<span style="color: #ef4444;">No lessons found</span>`;
      } else if (count === 1) {
        searchResultsCount.innerHTML = `Found <strong>1</strong> lesson matching "<strong>${escapeHtml(query)}</strong>"`;
      } else {
        searchResultsCount.innerHTML = `Found <strong>${count}</strong> lessons matching "<strong>${escapeHtml(query)}</strong>"`;
      }
    }

    function showNoResultsMessage(count, query) {
      // Remove existing message
      const existingMsg = document.querySelector('.no-results-message');
      if (existingMsg) existingMsg.remove();

      if (count === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results-message';
        noResultsDiv.style.animation = 'fadeInScale 0.4s ease';
        noResultsDiv.innerHTML = `
          <h3>🔍 No Lessons Found</h3>
          <p>Try searching with different keywords or check the spelling.</p>
          <p style="margin-top: 12px; color: #10b981; font-weight: 600;">Tip: Search by lesson title or unit name!</p>
        `;
        unitsContainer.appendChild(noResultsDiv);
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Render "Resume last lesson" pill (if last opened lesson is from this grade)
  function renderResumeLastLesson() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem('lastLesson') || 'null');
    } catch (e) { data = null; }
    if (!data || !data.id || data.grade !== gradeNumber) return;

    // Respect a session-only dismissal
    try {
      if (sessionStorage.getItem(`hideResume:${gradeNumber}`) === '1') return;
    } catch (e) {}

    const main = document.querySelector('.main-content');
    const beforeEl = document.querySelector('.search-container');
    if (!main) return;

    const pill = document.createElement('div');
    pill.setAttribute('role', 'region');
    pill.setAttribute('aria-label', 'Resume last lesson');
    pill.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-left: 6px solid #10b981;
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      margin-bottom: 16px;
      animation: fadeInScale 0.25s ease;
    `;

    const text = document.createElement('div');
    text.style.cssText = 'display:flex; align-items:center; gap:10px; flex:1; flex-wrap:wrap;';
    const safeTitle = (() => { const d = document.createElement('div'); d.textContent = data.title || data.id; return d.innerHTML; })();
    text.innerHTML = `<span style="font-size:1.25em">⏱️</span>
      <span style="font-weight:700;color:#065f46">Resume last lesson:</span>
      <span style="font-weight:700; color:#065f46">${safeTitle}</span>`;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; align-items:center; gap:8px;';

    const resumeBtn = document.createElement('a');
    resumeBtn.href = `../lessons.html?id=${encodeURIComponent(data.id)}`;
    resumeBtn.textContent = 'Open';
    resumeBtn.style.cssText = `
      text-decoration:none; padding:8px 14px; border-radius:10px;
      background:#10b981; color:white; font-weight:700;
      box-shadow: 0 6px 14px rgba(16,185,129,0.3);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.ariaLabel = 'Dismiss';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      width:32px;height:32px;border-radius:50%; border:none; cursor:pointer;
      background:#f3f4f6; color:#374151; font-weight:700;
    `;
    closeBtn.addEventListener('click', () => {
      pill.remove();
      try { sessionStorage.setItem(`hideResume:${gradeNumber}`, '1'); } catch (e) {}
    });

    actions.appendChild(resumeBtn);
    actions.appendChild(closeBtn);
    pill.appendChild(text);
    pill.appendChild(actions);

    if (beforeEl && beforeEl.parentNode === main) {
      main.insertBefore(pill, beforeEl);
    } else {
      main.prepend(pill);
    }
  }

  // Add CSS animation for search results
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
})();

function scrollToUnit(unitNum) {
  const el = document.getElementById(`unit${unitNum}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Update active state
  document.querySelectorAll('.unit-nav a').forEach(a => a.classList.remove('active'));
  event.target.classList.add('active');
}

function setWeeklyGoal() {
  const currentGoal = document.getElementById('weeklyGoal').textContent;
  
  // Create custom modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 32px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 400px;
    width: 90%;
    animation: slideUp 0.3s ease;
  `;
  
  modalContent.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 3em; margin-bottom: 16px;">⭐</div>
      <h2 style="font-size: 1.8em; color: #9333ea; margin-bottom: 8px; font-family: Poppins, sans-serif;">Set Your Weekly Goal</h2>
      <p style="color: #64748b; margin-bottom: 24px; font-family: Poppins, sans-serif;">Current goal: <strong>${currentGoal} stars</strong></p>
      
      <div style="margin-bottom: 24px;">
        <input 
          type="number" 
          id="goalInput" 
          value="${currentGoal}" 
          min="1" 
          max="200"
          style="
            width: 100%;
            padding: 16px;
            font-size: 1.5em;
            border: 3px solid #a855f7;
            border-radius: 12px;
            text-align: center;
            font-weight: 700;
            color: #9333ea;
            font-family: Poppins, sans-serif;
            box-sizing: border-box;
          "
          placeholder="Enter goal..."
        />
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button 
          id="cancelBtn"
          style="
            flex: 1;
            padding: 14px 24px;
            background: #e2e8f0;
            color: #475569;
            border: none;
            border-radius: 12px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            font-family: Poppins, sans-serif;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#cbd5e1'"
          onmouseout="this.style.background='#e2e8f0'"
        >
          Cancel
        </button>
        <button 
          id="saveBtn"
          style="
            flex: 1;
            padding: 14px 24px;
            background: linear-gradient(135deg, #a855f7, #7e22ce);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            font-family: Poppins, sans-serif;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(168, 85, 247, 0.5)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(168, 85, 247, 0.4)'"
        >
          Save Goal
        </button>
      </div>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes successPop {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Focus input and select text
  const input = document.getElementById('goalInput');
  setTimeout(() => {
    input.focus();
    input.select();
  }, 100);
  
  // Handle save
  document.getElementById('saveBtn').onclick = () => {
    const newGoal = input.value;
    if (newGoal && !isNaN(newGoal) && newGoal > 0 && newGoal <= 200) {
      localStorage.setItem('weeklyGoal', newGoal);
      document.getElementById('weeklyGoal').textContent = newGoal;
      
      // Animate modal out
      modal.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => modal.remove(), 200);
      
      // Show beautiful success notification
      showSuccessNotification(newGoal);
    } else {
      input.style.borderColor = '#ef4444';
      input.style.animation = 'shake 0.3s ease';
      setTimeout(() => {
        input.style.borderColor = '#a855f7';
        input.style.animation = '';
      }, 300);
    }
  };
  
  // Handle cancel
  document.getElementById('cancelBtn').onclick = () => {
    modal.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => modal.remove(), 200);
  };
  
  // Handle Enter key
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      document.getElementById('saveBtn').click();
    }
  };
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => modal.remove(), 200);
    }
  };
}

function showSuccessNotification(goal) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 20px 28px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1.1em;
    box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
    z-index: 10001;
    animation: successPop 0.4s ease;
    font-family: Poppins, sans-serif;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  notification.innerHTML = `
    <span style="font-size: 1.5em;">🎯</span>
    <span>Goal updated to <strong>${goal}</strong> stars!</span>
  `;
  
  document.body.appendChild(notification);
  
  // Add shake animation
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(shakeStyle);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Make function globally accessible
window.setWeeklyGoal = setWeeklyGoal;


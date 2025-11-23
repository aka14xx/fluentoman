(function() {
  const gradeJsonPath = 'lessons/grade5.json';
  const gradeNumber = 5;

  // Load user data
  const savedAvatar = localStorage.getItem('userAvatar');
  const savedUsername = localStorage.getItem('username');
  const weeklyGoal = localStorage.getItem('weeklyGoal') || 40;
  
  if (savedAvatar) document.getElementById('userAvatar').src = savedAvatar;
  if (savedUsername) document.getElementById('userName').textContent = savedUsername;
  document.getElementById('weeklyGoal').textContent = weeklyGoal;

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

  fetch(`../${gradeJsonPath}`)
    .then(r => r.json())
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
    })
    .catch(err => {
      console.error("Error loading grade curriculum:", err);
      const el = document.getElementById('unitsContainer');
      if(el) el.innerHTML = `<p>Error loading lessons.</p>`;
    });
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


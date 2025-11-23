(function() {
  const gradeJsonPath = 'lessons/grade7.json';
  const gradeNumber = 7;

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
  const newGoal = prompt(`Set your weekly star goal!\n\nCurrent goal: ${currentGoal}\n\nEnter new goal:`, currentGoal);
  if (newGoal && !isNaN(newGoal) && newGoal > 0) {
    localStorage.setItem('weeklyGoal', newGoal);
    document.getElementById('weeklyGoal').textContent = newGoal;
    
    // Show success message
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    message.textContent = `✨ Goal updated to ${newGoal} stars!`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => message.remove(), 300);
    }, 2500);
  }
}

// Make function globally accessible
window.setWeeklyGoal = setWeeklyGoal;

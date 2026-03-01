/**
 * AG-TRAINEE App Logic V3
 * Vanilla JS mock implementation for mobile cockpit UI
 * Features: Monthly Setup, Set-by-Set Logging
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- State & Mock Data ---
    const userSettings = {
        target: 'hypertrophy',
        split: '3split',
        freq: 12,
        commute: 15,
        timePref: 'night',
        macros: { cal: 2500, p: 150, c: 300, f: 60 },
        sync: true
    };

    let consumedMacros = { p: 75, c: 180, f: 40 };
    let isMonthlySetupDone = false; // Mock monthly flag

    // --- Tab Navigation & View Management ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');

    function switchTab(targetId) {
        // Handle bottom nav active states
        if (targetId.startsWith('view-')) {
            navButtons.forEach(b => {
                if (b.getAttribute('data-target') === targetId) b.classList.add('active');
                else b.classList.remove('active');
            });
        }

        viewSections.forEach(v => v.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');

        if (targetId !== 'view-feedback') {
            document.getElementById('feedback-success').classList.add('hidden');
            document.getElementById('feedback-abort').classList.add('hidden');
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-target'));
        });
    });

    // --- 0. Monthly Setup Boot ---
    // At launch, decide which view to show
    if (!isMonthlySetupDone) {
        document.getElementById('bottom-nav').style.display = 'none'; // Hide nav during setup
        switchTab('view-monthly-setup');
    } else {
        switchTab('view-dashboard');
    }

    // Monthly Setup Actions
    document.getElementById('btn-build-monthly').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> カレンダー再構築中...';

        setTimeout(() => {
            isMonthlySetupDone = true;
            document.getElementById('bottom-nav').style.display = 'flex';
            document.getElementById('monthly-remind-badge').classList.add('hidden');
            switchTab('view-dashboard');
            alert("1ヶ月分の予定をカレンダーに登録しました！");

            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 1ヶ月プランを一括生成する';
        }, 1500);
    });

    document.getElementById('btn-skip-setup').addEventListener('click', () => {
        isMonthlySetupDone = true;
        document.getElementById('bottom-nav').style.display = 'flex';
        // Show a reminder badge on dash
        document.getElementById('monthly-remind-badge').classList.remove('hidden');
        switchTab('view-dashboard');
    });

    // Remind badge click
    document.getElementById('badge-go-setup').addEventListener('click', () => {
        document.getElementById('bottom-nav').style.display = 'none';
        switchTab('view-monthly-setup');
    });

    // Setting trigger
    document.getElementById('btn-trigger-setup').addEventListener('click', () => {
        document.getElementById('bottom-nav').style.display = 'none';
        switchTab('view-monthly-setup');
    });

    // --- 1. Dashboard Accept ---
    document.getElementById('btn-accept-protocol').addEventListener('click', (e) => {
        const btn = e.target;
        btn.innerHTML = "<i class='fa-solid fa-calendar-check'></i> カレンダー登録完了";
        btn.style.background = "var(--success)";
        btn.classList.remove('pulse');
        setTimeout(() => {
            switchTab('view-logger');
            btn.style.background = "var(--primary)";
            btn.innerHTML = "<i class=\"fa-solid fa-calendar-plus\"></i> カレンダーに登録 (OK)";
            btn.classList.add('pulse');
        }, 800);
    });

    // --- 2. Workout Logger (V3 Card UI with detailed sets) ---
    // V3 Data Structure: Sets are arrays of objects
    const menus = {
        'A': [
            {
                id: 1, name: 'ベンチプレス', activeSetIndex: 0, sets: [
                    { id: 101, weight: 80, reps: 10, done: false },
                    { id: 102, weight: 80, reps: 10, done: false },
                    { id: 103, weight: 75, reps: 8, done: false }
                ]
            },
            {
                id: 2, name: 'インクラインDB', activeSetIndex: 0, sets: [
                    { id: 201, weight: 30, reps: 12, done: false },
                    { id: 202, weight: 30, reps: 12, done: false },
                    { id: 203, weight: 28, reps: 10, done: false }
                ]
            },
            {
                id: 3, name: 'ディップス', activeSetIndex: 0, sets: [
                    { id: 301, weight: 0, reps: 15, done: false },
                    { id: 302, weight: 0, reps: 15, done: false }
                ]
            }
        ],
        'B': [
            {
                id: 4, name: 'デッドリフト', activeSetIndex: 0, sets: [
                    { id: 401, weight: 120, reps: 5, done: false },
                    { id: 402, weight: 120, reps: 5, done: false },
                    { id: 403, weight: 120, reps: 5, done: false }
                ]
            }
            // (Mock truncated for brevity)
        ]
    };

    let currentWorkout = JSON.parse(JSON.stringify(menus['A']));

    const cardsContainer = document.getElementById('workout-cards-container');
    const menuSelect = document.getElementById('my-menu-select');

    menuSelect.addEventListener('change', (e) => {
        currentWorkout = JSON.parse(JSON.stringify(menus[e.target.value] || menus['A']));
        renderWorkoutCards();
    });

    function renderWorkoutCards() {
        cardsContainer.innerHTML = '';
        currentWorkout.forEach((ex) => {
            const isAllDone = ex.sets.every(s => s.done);
            const activeSet = ex.sets[ex.activeSetIndex];

            // 1. Build tabs HTML
            let tabsHtml = '';
            ex.sets.forEach((set, index) => {
                const isActive = index === ex.activeSetIndex ? 'active' : '';
                const isDone = set.done ? 'done' : '';
                tabsHtml += `<button class="set-tab-btn ${isActive} ${isDone}" data-ex-id="${ex.id}" data-set-index="${index}">S${index + 1}</button>`;
            });

            // 2. Build slider HTML for currently active set
            const sliderHtml = `
                <!-- Weight Slider -->
                <div class="slider-row mb-10">
                    <span class="slider-label">重量</span>
                    <div class="slider-container">
                        <span class="val-display" id="val-w-${ex.id}">${activeSet.weight > 0 ? activeSet.weight : 'BW'}<span class="unit">${activeSet.weight > 0 ? 'kg' : ''}</span></span>
                        <input type="range" class="slider ex-slider-${ex.id}" data-ex-id="${ex.id}" data-type="weight" min="0" max="150" step="2.5" value="${activeSet.weight}">
                    </div>
                </div>
                <!-- Reps Slider -->
                <div class="slider-row">
                    <span class="slider-label">回数</span>
                    <div class="slider-container">
                        <span class="val-display" id="val-r-${ex.id}">${activeSet.reps}<span class="unit">回</span></span>
                        <input type="range" class="slider ex-slider-${ex.id}" data-ex-id="${ex.id}" data-type="reps" min="1" max="30" step="1" value="${activeSet.reps}">
                    </div>
                </div>
            `;

            // 3. Assemble Card
            const card = document.createElement('div');
            card.className = `workout-card ${isAllDone ? 'all-done' : ''}`;
            card.id = `card-ex-${ex.id}`;
            card.innerHTML = `
                <div class="workout-card-header">
                    <span>${ex.name}</span>
                    <i class="fa-regular ${isAllDone ? 'fa-circle-check' : 'fa-circle'} card-status-icon" id="card-icon-${ex.id}"></i>
                </div>
                <div class="set-tabs" id="tabs-${ex.id}">
                    ${tabsHtml}
                </div>
                <!-- Sliders for current set -->
                <div class="set-content-area" id="content-${ex.id}">
                    <div class="sliders-group" id="sliders-${ex.id}">
                        ${sliderHtml}
                    </div>
                    <!-- Done Button -->
                    <button class="set-done-btn ${activeSet.done ? 'done' : ''}" data-ex-id="${ex.id}" id="btn-done-${ex.id}">
                        <i class="fa-solid fa-check"></i>
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        attachCardEvents();
    }

    function updateCardContentArea(exId, activeIndex) {
        // Find data
        const ex = currentWorkout.find(x => x.id == exId);
        const activeSet = ex.sets[activeIndex];
        ex.activeSetIndex = activeIndex;

        // Update Tabs visual
        const tabsContainer = document.getElementById(`tabs-${exId}`);
        Array.from(tabsContainer.children).forEach((tab, idx) => {
            if (idx === activeIndex) tab.classList.add('active');
            else tab.classList.remove('active');
        });

        // Generate new slider HTML
        const sliderHtml = `
            <div class="slider-row mb-10">
                <span class="slider-label">重量</span>
                <div class="slider-container">
                    <span class="val-display" id="val-w-${ex.id}">${activeSet.weight > 0 ? activeSet.weight : 'BW'}<span class="unit">${activeSet.weight > 0 ? 'kg' : ''}</span></span>
                    <input type="range" class="slider ex-slider-${ex.id}" data-ex-id="${ex.id}" data-type="weight" min="0" max="150" step="2.5" value="${activeSet.weight}">
                </div>
            </div>
            <div class="slider-row">
                <span class="slider-label">回数</span>
                <div class="slider-container">
                    <span class="val-display" id="val-r-${ex.id}">${activeSet.reps}<span class="unit">回</span></span>
                    <input type="range" class="slider ex-slider-${ex.id}" data-ex-id="${ex.id}" data-type="reps" min="1" max="30" step="1" value="${activeSet.reps}">
                </div>
            </div>
        `;
        document.getElementById(`sliders-${exId}`).innerHTML = sliderHtml;

        // Update Done Button State
        const doneBtn = document.getElementById(`btn-done-${exId}`);
        if (activeSet.done) doneBtn.classList.add('done');
        else doneBtn.classList.remove('done');

        // Re-attach slider listeners for this exercise
        attachSliderEventsForExercise(ex.id);
    }

    function attachCardEvents() {
        // Tab clicks
        document.querySelectorAll('.set-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exId = parseInt(e.target.getAttribute('data-ex-id'));
                const index = parseInt(e.target.getAttribute('data-set-index'));
                updateCardContentArea(exId, index);
            });
        });

        // Set Done actions
        document.querySelectorAll('.set-done-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.set-done-btn');
                const exId = parseInt(targetBtn.getAttribute('data-ex-id'));

                const ex = currentWorkout.find(x => x.id == exId);
                const activeIndex = ex.activeSetIndex;
                const activeSet = ex.sets[activeIndex];

                // Toggle logic
                activeSet.done = !activeSet.done;

                // Update specific tab UI
                const tabBtn = document.querySelector(`.set-tab-btn[data-ex-id="${exId}"][data-set-index="${activeIndex}"]`);
                if (activeSet.done) {
                    targetBtn.classList.add('done');
                    tabBtn.classList.add('done');

                    // Optional: If checked, auto-advance to next undone set
                    let nextIndex = activeIndex + 1;
                    if (nextIndex < ex.sets.length) {
                        // Inherit values from current set if next set is untouched default
                        if (!ex.sets[nextIndex].done) {
                            ex.sets[nextIndex].weight = activeSet.weight;
                            ex.sets[nextIndex].reps = activeSet.reps;
                        }
                        // Add slight delay for visual feedback before auto-advance
                        setTimeout(() => {
                            updateCardContentArea(exId, nextIndex);
                        }, 300);
                    }

                } else {
                    targetBtn.classList.remove('done');
                    tabBtn.classList.remove('done');
                }

                // Check if all sets are done
                const isAllDone = ex.sets.every(s => s.done);
                const card = document.getElementById(`card-ex-${exId}`);
                const icon = document.getElementById(`card-icon-${exId}`);
                if (isAllDone) {
                    card.classList.add('all-done');
                    icon.classList.remove('fa-circle');
                    icon.classList.add('fa-circle-check');
                } else {
                    card.classList.remove('all-done');
                    icon.classList.remove('fa-circle-check');
                    icon.classList.add('fa-circle');
                }
            });
        });

        // Initial slider attachments
        currentWorkout.forEach(ex => attachSliderEventsForExercise(ex.id));
    }

    function attachSliderEventsForExercise(exId) {
        const sliders = document.querySelectorAll(`.ex-slider-${exId}`);
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const type = e.target.getAttribute('data-type');
                const val = parseFloat(e.target.value);

                const ex = currentWorkout.find(x => x.id == exId);
                const activeSet = ex.sets[ex.activeSetIndex];
                activeSet[type] = val;

                // Update UI text immediately
                let displayVal = val;
                let unit = '';
                if (type === 'weight') {
                    displayVal = val === 0 ? 'BW' : val;
                    unit = val === 0 ? '' : '<span class="unit">kg</span>';
                } else {
                    unit = '<span class="unit">回</span>';
                }
                const prefixId = type.charAt(0);
                document.getElementById(`val-${prefixId}-${exId}`).innerHTML = displayVal + unit;
            });
        });
    }

    // Initialize Card UI
    renderWorkoutCards();


    // --- 3. Finish / Abort Workouts ---
    document.getElementById('btn-finish-workout').addEventListener('click', () => {
        // Count uncompleted sets across all exercises
        let remainingSets = 0;
        currentWorkout.forEach(ex => {
            remainingSets += ex.sets.filter(s => !s.done).length;
        });

        switchTab('view-feedback');
        document.getElementById('feedback-success').classList.remove('hidden');

        const msgEl = document.getElementById('ai-praise-message');
        if (remainingSets > 0) {
            msgEl.innerHTML = `全体で残り ${remainingSets} セットをスキップしましたが、メイン種目は完了しています。充分な刺激です。残りの調整はカレンダーのAIリカバリーに任せてください。`;
        } else {
            msgEl.innerHTML = `素晴らしい！全てのセットを完璧にクリアしました。筋肉は確実に次のステージへと向かっています。`;
        }
    });

    document.getElementById('btn-abort-workout').addEventListener('click', () => {
        switchTab('view-feedback');
        document.getElementById('feedback-abort').classList.remove('hidden');
    });

    document.getElementById('btn-save-memo').addEventListener('click', () => {
        alert("記録を保存しました！お疲れ様でした。");
        document.getElementById('workout-memo').value = '';
        switchTab('view-dashboard');
    });

    // --- 4. Abort Recovery Engine ---
    const reasons = document.querySelectorAll('input[name="abort-reason"]');
    const planContainer = document.getElementById('ai-recovery-plan');
    const planText = document.getElementById('recovery-plan-text');

    reasons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const reason = e.target.value;
            planContainer.classList.remove('hidden');
            planContainer.classList.add('pulse');
            setTimeout(() => planContainer.classList.remove('pulse'), 1000);

            if (reason === 'work') {
                planText.innerHTML = "明日の提案: 「15分短縮 高強度メニュー」<br><span style='font-size:0.8rem; color:var(--text-main);'>時間がない日用の高効率セットにカレンダーを変更しました。</span>";
            } else if (reason === 'energy') {
                planText.innerHTML = "明日の提案: 「ボリューム50% メンテナンス」<br><span style='font-size:0.8rem; color:var(--text-main);'>回復を最優先します。罪悪感は不要です。</span>";
            } else if (reason === 'social') {
                planText.innerHTML = "明日の提案: 「アルコール・リカバリー休息」<br><span style='font-size:0.8rem; color:var(--text-main);'>トレーニングは明後日にスライドします。楽しんで！</span>";
            } else {
                planText.innerHTML = "スケジュールを1日後ろにスライドしました。";
            }
        });
    });

    document.getElementById('btn-accept-recovery').addEventListener('click', () => {
        alert("AIによるカレンダー再構築が完了しました。ゆっくり休んでください。");
        switchTab('view-dashboard');
        planContainer.classList.add('hidden');
        reasons.forEach(r => r.checked = false);
    });

    // --- 5. Nutrition Engine ---
    const nutritionRecs = [
        { name: "ザバス ミルクプロテイン", protein: 15, carbs: 10, fat: 0, store: "セブンイレブン" },
        { name: "サラダチキン(ハーブ)", protein: 24, carbs: 1, fat: 2, store: "ファミマ" },
        { name: "おにぎり(鮭)", protein: 4, carbs: 40, fat: 1, store: "ローソン" },
        { name: "ギリシャヨーグルト", protein: 10, carbs: 5, fat: 0, store: "全般" }
    ];

    const foodContainer = document.getElementById('food-rec-container');

    function updateNutritionUI() {
        const lackP = Math.max(0, userSettings.macros.p - consumedMacros.p);
        const lackC = Math.max(0, userSettings.macros.c - consumedMacros.c);
        const lackF = Math.max(0, userSettings.macros.f - consumedMacros.f);

        document.getElementById('nutri-target-cal').textContent = userSettings.macros.cal;
        document.getElementById('lack-p').textContent = lackP;
        document.getElementById('lack-c').textContent = lackC;
        document.getElementById('lack-f').textContent = lackF;

        const percP = Math.min(100, (consumedMacros.p / userSettings.macros.p) * 100);
        const percC = Math.min(100, (consumedMacros.c / userSettings.macros.c) * 100);
        const percF = Math.min(100, (consumedMacros.f / userSettings.macros.f) * 100);

        document.getElementById('bar-p').style.width = percP + '%';
        document.getElementById('bar-c').style.width = percC + '%';
        document.getElementById('bar-f').style.width = percF + '%';

        // Render food recs based on what's lacking
        foodContainer.innerHTML = '';
        let recs = [...nutritionRecs];
        if (lackP < 10) recs = recs.filter(r => r.protein < 15);

        recs.slice(0, 3).forEach(food => {
            const div = document.createElement('div');
            div.classList.add('food-item');
            div.innerHTML = `
                <div class="food-info">
                    <strong>${food.name}</strong>
                    <span><i class="fa-solid fa-store"></i> ${food.store} | P:${food.protein}C:${food.carbs}F:${food.fat}</span>
                </div>
                <button class="btn-add-food" data-p="${food.protein}" data-c="${food.carbs}" data-f="${food.fat}"><i class="fa-solid fa-plus"></i> LOG</button>
            `;
            foodContainer.appendChild(div);
        });

        // Event listeners for log food buttons
        document.querySelectorAll('.btn-add-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('button');
                const p = parseInt(targetBtn.getAttribute('data-p'));
                const c = parseInt(targetBtn.getAttribute('data-c'));
                const f = parseInt(targetBtn.getAttribute('data-f'));
                consumedMacros.p += p;
                consumedMacros.c += c;
                consumedMacros.f += f;
                updateNutritionUI();

                targetBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                targetBtn.style.background = 'var(--success)';
                targetBtn.style.color = '#000';
            });
        });
    }

    updateNutritionUI();

    document.getElementById('btn-manual-add').addEventListener('click', () => {
        // dummy manual add feature
        consumedMacros.p += 20;
        consumedMacros.c += 40;
        consumedMacros.f += 10;
        updateNutritionUI();
        alert("現在値を手動で更新しました。(※デモ表示のため固定値を加算)");
    });

    // --- 6. Settings Profile Events ---
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        userSettings.macros.cal = parseInt(document.getElementById('set-cal').value);
        userSettings.macros.p = parseInt(document.getElementById('set-p').value);
        userSettings.macros.c = parseInt(document.getElementById('set-c').value);
        userSettings.macros.f = parseInt(document.getElementById('set-f').value);

        // Update target displays directly for setup mock
        const targetSelect = document.getElementById('set-target');
        const splitSelect = document.getElementById('set-split');
        document.getElementById('setup-target-display').textContent = targetSelect.options[targetSelect.selectedIndex].text;
        document.getElementById('setup-split-display').textContent = splitSelect.options[splitSelect.selectedIndex].text;

        updateNutritionUI();
        alert("設定を保存しました。目標マクロが更新されました。");
    });
});

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

    // --- V4 Tutorial State ---
    const isTutorialDone = localStorage.getItem('ag_tutorial_done') === 'true';

    // ==========================================
    // V5: Google Calendar API (OAuth2) Config
    // ==========================================
    // ▼本番運用時は適切なGCPプロジェクトの認証情報を設定してください▼
    const GAPI_CLIENT_ID = '470517358721-fnnme30m46bv24hf76vrdgcrgmdal67d.apps.googleusercontent.com';
    const GAPI_API_KEY = 'AIzaSyBEiN0KWECX3cnrhHDEgTvQwr4LohXO8nY';
    const GAPI_DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
    const GAPI_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;
    let isGapiAuthorized = false;

    // Load API scripts globally handles
    window.gapiLoadOkay = function () {
        gapi.load('client', initializeGapiClient);
    };

    window.gisLoadOkay = function () {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GAPI_CLIENT_ID,
            scope: GAPI_SCOPES,
            callback: '', // defined at request time
        });
        gisInited = true;
        checkGapiAuthVisibility();
    };

    async function initializeGapiClient() {
        try {
            await gapi.client.init({
                apiKey: GAPI_API_KEY,
                discoveryDocs: GAPI_DISCOVERY_DOCS,
            });
            gapiInited = true;
            checkGapiAuthVisibility();
        } catch (err) {
            console.warn('GAPI Init Error:', err);
        }
    }

    // Since scripts might be loaded before DOM or asynchronously, we hook them up
    if (window.gapi) window.gapiLoadOkay();
    if (window.google) window.gisLoadOkay();

    function checkGapiAuthVisibility() {
        // Init UI states
        if (gapiInited && gisInited) {
            updateGapiAuthUI();
        }
    }

    function updateGapiAuthUI() {
        const btnLogin = document.getElementById('btn-gapi-login');
        const btnLogout = document.getElementById('btn-gapi-logout');
        const statusText = document.getElementById('gapi-status-text');

        if (isGapiAuthorized) {
            btnLogin.classList.add('hidden');
            btnLogout.classList.remove('hidden');
            statusText.innerText = "連携済み (OAuth2 Active)";
            statusText.style.color = "var(--success)";
        } else {
            btnLogin.classList.remove('hidden');
            btnLogout.classList.add('hidden');
            statusText.innerText = "未連携";
            statusText.style.color = "var(--text-main)";
        }
    }

    document.getElementById('btn-gapi-login').addEventListener('click', () => {
        // GAPI / GSI が初期化されていない場合は警告（APIKeyのプレースホルダによるエラーを防ぐ）
        if (GAPI_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT')) {
            alert("開発者向け警告：\n本番動作には正しいGCP Client IDおよびAPI Keyの設定が必要です。\n(実装自体はコードレベルで完了しています)");
            // 疑似的に連携状態にする（UIデモ用）
            isGapiAuthorized = true;
            updateGapiAuthUI();
            return;
        }

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            isGapiAuthorized = true;
            updateGapiAuthUI();
            alert("Google カレンダーとの連携に成功しました！");
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });

    document.getElementById('btn-gapi-logout').addEventListener('click', () => {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            isGapiAuthorized = false;
            updateGapiAuthUI();
            alert("カレンダー連携を解除しました。");
        } else if (GAPI_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT')) {
            isGapiAuthorized = false;
            updateGapiAuthUI();
        }
    });

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

    // --- V4 0. Tutorial Overlay App Boot ---
    if (!isTutorialDone) {
        document.getElementById('bottom-nav').style.display = 'none';
        const modal = document.getElementById('tutorial-overlay');
        modal.classList.add('show');

        const tutStates = [
            { icon: 'fa-rocket', title: '超効率システム起動', desc: 'AG-TRAINEEへようこそ。<br>入力と迷いを極限まで削ぎ落とした、あなた専用のコックピットです。' },
            { icon: 'fa-calendar-check', title: '自動カレンダー構築', desc: '目標と空き時間をAIが解析し、<br>1ヶ月の予定を一瞬でカレンダーに書き込みます。' },
            { icon: 'fa-dumbbell', title: 'スマートLOG機能', desc: 'スクロール不要のカード型UI。<br>1タップで完了し、自動で次のセットへ進みます。' },
            { icon: 'fa-wand-magic-sparkles', title: '罪悪感ゼロのリカバリー', desc: '急な飲み会や残業で中止しても大丈夫。<br>AIが即座に翌日以降のプランを再計算します。' }
        ];

        let tutStep = 0;
        document.getElementById('btn-tut-next').addEventListener('click', () => {
            tutStep++;
            if (tutStep >= tutStates.length) {
                // Finish Tutorial
                localStorage.setItem('ag_tutorial_done', 'true');
                modal.classList.remove('show');
                startMonthlySetupPhase();
                return;
            }
            // Update UI
            document.getElementById('tut-icon').innerHTML = `<i class="fa-solid ${tutStates[tutStep].icon}"></i>`;
            document.getElementById('tut-title').innerText = tutStates[tutStep].title;
            document.getElementById('tut-desc').innerHTML = tutStates[tutStep].desc;

            document.querySelectorAll('.tut-dot').forEach((d, i) => {
                i === tutStep ? d.classList.add('active') : d.classList.remove('active');
            });
            if (tutStep === tutStates.length - 1) document.getElementById('btn-tut-next').innerHTML = 'START <i class="fa-solid fa-play"></i>';
        });
    } else {
        startMonthlySetupPhase();
    }

    // --- 0. Monthly Setup Boot ---
    function startMonthlySetupPhase() {
        if (!isMonthlySetupDone) {
            document.getElementById('bottom-nav').style.display = 'none'; // Hide nav during setup
            switchTab('view-monthly-setup');
        } else {
            document.getElementById('bottom-nav').style.display = 'flex';
            switchTab('view-dashboard');
        }
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

    // --- 1. Dashboard Accept (V4 Intent Logic -> V5 API Insert) ---
    document.getElementById('btn-accept-protocol').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> 登録処理中...";
        btn.style.background = "var(--warning)";
        btn.style.color = "#000";
        btn.classList.remove('pulse');

        // V4/V5 Shared Data
        const summary = "[AG] 本日のプロトコル (胸・三頭)";
        const description = "AG-TRAINEE アプリからの自動生成スケジュールです。\n完全なボリュームをこなす最適なタイミングです。";

        // Create times
        const now = new Date();
        const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30, 0); // today 18:30 (Local)
        const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30, 0);   // today 19:30 (Local)

        if (isGapiAuthorized && !GAPI_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT')) {
            // Real OAuth2 API Request
            const event = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': startDateTime.toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': endDateTime.toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };
            try {
                const request = gapi.client.calendar.events.insert({
                    'calendarId': 'primary',
                    'resource': event
                });
                await request.execute();

                // Success
                btn.innerHTML = "<i class='fa-solid fa-check'></i> 登録完了";
                btn.style.background = "var(--success)";
                btn.style.color = "#fff";

                setTimeout(() => {
                    switchTab('view-logger');
                    btn.style.background = "var(--primary)";
                    btn.style.color = "#111"; // reset to default
                    btn.innerHTML = "<i class=\"fa-solid fa-calendar-plus\"></i> カレンダーに登録 (OK)";
                    btn.classList.add('pulse');
                }, 1000);
            } catch (err) {
                console.error("GAPI Insert Failed:", err);
                alert("カレンダーへの書き込みに失敗しました。詳細：\n" + (err.result?.error?.message || "不明なエラー"));
                btn.style.background = "var(--primary)";
                btn.style.color = "#111";
                btn.innerHTML = "<i class=\"fa-solid fa-calendar-plus\"></i> カレンダーに登録 (OK)";
                btn.classList.add('pulse');
            }
        } else {
            // V4 Fallback: Web Intent Open Window
            const yyyy = now.getUTCFullYear();
            const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(now.getUTCDate()).padStart(2, '0');
            // Add roughly 9 hours for JST in mock URI
            const startStr = `${yyyy}${mm}${dd}T093000Z`;
            const endStr = `${yyyy}${mm}${dd}T103000Z`;
            const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(summary)}&details=${encodeURIComponent(description)}&dates=${startStr}/${endStr}`;

            setTimeout(() => {
                // Open real google calendar intent in new tab
                window.open(url, '_blank');

                // Switch our app UI
                switchTab('view-logger');
                btn.style.background = "var(--primary)";
                btn.style.color = "#111";
                btn.innerHTML = "<i class=\"fa-solid fa-calendar-plus\"></i> カレンダーに登録 (OK)";
                btn.classList.add('pulse');
            }, 1000);
        }
    });

    // --- 2. Workout Logger (V4 Card UI + Editor logic) ---
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

    // --- V4: My Menu Editor ---
    const editorModal = document.getElementById('menu-editor-modal');
    const editorSelect = document.getElementById('editor-menu-select');
    const editorList = document.getElementById('editor-list-container');
    let editingMenuKey = 'A';
    let tempMenuData = []; // Deep copy of the menu currently being edited

    document.getElementById('btn-open-menu-editor').addEventListener('click', () => {
        editorModal.classList.add('show');
        editingMenuKey = 'A';
        editorSelect.value = 'A';
        loadMenuToEditor();
    });

    document.getElementById('btn-close-editor').addEventListener('click', () => {
        editorModal.classList.remove('show');
    });

    editorSelect.addEventListener('change', (e) => {
        editingMenuKey = e.target.value;
        loadMenuToEditor();
    });

    function loadMenuToEditor() {
        tempMenuData = JSON.parse(JSON.stringify(menus[editingMenuKey] || []));
        renderEditorList();
    }

    function renderEditorList() {
        editorList.innerHTML = '';
        tempMenuData.forEach((ex, index) => {
            const div = document.createElement('div');
            div.className = 'editor-item';
            div.innerHTML = `
                <div class="editor-item-top">
                    <input type="text" class="cockpit-input mb-10" style="padding:6px; font-size:0.9rem; font-weight:bold; color:var(--primary);" value="${ex.name}" data-idx="${index}" data-field="name">
                    <button class="delete-ex-btn" data-idx="${index}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <!-- 簡易的に全セット共通のデフォルト値を設定 -->
                <div class="edit-inputs">
                    <div><label>セット数</label><input type="number" min="1" max="10" value="${ex.sets.length}" data-idx="${index}" data-field="setCount"></div>
                    <div><label>重量</label><input type="number" min="0" step="2.5" value="${ex.sets[0]?.weight || 0}" data-idx="${index}" data-field="weight"></div>
                    <div><label>回数</label><input type="number" min="1" value="${ex.sets[0]?.reps || 10}" data-idx="${index}" data-field="reps"></div>
                </div>
            `;
            editorList.appendChild(div);
        });

        // Add event listeners for dynamic inputs
        document.querySelectorAll('.editor-item input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const field = e.target.getAttribute('data-field');
                const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;

                if (field === 'name') {
                    tempMenuData[idx].name = val;
                } else if (field === 'setCount' || field === 'weight' || field === 'reps') {
                    // Update array structure
                    const newCount = field === 'setCount' ? val : tempMenuData[idx].sets.length;
                    const newW = field === 'weight' ? val : (tempMenuData[idx].sets[0]?.weight || 0);
                    const newR = field === 'reps' ? val : (tempMenuData[idx].sets[0]?.reps || 10);

                    const newSets = [];
                    for (let i = 0; i < newCount; i++) {
                        newSets.push({ id: parseInt(`${tempMenuData[idx].id}0${i + 1}`), weight: newW, reps: newR, done: false });
                    }
                    tempMenuData[idx].sets = newSets;
                    if (field === 'setCount') renderEditorList(); // Re-render if count changed because input holds value
                }
            });
        });

        document.querySelectorAll('.delete-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.closest('button').getAttribute('data-idx'));
                tempMenuData.splice(idx, 1);
                renderEditorList();
            });
        });
    }

    document.getElementById('btn-editor-add-ex').addEventListener('click', () => {
        const newId = Date.now() % 10000;
        tempMenuData.push({
            id: newId,
            name: '新しい種目',
            activeSetIndex: 0,
            sets: [
                { id: newId * 10 + 1, weight: 20, reps: 10, done: false },
                { id: newId * 10 + 2, weight: 20, reps: 10, done: false },
                { id: newId * 10 + 3, weight: 20, reps: 10, done: false }
            ]
        });
        renderEditorList();
        // Scroll to bottom
        editorList.scrollTop = editorList.scrollHeight;
    });

    document.getElementById('btn-editor-save').addEventListener('click', () => {
        // Save back to main menus object
        menus[editingMenuKey] = JSON.parse(JSON.stringify(tempMenuData));

        // If the currently viewed menu is the one we edited, re-render it
        const currentMenuOnLog = document.getElementById('my-menu-select').value;
        if (currentMenuOnLog === editingMenuKey) {
            currentWorkout = JSON.parse(JSON.stringify(menus[editingMenuKey]));
            renderWorkoutCards();
        }

        editorModal.classList.remove('show');
        alert(`Menu ${editingMenuKey} を更新し、LOG画面に反映しました！`);
    });
});

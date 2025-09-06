document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let allUsers = [];
    let allReservations = [];
    let guesthouseStatus = {}; // To store status reports from caretakers
    let currentUser = null;
    let currentDate = new Date();
    let settings = {
        managerName: '',
        managerContact: '',
        locationUrl: '',
        signature: 'assets/signature.png',
        stamp: 'assets/stamp.png'
    };

    // --- DOM ELEMENTS ---
    const loginPage = document.getElementById('loginPage');
    const mainPanel = document.getElementById('mainPanel');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    
    const managerNav = document.getElementById('managerNav');
    const caretakerNav = document.getElementById('caretakerNav');
    const managerSections = document.getElementById('managerSections');
    const caretakerSections = document.getElementById('caretakerSections');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const generateLetterBtn = document.getElementById('generateLetterBtn');
    const downloadLetterBtn = document.getElementById('downloadLetterBtn');
    const guesthouseSelect = document.getElementById('guesthouse');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    const saveGeneralSettingsBtn = document.getElementById('saveGeneralSettingsBtn');
    const signatureUpload = document.getElementById('signatureUpload');
    const stampUpload = document.getElementById('stampUpload');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const filterReportsBtn = document.getElementById('filterReportsBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');


    // --- INITIALIZATION ---
    const init = async () => {
        await fetchData();
        loadFromLocalStorage();
        setupEventListeners();
    };

    const fetchData = async () => {
        try {
            const response = await fetch('data/db.json');
            const data = await response.json();
            allUsers = data.users;
            allReservations = data.reservations;
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };

    const loadFromLocalStorage = () => {
        const savedReservations = localStorage.getItem('reservations');
        if (savedReservations) {
            // Combine initial reservations with locally saved ones
            const localReservations = JSON.parse(savedReservations);
            allReservations = [...allReservations, ...localReservations];
        }
        const savedStatus = localStorage.getItem('guesthouseStatus');
        if (savedStatus) {
            guesthouseStatus = JSON.parse(savedStatus);
        }
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
    };

    const saveReservationsToLocalStorage = () => {
        // Only save reservations not present in the original db.json
        const localOnlyReservations = allReservations.slice(initialReservationCount);
        localStorage.setItem('reservations', JSON.stringify(localOnlyReservations));
    };
    
    const saveStatusToLocalStorage = () => {
        localStorage.setItem('guesthouseStatus', JSON.stringify(guesthouseStatus));
    };

    const saveSettingsToLocalStorage = () => {
        localStorage.setItem('settings', JSON.stringify(settings));
    };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        loginBtn.addEventListener('click', handleLogin);
        logoutBtn.addEventListener('click', handleLogout);
        
        // Menu navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-section');
                switchSection(sectionId, e.target);
            });
        });

        generateLetterBtn.addEventListener('click', handleReservationSubmit);
        downloadLetterBtn.addEventListener('click', downloadLetter);
        saveStatusBtn.addEventListener('click', saveGuesthouseStatus);
        saveGeneralSettingsBtn.addEventListener('click', saveGeneralSettings);
        signatureUpload.addEventListener('change', (e) => handleFileUpload(e, 'signature'));
        stampUpload.addEventListener('change', (e) => handleFileUpload(e, 'stamp'));
        changePasswordBtn.addEventListener('click', changePassword);
        filterReportsBtn.addEventListener('click', populateReports);
        exportExcelBtn.addEventListener('click', exportToExcel);
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
    };

    // --- AUTHENTICATION ---
    const handleLogin = () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        const user = allUsers.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = user;
            loginPage.style.display = 'none';
            mainPanel.style.display = 'block';
            loginError.style.display = 'none';
            passwordInput.value = '';
            renderUIForRole();
        } else {
            loginError.style.display = 'block';
        }
    };

    const handleLogout = () => {
        currentUser = null;
        loginPage.style.display = 'flex';
        mainPanel.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    };

    // --- UI RENDERING ---
    const renderUIForRole = () => {
        if (!currentUser) return;

        if (currentUser.role === 'manager') {
            managerNav.style.display = 'block';
            managerSections.style.display = 'block';
            caretakerNav.style.display = 'none';
            caretakerSections.style.display = 'none';
            userRoleDisplay.textContent = `مدیر: ${currentUser.username}`;
            // Activate the default section for manager
            switchSection('dashboard', managerNav.querySelector('.menu-item[data-section="dashboard"]'));
            populateManagerDashboard();
            populateGuesthouseDropdown();
            populateLettersTable();
            populateSettings();
            populateReports();
            renderCalendar();
        } else if (currentUser.role === 'caretaker') {
            caretakerNav.style.display = 'block';
            caretakerSections.style.display = 'block';
            managerNav.style.display = 'none';
            managerSections.style.display = 'none';
            userRoleDisplay.textContent = `سرایدار: ${currentUser.username}`;
            // Activate the default section for caretaker
            switchSection('caretakerDashboard', caretakerNav.querySelector('.menu-item[data-section="caretakerDashboard"]'));
            populateCaretakerDashboard();
        }
    };

    const switchSection = (sectionId, clickedMenuItem) => {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        if (clickedMenuItem) {
            clickedMenuItem.classList.add('active');
        }
    };

    // --- MANAGER-SPECIFIC FUNCTIONS ---
    const populateGuesthouseDropdown = () => {
        const guesthouses = [...new Set(allUsers.filter(u => u.role === 'caretaker').map(u => u.guesthouse))];
        guesthouseSelect.innerHTML = '<option value="">انتخاب کنید</option>';
        guesthouses.forEach(g => {
            const option = `<option value="${g}">${g}</option>`;
            guesthouseSelect.innerHTML += option;
        });
    };

    const handleReservationSubmit = () => {
        const newReservation = {
            id: Date.now(),
            guestName: document.getElementById('guestName').value,
            guestCount: document.getElementById('guestCount').value,
            suiteNumber: document.getElementById('suiteNumber').value,
            guesthouse: document.getElementById('guesthouse').value,
            checkinDate: document.getElementById('checkinDate').value,
            checkoutDate: document.getElementById('checkoutDate').value,
            checkinTime: document.getElementById('checkinTime').value,
            checkoutTime: document.getElementById('checkoutTime').value,
            status: 'pending'
        };

        if (!newReservation.guestName || !newReservation.guesthouse) {
            alert('لطفا تمامی فیلدهای اجباری را پر کنید.');
            return;
        }

        allReservations.push(newReservation);
        saveReservationsToLocalStorage();
        alert('رزرو با موفقیت ثبت شد.');
        document.getElementById('reservationForm').reset();
        generateLetter(newReservation);
    };

    const generateLetter = (res) => {
        const letterText = `
            جناب آقای/سرکار خانم <strong>${res.guestName}</strong>
            به همراه <strong>${res.guestCount}</strong> نفر،
            جهت اقامت در سوئیت شماره <strong>${res.suiteNumber}</strong>
            از تاریخ <strong>${res.checkinDate}</strong> تا تاریخ <strong>${res.checkoutDate}</strong>
            با ساعت ورود <strong>${res.checkinTime}</strong> و ساعت خروج <strong>${res.checkoutTime}</strong>
            به مهمانسرای <strong>${res.guesthouse}</strong> معرفی می‌گردد.
            <br><br>
            همراه داشتن ملحفه و وسایل بهداشتی الزامی است.
            انجام نظافت ساختمان قبل از تخلیه بر عهده میهمان می‌باشد.
        `;
        document.getElementById('letterText').innerHTML = letterText;

        // QR Code
        const qrBox = document.getElementById('qrBox');
        qrBox.innerHTML = ""; // Clear previous QR
        const qr = document.createElement('img');
        // This should be dynamic based on guesthouse location
        const locationLink = settings.locationUrl || "https://maps.google.com"; 
        qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(locationLink)}`;
        qrBox.appendChild(qr);

        document.getElementById('managerName').textContent = settings.managerName || currentUser.username;
        document.getElementById('signaturePreview').src = settings.signature;
        document.getElementById('signaturePreview').style.display = 'block';
        document.getElementById('stampPreview').src = settings.stamp;
        document.getElementById('stampPreview').style.display = 'block';

        switchSection('letterPreview');
    };

    const downloadLetter = () => {
        const letterNode = document.getElementById('letterContent');
        html2canvas(letterNode, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `letter-${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        });
    };

    const populateLettersTable = () => {
        const lettersTableBody = document.querySelector('#lettersTable tbody');
        lettersTableBody.innerHTML = '';

        if (allReservations.length === 0) {
            lettersTableBody.innerHTML = '<tr><td colspan="5">هیچ نامه‌ای یافت نشد.</td></tr>';
            return;
        }

        allReservations.forEach(res => {
            const row = `<tr>
                <td>${res.guestName}</td>
                <td>${res.checkinDate}</td>
                <td>${res.suiteNumber}</td>
                <td>${res.guesthouse}</td>
                <td>
                    <i class="fas fa-eye" title="مشاهده نامه"></i>
                    <i class="fas fa-edit" title="ویرایش"></i>
                    <i class="fas fa-trash" title="حذف"></i>
                </td>
            </tr>`;
            lettersTableBody.innerHTML += row;
        });
    };

    const populateManagerDashboard = () => {
        document.getElementById('activeReservations').textContent = allReservations.length;
        
        const totalGuests = allReservations.reduce((sum, res) => sum + parseInt(res.guestCount || 1), 0);
        document.getElementById('totalGuests').textContent = totalGuests;

        const guesthouses = [...new Set(allUsers.filter(u => u.role === 'caretaker').map(u => u.guesthouse))];
        document.getElementById('activeGuesthouses').textContent = guesthouses.length;

        const caretakerStatusBody = document.querySelector('#caretakerStatusTable tbody');
        caretakerStatusBody.innerHTML = '';
        allUsers.filter(u => u.role === 'caretaker').forEach(c => {
            const status = guesthouseStatus[c.guesthouse]?.occupancyStatus === 'occupied' 
                ? '<span style="color: #ff3366;">●</span> سکونت' 
                : '<span style="color: #00ff00;">●</span> غیرسکونت';
            const row = `<tr>
                <td>${c.username}</td>
                <td>${c.guesthouse}</td>
                <td>${status}</td>
            </tr>`;
            caretakerStatusBody.innerHTML += row;
        });
    };

    const populateSettings = () => {
        document.getElementById('managerNameInput').value = settings.managerName;
        document.getElementById('managerContactInput').value = settings.managerContact;
        document.getElementById('locationUrlInput').value = settings.locationUrl;

        const userSelect = document.getElementById('userToChangePass');
        userSelect.innerHTML = '';
        allUsers.forEach(u => {
            const option = `<option value="${u.username}">${u.username} (${u.role})</option>`;
            userSelect.innerHTML += option;
        });
    };

    const saveGeneralSettings = () => {
        settings.managerName = document.getElementById('managerNameInput').value;
        settings.managerContact = document.getElementById('managerContactInput').value;
        settings.locationUrl = document.getElementById('locationUrlInput').value;
        saveSettingsToLocalStorage();
        alert('تنظیمات عمومی ذخیره شد.');
    };

    const handleFileUpload = (event, type) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                settings[type] = e.target.result;
                saveSettingsToLocalStorage();
                alert(`${type === 'signature' ? 'امضا' : 'مهر'} با موفقیت آپلود شد.`);
            };
            reader.readAsDataURL(file);
        }
    };

    const changePassword = () => {
        const usernameToChange = document.getElementById('userToChangePass').value;
        const newPassword = document.getElementById('newPasswordInput').value;

        if (!newPassword) {
            alert('لطفا رمز عبور جدید را وارد کنید.');
            return;
        }

        const user = allUsers.find(u => u.username === usernameToChange);
        if (user) {
            user.password = newPassword;
            // In a real app, this change should be sent to a server.
            // For this project, we can't modify db.json, so this change is temporary for the session.
            alert(`رمز عبور کاربر ${usernameToChange} با موفقیت تغییر کرد.`);
            document.getElementById('newPasswordInput').value = '';
        }
    };

    const populateReports = () => {
        const guestName = document.getElementById('reportGuestName').value.toLowerCase();
        const guesthouse = document.getElementById('reportGuesthouse').value;
        const dateFrom = document.getElementById('reportDateFrom').value;
        const dateTo = document.getElementById('reportDateTo').value;

        const filtered = allReservations.filter(r => {
            const nameMatch = !guestName || r.guestName.toLowerCase().includes(guestName);
            const guesthouseMatch = !guesthouse || r.guesthouse === guesthouse;
            const dateFromMatch = !dateFrom || r.checkinDate >= dateFrom;
            const dateToMatch = !dateTo || r.checkinDate <= dateTo;
            return nameMatch && guesthouseMatch && dateFromMatch && dateToMatch;
        });

        const reportTableBody = document.querySelector('#reportsTable tbody');
        reportTableBody.innerHTML = '';
        if (filtered.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="5">گزارشی یافت نشد.</td></tr>';
            return;
        }
        filtered.forEach(r => {
            const row = `<tr>
                <td>${r.guestName}</td>
                <td>${r.guesthouse}</td>
                <td>${r.checkinDate}</td>
                <td>${r.checkoutDate}</td>
                <td>${r.status === 'confirmed' ? 'تایید شده' : 'در انتظار'}</td>
            </tr>`;
            reportTableBody.innerHTML += row;
        });
    };

    const exportToExcel = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "نام مهمان,مهمانسرا,تاریخ ورود,تاریخ خروج,وضعیت\n";
        
        const tableRows = document.querySelectorAll("#reportsTable tbody tr");
        tableRows.forEach(row => {
            let rowData = [];
            row.querySelectorAll("td").forEach(cell => {
                rowData.push(cell.textContent);
            });
            csvContent += rowData.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "report.csv");
        document.body.appendChild(link);
        link.click();
    };

    const renderCalendar = () => {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        document.getElementById('currentMonthDisplay').textContent = `${new Date(year, month).toLocaleString('fa-IR', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add day names
        ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].forEach(day => {
            calendarGrid.innerHTML += `<div style="font-weight: bold;">${day}</div>`;
        });

        for (let i = 0; i < firstDay; i++) {
            calendarGrid.innerHTML += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            dayDiv.style.padding = '10px';
            dayDiv.style.border = '1px solid #333';
            
            // Check for reservations on this day
            const reservationsToday = allReservations.filter(r => {
                // This is a simplified check. A real implementation would handle date ranges.
                const checkin = new Date(r.checkinDate.replace(/\//g, '-'));
                return checkin.getDate() === day && checkin.getMonth() === month && checkin.getFullYear() === year;
            });

            if (reservationsToday.length > 0) {
                dayDiv.style.backgroundColor = 'rgba(254, 83, 187, 0.5)';
                dayDiv.style.fontWeight = 'bold';
                dayDiv.title = `${reservationsToday.length} رزرو`;
            }
            calendarGrid.appendChild(dayDiv);
        }
    };

    const changeMonth = (offset) => {
        currentDate.setMonth(currentDate.getMonth() + offset);
        renderCalendar();
    };

    // --- CARETAKER-SPECIFIC FUNCTIONS ---
    const populateCaretakerDashboard = () => {
        const reservationsTableBody = document.querySelector('#caretakerReservationsTable tbody');
        reservationsTableBody.innerHTML = '';
        
        const caretakerGuesthouse = currentUser.guesthouse;
        const filteredReservations = allReservations.filter(r => r.guesthouse === caretakerGuesthouse);

        if (filteredReservations.length === 0) {
            reservationsTableBody.innerHTML = '<tr><td colspan="5">هیچ رزروی برای شما ثبت نشده است.</td></tr>';
            return;
        }

        filteredReservations.forEach(res => {
            const row = `<tr>
                <td>${res.guestName}</td>
                <td>${res.suiteNumber}</td>
                <td>${res.checkinDate}</td>
                <td>${res.checkoutDate}</td>
                <td>
                    <button class="btn-primary btn-sm" data-id="${res.id}" onclick="confirmReservation(${res.id})">
                        ${res.status === 'confirmed' ? 'تایید شده' : 'تایید'}
                    </button>
                </td>
            </tr>`;
            reservationsTableBody.innerHTML += row;
        });
    };

    window.confirmReservation = (id) => {
        const reservation = allReservations.find(r => r.id === id);
        if (reservation) {
            reservation.status = 'confirmed';
            saveReservationsToLocalStorage();
            populateCaretakerDashboard(); // Refresh the view
        }
    };

    const saveGuesthouseStatus = () => {
        const guesthouseName = currentUser.guesthouse;
        const status = {
            occupancyStatus: document.getElementById('occupancyStatus').value,
            lightsStatus: document.getElementById('lightsStatus').value,
            waterStatus: document.getElementById('waterStatus').value,
            cleaningStatus: document.getElementById('cleaningStatus').value,
            facilitiesStatus: document.getElementById('facilitiesStatus').value,
            lastUpdated: new Date().toLocaleString('fa-IR')
        };

        guesthouseStatus[guesthouseName] = status;
        saveStatusToLocalStorage();
        alert('وضعیت مهمانسرا با موفقیت ثبت شد.');
    };

    // --- START THE APP ---
    // Add html2canvas script to the page
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script);

    init();
});

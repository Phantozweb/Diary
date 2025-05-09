import { marked } from 'marked'; // Import the marked library

// Global variable to store student data keyed by academic number
let studentData = null;

// --- Page Navigation Logic ---
const appCover = document.getElementById('app-cover');
const diaryView = document.getElementById('diary-view');
const dateSelectionContainer = document.getElementById('date-selection-container');
const messageApp = document.getElementById('message-app');
const openDiaryBtn = document.getElementById('open-diary-btn');
const birthMonthInput = document.getElementById('birth-month');
const birthDayInput = document.getElementById('birth-day');
const loginError = document.getElementById('login-error');
const userInfo = document.getElementById('user-info');
const messageDisplay = document.getElementById('message-display');

// Safe access to elements that might not exist immediately, providing default dummy objects
const academicLogin = document.getElementById('academic-login') || { classList: { add: () => {}, remove: () => {} }, style: { opacity: '0' } };
const academicNumberInput = document.getElementById('academic-number') || { value: '' };
const academicPasswordInput = document.getElementById('academic-password') || { value: '' };
const academicLoginBtn = document.getElementById('academic-login-btn') || null; // Use null if button isn't strictly needed for initial setup
const academicError = document.getElementById('academic-error') || { classList: { add: () => {}, remove: () => {} }, textContent: '' };

// Function to fetch and parse Student data from JSON
async function fetchAndParseStudentData() {
    try {
        const response = await fetch('students.json');
        const studentsArray = await response.json();

        const students = {};
        // Convert array to object keyed by academic_number for easy lookup
        studentsArray.forEach(student => {
            if (student.academic_number) {
                students[student.academic_number.trim()] = {
                    password: student.password ? student.password.trim() : '',
                    name: student.name ? student.name.trim() : '',
                    message: student.message ? student.message.trim() : '',
                    message_status: student.message_status ? student.message_status.trim() : 'Not Written'
                };
            } else {
                console.warn("Skipping student entry with missing academic_number:", student);
            }
        });

        console.log('Parsed students:', students);
        return students;
    } catch (error) {
        console.error('Error loading student data from JSON:', error);
        return null;
    }
}

// Function to navigate pages
function navigateToPage(currentPage, nextPage) {
    currentPage.classList.remove('active-page');
    currentPage.classList.add('hidden');

    nextPage.classList.remove('hidden');
    nextPage.classList.add('active-page');
}

// Function to show User Message (for academic login success)
function showAcademicUserMessage(userData) {
    if (!userInfo || !messageDisplay) {
        console.error("Missing required DOM elements (userInfo or messageDisplay) to show academic message.");
        return;
    }
    userInfo.textContent = `Welcome, ${userData.name}`;

    // Convert Markdown message to HTML using marked
    const renderedMessageHtml = marked.parse(userData.message);

    // Set the message display with the rendered HTML
    messageDisplay.innerHTML = `
        <div class="diary-entry">
            <div class="entry-body">
                ${renderedMessageHtml}
            </div>
        </div>
    `;
    messageDisplay.classList.remove('hidden'); // Show message display
    // Ensure scrollbar appears if content is long
    messageDisplay.style.overflowY = 'auto';
}

// Function to handle academic login via popup
async function handlePopupAcademicLogin() {
    const academicNumberInput = document.getElementById('popup-academic-number');
    const academicPasswordInput = document.getElementById('popup-academic-password');
    const errorElement = document.getElementById('popup-academic-error');
    const loginPopup = document.querySelector('.student-login-popup'); // Get the popup element

    if (!academicNumberInput || !academicPasswordInput || !errorElement || !loginPopup) {
        console.error("Missing popup login elements.");
        return;
    }

    const academicNumber = academicNumberInput.value.trim();
    const academicPassword = academicPasswordInput.value.trim();

    // Reset previous error
    errorElement.classList.add('hidden');
    errorElement.textContent = '';

    // Use pre-fetched student data
    if (!studentData) {
        errorElement.textContent = 'Student data not loaded. Please try refreshing.';
        errorElement.classList.remove('hidden');
        console.error("Student data is null when attempting login.");
        return;
    }

    // Check if student exists and password matches
    if (studentData[academicNumber] && studentData[academicNumber].password === academicPassword) {
        // Successful login
        const userData = studentData[academicNumber];
        console.log("Academic login successful for:", userData.name);
        showAcademicUserMessage(userData); // Show the student's message
        loginPopup.classList.remove('active'); // Close the popup

        // Optional: Clear popup inputs after successful login
        academicNumberInput.value = '';
        academicPasswordInput.value = '';

    } else {
        // Login failed
        console.log("Academic login failed for number:", academicNumber);
        errorElement.textContent = 'Invalid academic number or password.';
        errorElement.classList.remove('hidden');
    }
}

// Function to check message status
function checkMessageStatus() {
    const academicNumberInput = document.getElementById('popup-academic-number');
    const statusElement = document.getElementById('message-status');
    
    if (!academicNumberInput || !statusElement) {
        console.error("Required elements for message status check not found.");
        return;
    }

    const academicNumber = academicNumberInput.value.trim();

    // Check if student data is loaded
    if (!studentData) {
        statusElement.textContent = 'Student data not loaded. Please try again.';
        statusElement.style.color = 'red';
        return;
    }

    // Find the student by academic number
    const student = studentData[academicNumber];

    if (student) {
        // Check message status
        const messageStatus = student.message_status || 'Not Written';
        
        statusElement.textContent = `Message Status: ${messageStatus}`;
        
        // Color code the status
        if (messageStatus === 'Written') {
            statusElement.style.color = 'green';
        } else {
            statusElement.style.color = 'red';
        }
    } else {
        statusElement.textContent = 'Student not found.';
        statusElement.style.color = 'red';
    }
}

// Update the existing setupStudentLoginFormReveal function to include login functionality
function setupStudentLoginFormReveal() {
    const messageDisplay = document.getElementById('message-display');
    if (!messageDisplay) {
        console.error("message-display element not found, cannot setup student login reveal.");
        return;
    }

    // Remove any existing reveal button to prevent duplicates if this function is called multiple times
    const existingButton = messageDisplay.querySelector('.reveal-student-login-btn');
    if (existingButton) {
        existingButton.remove();
    }

    const revealLoginButton = document.createElement('button');
    revealLoginButton.textContent = 'Student Login';
    revealLoginButton.classList.add('reveal-student-login-btn');
    revealLoginButton.style.display = 'none'; // Hidden by default

    // Find or create the popup login form once
    let loginPopup = document.querySelector('.student-login-popup');
    if (!loginPopup) {
        console.log("Creating student login popup");
        loginPopup = document.createElement('div');
        loginPopup.classList.add('student-login-popup');

        const loginPopupContent = document.createElement('div');
        loginPopupContent.classList.add('student-login-popup-content');

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.classList.add('student-login-popup-close');
        closeButton.addEventListener('click', () => {
            loginPopup.classList.remove('active');
        });

        // Create login form within the popup (similar to original academic login form)
        const loginForm = document.createElement('div');
        loginForm.classList.add('academic-form');
        loginForm.innerHTML = `
            <h2>Student Login</h2>
            <p>Enter your academic number and password.</p>
            <input type="text" id="popup-academic-number" placeholder="Academic Number">
            <input type="password" id="popup-academic-password" placeholder="Password">
            <button id="popup-academic-login-btn">Login</button>
            
            <!-- New Message Status Check Button and Display -->
            <button id="popup-check-message-status-btn" type="button">Check Message Status</button>
            <p id="message-status" class="message-status-display"></p>
            
            <p id="popup-academic-error" class="error-message hidden"></p>
        `;

        loginPopupContent.appendChild(closeButton);
        loginPopupContent.appendChild(loginForm);
        loginPopup.appendChild(loginPopupContent);
        document.body.appendChild(loginPopup);

        // Close popup if clicked outside
        loginPopup.addEventListener('click', (event) => {
            if (event.target === loginPopup) {
                loginPopup.classList.remove('active');
            }
        });

        // Add Enter key support for login to the newly created inputs
        const popupNumberInput = document.getElementById('popup-academic-number');
        const popupPasswordInput = document.getElementById('popup-academic-password');

        if (popupNumberInput) {
            popupNumberInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    handlePopupAcademicLogin();
                }
            });
        }
        if (popupPasswordInput) {
            popupPasswordInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    handlePopupAcademicLogin();
                }
            });
        }

        // Popup login button event - attach handler to the newly created button
        const popupLoginBtn = document.getElementById('popup-academic-login-btn');
        if (popupLoginBtn) {
            popupLoginBtn.addEventListener('click', handlePopupAcademicLogin);
        } else {
            console.error("Popup login button not found after creating popup.");
        }

        // Add event listener for message status check button
        const checkMessageStatusBtn = loginPopupContent.querySelector('#popup-check-message-status-btn');
        if (checkMessageStatusBtn) {
            checkMessageStatusBtn.addEventListener('click', checkMessageStatus);
        }
    } else {
        console.log("Student login popup already exists.");
        // Re-attach event listeners in case the popup was removed/re-added
        const closeButton = loginPopup.querySelector('.student-login-popup-close');
        if (closeButton) {
            // Remove old listener if exists, then add new one
            const oldCloseButton = closeButton.cloneNode(true);
            closeButton.parentNode.replaceChild(oldCloseButton, closeButton);
            oldCloseButton.addEventListener('click', () => {
                loginPopup.classList.remove('active');
            });
        }

        const popupLoginBtn = loginPopup.querySelector('#popup-academic-login-btn');
        if (popupLoginBtn) {
            // Remove old listener if exists, then add new one
            const oldPopupLoginBtn = popupLoginBtn.cloneNode(true);
            popupLoginBtn.parentNode.replaceChild(oldPopupLoginBtn, popupLoginBtn);
            oldPopupLoginBtn.addEventListener('click', handlePopupAcademicLogin);
        }

        const popupNumberInput = loginPopup.querySelector('#popup-academic-number');
        const popupPasswordInput = loginPopup.querySelector('#popup-academic-password');

        if (popupNumberInput) {
            // Remove old listener if exists, then add new one
            const oldPopupNumberInput = popupNumberInput.cloneNode(true);
            popupNumberInput.parentNode.replaceChild(oldPopupNumberInput, popupNumberInput);
            oldPopupNumberInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    handlePopupAcademicLogin();
                }
            });
        }
        if (popupPasswordInput) {
            // Remove old listener if exists, then add new one
            const oldPopupPasswordInput = popupPasswordInput.cloneNode(true);
            popupPasswordInput.parentNode.replaceChild(oldPopupPasswordInput, popupPasswordInput);
            oldPopupPasswordInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    handlePopupAcademicLogin();
                }
            });
        }
    }

    // Add the reveal button to the message display area
    messageDisplay.appendChild(revealLoginButton);

    // Scroll event to show/hide login button
    let isLoginButtonVisible = false;
    // Check if messageDisplay exists before adding event listener
    if (messageDisplay) {
        messageDisplay.addEventListener('scroll', () => {
            // Calculate how close the user is to the bottom
            const scrollThreshold = 100; // Pixels from the bottom to show the button
            const isNearBottom = messageDisplay.scrollHeight - messageDisplay.scrollTop - messageDisplay.clientHeight < scrollThreshold;

            // Check if the messageDisplay actually has scrollable content
            const hasScrollableContent = messageDisplay.scrollHeight > messageDisplay.clientHeight;

            if (hasScrollableContent && isNearBottom && !isLoginButtonVisible) {
                revealLoginButton.style.display = 'block';
                revealLoginButton.style.opacity = '0'; // Start faded out
                // Use requestAnimationFrame to ensure the element is displayed before transitioning
                requestAnimationFrame(() => {
                    revealLoginButton.style.transition = 'opacity 0.3s ease-in-out';
                    revealLoginButton.style.opacity = '1';
                });

                isLoginButtonVisible = true;
            } else if ((!hasScrollableContent || !isNearBottom) && isLoginButtonVisible) {
                revealLoginButton.style.transition = 'opacity 0.3s ease-in-out';
                revealLoginButton.style.opacity = '0';
                revealLoginButton.addEventListener('transitionend', function handleTransitionEnd() {
                    revealLoginButton.style.display = 'none';
                    revealLoginButton.removeEventListener('transitionend', handleTransitionEnd);
                }, { once: true }); // Remove listener after it fires once
                isLoginButtonVisible = false;
            } else if (!hasScrollableContent && isLoginButtonVisible) {
                // Hide button immediately if content is no longer scrollable (e.g., window resized)
                revealLoginButton.style.transition = 'none';
                revealLoginButton.style.display = 'none';
                revealLoginButton.style.opacity = '0';
                isLoginButtonVisible = false;
            }
        });
        // Trigger scroll event once on load to check initial state
        messageDisplay.dispatchEvent(new Event('scroll'));
    }

    // Show popup when login button is clicked
    revealLoginButton.addEventListener('click', () => {
        if (loginPopup) { // Check if popup element exists
            loginPopup.classList.add('active');
            // Clear previous inputs and errors in the popup
            const popupNumberInput = document.getElementById('popup-academic-number');
            const popupPasswordInput = document.getElementById('popup-academic-password');
            const popupErrorElement = document.getElementById('popup-academic-error');

            if (popupNumberInput) popupNumberInput.value = '';
            if (popupPasswordInput) popupPasswordInput.value = '';
            if (popupErrorElement) popupErrorElement.classList.add('hidden');

        } else {
            console.error("Login popup element not found.");
        }
    });
}

// Function to show the special 07/11 message
function showSpecialDateMessage(userData) {
    if (!userInfo || !messageDisplay) {
        console.error("Missing required DOM elements (userInfo or messageDisplay) to show special message.");
        return;
    }
    userInfo.textContent = userData.name; // Use the name from the data

    // Convert Markdown message to HTML using marked
    const renderedMessageHtml = marked.parse(userData.message);

    // Create a wrapper for the message content
    messageDisplay.innerHTML = `
        <div class="message-wrapper">
            <div class="diary-entry">
                <div class="entry-body">
                    ${renderedMessageHtml}
                </div>
            </div>
        </div>
    `;

    // Make message display scrollable
    messageDisplay.classList.remove('hidden');
    messageDisplay.style.overflowY = 'auto'; // Ensure scrollbar appears if content is long

    // Setup student login form reveal *after* the message display is populated and visible
    setupStudentLoginFormReveal();
}

// Event Listeners
if (appCover) {
    appCover.addEventListener('click', () => {
        console.log('Cover tapped, navigating to date selection...');
        navigateToPage(appCover, dateSelectionContainer);
        // Clear inputs and error message when navigating back to date selection
        if (birthMonthInput) birthMonthInput.value = '';
        if (birthDayInput) birthDayInput.value = '';
        if (loginError) {
            loginError.classList.add('hidden');
            loginError.textContent = '';
        }
        // Ensure message app is reset when leaving the cover
        resetMessageAppView();
    });
} else {
    console.error("app-cover element not found.");
}

if (openDiaryBtn) {
    openDiaryBtn.addEventListener('click', () => {
        if (!birthMonthInput || !birthDayInput || !loginError || !dateSelectionContainer || !messageApp) {
            console.error("Missing required DOM elements for date selection login.");
            return;
        }

        const month = birthMonthInput.value.trim();
        const day = birthDayInput.value.trim();

        loginError.classList.add('hidden');
        loginError.textContent = '';

        // Validate only month and day format
        if (!month || !day || month.length !== 2 || day.length !== 2 || isNaN(month) || isNaN(day) || parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31) {
            loginError.textContent = 'Please enter a valid date (MM/DD) using numbers.';
            loginError.classList.remove('hidden');
            return;
        }

        // Specific check for July 11th (07/11)
        if (month === '07' && day === '11') {
            // Construct a lookup key including a year (e.g., 2003) to match the data structure,
            // but the year part of the input is ignored.
            const dateKey = '07/11/2003'; // Using the key corresponding to the specific July 11th entry
            console.log(`Attempting to unlock for date: ${dateKey}`);

            // Note: usersByDate is a hardcoded object provided in usersByDate[07/11/2003].message asset
            // Access it directly assuming it's globally available or loaded before this script runs
            // (In the websim environment, asset content is typically evaluated and available)
            if (typeof usersByDate !== 'undefined' && usersByDate[dateKey]) {
                const user = usersByDate[dateKey];
                console.log('Special date (July 11th) found and entry exists.');
                loginError.classList.add('hidden');

                // Clear date inputs
                birthMonthInput.value = '';
                birthDayInput.value = '';

                // Navigate first, then show message to ensure elements exist in the DOM
                navigateToPage(dateSelectionContainer, messageApp);
                showSpecialDateMessage(user); // Render the special message
                // Academic login form is now part of the message area, handled by setupStudentLoginFormReveal
            } else {
                console.log('Entry for 07/11/2003 not found in data.');
                loginError.textContent = 'An error occurred retrieving the entry.'; // Or 'Entry not found for this date.'
                loginError.classList.remove('hidden');
            }
        } else {
            console.log(`Incorrect date entered: ${month}/${day}`);
            // Updated error message to reflect the correct date
            loginError.textContent = 'Incorrect date. Please enter July 11th.';
            loginError.classList.remove('hidden');
        }
    });
} else {
    console.error("open-diary-btn element not found.");
}

// Initial state setup for the message app page
function resetMessageAppView() {
    // Safe checks for each element
    if (userInfo) userInfo.textContent = '';
    if (messageDisplay) {
        messageDisplay.innerHTML = '';
        // messageDisplay.classList.add('hidden'); // Keep message-display visible but empty
        messageDisplay.style.overflowY = 'auto'; // Ensure scrollability
        // Remove any dynamically added elements like the reveal button
        const revealBtn = messageDisplay.querySelector('.reveal-student-login-btn');
        if (revealBtn) {
            revealBtn.remove();
        }
    }

    // Safe check for academic login popup - ensure it's hidden
    const loginPopup = document.querySelector('.student-login-popup');
    if (loginPopup) {
        loginPopup.classList.remove('active');
        // Clear inputs and error message in popup
        const popupNumberInput = document.getElementById('popup-academic-number');
        const popupPasswordInput = document.getElementById('popup-academic-password');
        const popupErrorElement = document.getElementById('popup-academic-error');

        if (popupNumberInput) popupNumberInput.value = '';
        if (popupPasswordInput) popupPasswordInput.value = '';
        if (popupErrorElement) popupErrorElement.classList.add('hidden');
    }

    console.log('Message app view reset');
}

// Also update the document load/initialization to add safety checks
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ensure main containers are correctly displayed/hidden on load
        if (diaryView) diaryView.classList.remove('hidden'); // Ensure diary view container is visible
        if (appCover) appCover.classList.add('active-page'); // Ensure cover is active initially
        if (dateSelectionContainer) {
            dateSelectionContainer.classList.remove('active-page');
            dateSelectionContainer.classList.add('hidden');
        }
        if (messageApp) {
            messageApp.classList.remove('active-page');
            messageApp.classList.add('hidden');
        }

        resetMessageAppView(); // Set initial state for message app page
        console.log('App initialized successfully.');

        // Fetch student data on load from JSON
        studentData = await fetchAndParseStudentData();
        if (!studentData) {
            console.error("Failed to load student data. Academic login may not work.");
            // Optionally show a message to the user
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});
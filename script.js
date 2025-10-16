        // Global state
        const API_URL = 'http://localhost:5000/api/auth';
        let currentUser = null;
        let isFirstTimeUser = false;
        let caretakerCount = 1; 
        let profileSetupData = {};

        // Navigation functions
        function showWelcome() {
            hideAllScreens();
            document.getElementById('welcomeScreen').classList.remove('hidden');
        }

        function showLogin() {
            hideAllScreens();
            document.getElementById('loginScreen').classList.remove('hidden');
        }

        function showRegister() {
            hideAllScreens();
            document.getElementById('registerScreen').classList.remove('hidden');
        }

        function showCaretakerLogin() {
            hideAllScreens();
            document.getElementById('loginScreen').classList.remove('hidden');
            // Modify login screen for caretaker
            document.querySelector('#loginScreen h2').textContent = 'Caretaker Login';
        }

        function showOTPLogin() {
            hideAllScreens();
            document.getElementById('otpScreen').classList.remove('hidden');
        }

        function showPermissions() {
            hideAllScreens();
            document.getElementById('permissionsScreen').classList.remove('hidden');
        }

        function showProfileSetup() {
            hideAllScreens();
            document.getElementById('profileSetupScreen').classList.remove('hidden');
            // Pre-fill with registration data
            if (currentUser) {
                document.getElementById('profileName').value = currentUser.name;
                document.getElementById('profileAge').value = currentUser.age;
                document.getElementById('profileGender').value = currentUser.gender;
            }
        }

        function showCaretakerSetup() {
            hideAllScreens();
            document.getElementById('caretakerScreen').classList.remove('hidden');
        }

        function showHome() {
            hideAllScreens();
            document.getElementById('homeScreen').classList.remove('hidden');
            if (currentUser) {
                document.getElementById('userName').textContent = currentUser.name;
            }
        }

        function hideAllScreens() {
            const screens = ['welcomeScreen', 'loginScreen', 'registerScreen', 'otpScreen', 'permissionsScreen', 'profileSetupScreen', 'caretakerScreen', 'homeScreen', 'featureScreen'];
            screens.forEach(screen => {
                document.getElementById(screen).classList.add('hidden');
            });
        }

        // Authentication handlers
        async function handleLogin(event) {
            event.preventDefault();
            const phone = document.getElementById('loginPhone').value;

            try {
                // Send a POST request to your backend's login endpoint
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone }) // Send just the phone number
                });
            
                const data = await response.json();
            
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed.');
                }
            
                // Success! The server sent the OTP.
                // Save the phone number so the verifyOTP function knows who is verifying.
                localStorage.setItem('phoneForVerification', phone);
                isFirstTimeUser = false; // This is a login, not a new registration
                showOTPLogin(); // Go to the OTP screen
            
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }

        async function handleRegister(event) {
            event.preventDefault();
            const firstName = document.getElementById('regFirstName').value;
            const lastName = document.getElementById('regLastName').value;
            const name = `${firstName} ${lastName}`; // Combine first and last name
            const age = document.getElementById('regAge').value;
            const gender = document.getElementById('regGender').value;
            const phone = document.getElementById('regPhone').value;

            // Temporarily save details to pre-fill the profile setup page later
            localStorage.setItem('tempUserForSetup', JSON.stringify({ name, age, gender }));

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, age, gender, phone })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed.');
                }
            
                // Success! The server sent the OTP.
                // Save the phone number to use it on the OTP screen.
                localStorage.setItem('phoneForVerification', phone);
                isFirstTimeUser = true;
                showOTPLogin();

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }

        async function verifyOTP() {
            // Get the OTP from the input fields
            let otp = Array.from(document.querySelectorAll('.otp-input')).map(input => input.value).join('');

            if (otp.length !== 6) {
                return alert('Please enter the complete 6-digit OTP');
            }

            // Get the phone number we saved from the previous screen
            const phone = localStorage.getItem('phoneForVerification');
            if (!phone) {
                alert('Error: Phone number not found. Please try logging in again.');
                return showLogin();
            }
        
            try {
                // Send the phone number and OTP to the backend for verification
                const response = await fetch(`${API_URL}/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, otp })
                });

                const data = await response.json();
            
                if (!response.ok) {
                    throw new Error(data.message || 'OTP verification failed.');
                }
            
                // --- AUTHENTICATION SUCCESS ---
                // The backend sent back a token. Save it! This is your login key.
                localStorage.setItem('authToken', data.token); 

                // Save the user object for display purposes
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                currentUser = data.user; // Also update the global variable
            
                // Clean up temporary data
                localStorage.removeItem('phoneForVerification');
                localStorage.removeItem('tempUserForSetup');
            
                // Continue the app flow based on the user's status from the server
                if (!data.user.isSetupComplete) {
                    showPermissions();
                } else {
                    showHome();
                }
            
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }

        async function resendOTP() {
        // Get the phone number the user is currently trying to verify
        const phone = localStorage.getItem('phoneForVerification');
            
        if (!phone) {
            alert('Error: Could not find your phone number. Please go back and try again.');
            return;
        }
    
        try {
            // Just like in handleLogin, call the /login endpoint again to trigger a new OTP
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend OTP.');
            }
        
            // Let the user know a new code is on its way
            alert('A new OTP has been sent to your phone.');
        
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

        // Permission handlers
        function requestLocationPermission() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        document.getElementById('locationBtn').textContent = 'Allowed';
                        document.getElementById('locationBtn').className = 'bg-green-500 text-white px-4 py-2 rounded-lg text-sm';
                        localStorage.setItem('locationPermission', 'granted');
                    },
                    function(error) {
                        alert('Location access denied. Please enable location in your browser settings.');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        }

        function requestNotificationPermission() {
            if ('Notification' in window) {
                Notification.requestPermission().then(function(permission) {
                    if (permission === 'granted') {
                        document.getElementById('notificationBtn').textContent = 'Allowed';
                        document.getElementById('notificationBtn').className = 'bg-green-500 text-white px-4 py-2 rounded-lg text-sm';
                        localStorage.setItem('notificationPermission', 'granted');
                        new Notification('Raksha', { body: 'Notifications enabled successfully!' });
                    } else {
                        alert('Notification permission denied. Please enable notifications in your browser settings.');
                    }
                });
            } else {
                alert('Notifications are not supported by this browser.');
            }
        }

        function requestStoragePermission() {
            // Storage is automatically available, just simulate the permission
            try {
                localStorage.setItem('storageTest', 'test');
                localStorage.removeItem('storageTest');
                document.getElementById('storageBtn').textContent = 'Allowed';
                document.getElementById('storageBtn').className = 'bg-green-500 text-white px-4 py-2 rounded-lg text-sm';
                localStorage.setItem('storagePermission', 'granted');
            } catch (e) {
                alert('Storage access denied. Please enable storage in your browser settings.');
            }
        }

        // Profile setup handlers
        function addHealthCondition() {
            const container = document.getElementById('healthConditions');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 mt-2';
            input.placeholder = 'Enter health condition';
            container.appendChild(input);
        }

        function handleProfileSetup(event) {
            event.preventDefault();

            const healthConditionInputs = document.querySelectorAll('#healthConditions input');
            const healthConditions = Array.from(healthConditionInputs)
                                          .map(input => input.value.trim())
                                          .filter(condition => condition); // Collects only non-empty conditions

            // Store the data in our global variable instead of localStorage
            profileSetupData = {
                bloodGroup: document.getElementById('bloodGroup').value,
                healthConditions: healthConditions,
                weight: document.getElementById('weight').value,
                height: document.getElementById('height').value,
                doctor: { // Your backend expects a 'doctor' object
                    name: document.getElementById('doctorName').value,
                    phone: document.getElementById('doctorPhone').value
                }
            };

            // Simply move to the next screen
            showCaretakerSetup();
        }

        function addAnotherCaretaker() {
            caretakerCount++;
            const container = document.getElementById('caretakersList');
            const caretakerDiv = document.createElement('div');
            caretakerDiv.className = 'caretaker-form border-2 border-dashed border-gray-300 rounded-xl p-4 mb-4';
            caretakerDiv.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-medium text-gray-700">Caretaker ${caretakerCount} (Optional)</h3>
                    <button type="button" onclick="removeCaretaker(this)" class="text-red-500 hover:text-red-700">✕</button>
                </div>
                <div class="space-y-3">
                    <input type="text" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Full Name">
                    <input type="tel" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Phone Number" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" oninput="validatePhoneInput(this)" onkeypress="return isNumber(event)">
                    <input type="email" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Email Address">
                </div>
            `;
            container.appendChild(caretakerDiv);
        }

        function removeCaretaker(button) {
            button.closest('.caretaker-form').remove();
            caretakerCount--;
        }

        async function handleAddCaretaker(event) {
            event.preventDefault();
                
            // 1. Get the JWT token from localStorage. This proves the user is logged in.
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Authentication error. Please log in again.');
                return showLogin();
            }
        
            // 2. Collect caretaker data from the form
            const caretakerForms = document.querySelectorAll('.caretaker-form');
            const caretakers = [];
            caretakerForms.forEach(form => {
                const inputs = form.querySelectorAll('input');
                const name = inputs[0].value.trim();
                const phone = inputs[1].value.trim();
                const email = inputs[2].value.trim();
                if (name && phone && email) {
                    caretakers.push({ name, phone, email });
                }
            });
        
            if (caretakers.length === 0) {
                alert('Please add at least one caretaker to continue.');
                return;
            }
        
            // 3. Combine all data for the API call
            const finalSetupData = {
                ...profileSetupData, // Data from the previous screen
                caretakers: caretakers // Data from this screen
            };
        
            try {
                // 4. Send the data to the protected backend endpoint
                const response = await fetch(`${API_URL}/complete-setup`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        // This Authorization header is CRITICAL for protected routes
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(finalSetupData)
                });
            
                const data = await response.json();
            
                if (!response.ok) {
                    throw new Error(data.message || 'Profile setup failed.');
                }
            
                // 5. Success! Update the local user data and go to the home screen
                alert(data.message); // e.g., "Profile setup complete!"

                // Update the stored user object with the complete data from the server
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                currentUser = data.user;
            
                showHome();
            
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }

        // Emergency functions
        function showEmergencyConfirm() {
            document.getElementById('emergencyModal').classList.remove('hidden');
        }

        function cancelEmergency() {
            document.getElementById('emergencyModal').classList.add('hidden');
        }

        function confirmEmergency() {
            document.getElementById('emergencyModal').classList.add('hidden');
            
            // Show emergency confirmation popup
            showEmergencyConfirmationPopup();
        }
        
        function showEmergencyConfirmationPopup() {
            const lang = translations[currentLanguage];
            
            // Get primary caretaker (first one in the list)
            const caretakers = JSON.parse(localStorage.getItem('caretakers') || '[]');
            const primaryCaretaker = caretakers[0];
            
            // Call primary caretaker if available
            if (primaryCaretaker && primaryCaretaker.phone) {
                // Attempt to make a phone call
                window.open(`tel:${primaryCaretaker.phone}`, '_blank');
            }
            
            const confirmationModal = `
                <div id="emergencyConfirmationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
                        <div class="text-6xl mb-4">🚨</div>
                        <h2 class="text-2xl font-bold text-green-600 mb-4">${lang.emergencyConfirmTitle}</h2>
                        
                        <div class="space-y-3 mb-6">
                            <div class="flex items-center justify-center text-green-600">
                                <span class="text-xl mr-2">✅</span>
                                <span>${lang.caretakersNotified}</span>
                            </div>
                            <div class="flex items-center justify-center text-green-600">
                                <span class="text-xl mr-2">✅</span>
                                <span>${lang.ambulanceCalled}</span>
                            </div>
                            <div class="flex items-center justify-center text-green-600">
                                <span class="text-xl mr-2">✅</span>
                                <span>${lang.locationShared}</span>
                            </div>
                            ${primaryCaretaker ? `
                            <div class="flex items-center justify-center text-blue-600">
                                <span class="text-xl mr-2">📞</span>
                                <span>${lang.calling} ${primaryCaretaker.name}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="text-lg font-semibold text-gray-800 mb-6">${lang.helpOnWay}</div>
                        
                        <button onclick="closeEmergencyConfirmationModal()" class="w-full bg-green-500 text-white py-4 rounded-2xl font-semibold hover:bg-green-600">
                            ${lang.ok}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', confirmationModal);
        }
        
        function closeEmergencyConfirmationModal() {
            const modal = document.getElementById('emergencyConfirmationModal');
            if (modal) {
                modal.remove();
            }
        }

        // Feature functions
        function showFeature(title, content) {
            hideAllScreens();
            document.getElementById('featureScreen').classList.remove('hidden');
            document.getElementById('featureTitle').textContent = title;
            document.getElementById('featureContent').innerHTML = content;
        }

        function showReminders() {
            const savedReminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            const savedCheckups = JSON.parse(localStorage.getItem('healthCheckups') || '[]');
            
            let medicineHTML = '';
            savedReminders.forEach((reminder, index) => {
                // Check if reminder should be reset based on frequency
                const shouldReset = checkIfShouldReset(reminder);
                if (shouldReset) {
                    reminder.taken = false;
                    reminder.takenTimes = [];
                }
                
                const statusClass = reminder.taken ? 'bg-green-50' : 'bg-yellow-50';
                const buttonClass = reminder.taken ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600';
                const buttonText = reminder.taken ? 'Taken' : 'Mark Taken';
                
                // Handle multiple checkboxes for "Twice Daily"
                let checkboxesHTML = '';
                if (reminder.frequency === 'Twice Daily') {
                    const takenTimes = reminder.takenTimes || [];
                    checkboxesHTML = `
                        <div class="flex gap-2 mt-1">
                            <label class="flex items-center text-xs">
                                <input type="checkbox" ${takenTimes.includes(0) ? 'checked' : ''} 
                                    onchange="toggleDoseTaken(${index}, 0)" class="mr-1">
                                Morning
                            </label>
                            <label class="flex items-center text-xs">
                                <input type="checkbox" ${takenTimes.includes(1) ? 'checked' : ''} 
                                    onchange="toggleDoseTaken(${index}, 1)" class="mr-1">
                                Evening
                            </label>
                        </div>
                    `;
                }
                
                const imageHTML = reminder.image ? 
                    `<button onclick="viewMedicineImage('${reminder.image}')" class="text-blue-500 hover:text-blue-700 text-xs ml-2">📷 View Photo</button>` : '';
                
                medicineHTML += `
                    <div class="flex justify-between items-center p-3 ${statusClass} rounded-xl mb-2">
                        <div class="flex-1">
                            <div class="font-medium">${reminder.name} ${imageHTML}</div>
                            <div class="text-sm text-gray-600">${reminder.time} • ${reminder.frequency}</div>
                            ${checkboxesHTML}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="markMedicineTaken(${index})" class="${buttonClass} text-white px-4 py-2 rounded-lg text-sm" ${reminder.taken ? 'disabled' : ''}>
                                ${buttonText}
                            </button>
                            <button onclick="deleteReminder(${index})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });
            
            let checkupHTML = '';
            savedCheckups.forEach((checkup, index) => {
                checkupHTML += `
                    <div class="p-3 bg-purple-50 rounded-xl mb-3">
                        <div class="font-medium">${checkup.name}</div>
                        <div class="text-sm text-gray-600">Due: ${checkup.date}</div>
                    </div>
                `;
            });
            
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg">Medicine Reminders</h3>
                            <button onclick="showAddMedicineForm()" class="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">+ Add</button>
                        </div>
                        <div class="space-y-3" id="medicineList">
                            ${medicineHTML || '<p class="text-gray-500 text-center py-4">No medicine reminders yet</p>'}
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg">Health Checkups</h3>
                            <button onclick="showAddCheckupForm()" class="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm">+ Add</button>
                        </div>
                        <div id="checkupList">
                            ${checkupHTML || '<p class="text-gray-500 text-center py-4">No checkup reminders yet</p>'}
                        </div>
                    </div>
                </div>
                
                <!-- Add Medicine Modal -->
                <div id="addMedicineModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Add Medicine Reminder</h3>
                        <form onsubmit="addMedicineReminder(event)" class="space-y-4">
                            <input type="text" id="medicineName" placeholder="Medicine Name" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="time" id="medicineTime" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <select id="medicineFrequency" class="w-full p-3 border border-gray-300 rounded-xl" required>
                                <option value="">Select Frequency</option>
                                <option value="Daily">Daily</option>
                                <option value="Twice Daily">Twice Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="As Needed">As Needed</option>
                            </select>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2 text-sm">Tablet Picture (Optional)</label>
                                <input type="file" id="medicineImage" accept="image/*" class="w-full p-3 border border-gray-300 rounded-xl text-sm">
                                <p class="text-xs text-gray-500 mt-1">Upload photo to easily identify the tablet</p>
                            </div>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Add</button>
                                <button type="button" onclick="closeAddMedicineModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Add Checkup Modal -->
                <div id="addCheckupModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Add Health Checkup</h3>
                        <form onsubmit="addHealthCheckup(event)" class="space-y-4">
                            <input type="text" id="checkupName" placeholder="Checkup Name" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="date" id="checkupDate" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="text" id="hospitalName" placeholder="Hospital Name (Optional)" class="w-full p-3 border border-gray-300 rounded-xl">
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-purple-500 text-white py-3 rounded-xl font-semibold">Add</button>
                                <button type="button" onclick="closeAddCheckupModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            showFeature('Reminders', content);
        }

        function showNearbyPlaces() {
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">🏥 Nearby Hospitals</h3>
                        <div class="space-y-3">
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">City General Hospital</div>
                                <div class="text-sm text-gray-600">2.3 km away • Emergency Available</div>
                                <div class="text-xs text-green-600">✅ Open 24/7</div>
                            </div>
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">Medicare Clinic</div>
                                <div class="text-sm text-gray-600">1.8 km away • General Practice</div>
                                <div class="text-xs text-green-600">✅ Open until 8 PM</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">💊 Medical Stores</h3>
                        <div class="space-y-3">
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">Apollo Pharmacy</div>
                                <div class="text-sm text-gray-600">0.8 km away</div>
                                <div class="text-xs text-green-600">✅ Open 24/7</div>
                            </div>
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">MedPlus</div>
                                <div class="text-sm text-gray-600">1.2 km away</div>
                                <div class="text-xs text-orange-600">⏰ Closes at 10 PM</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            showFeature('Nearby Places', content);
        }

        function showFindNurse() {
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Available Nurses</h3>
                        <div class="space-y-4">
                            <div class="p-4 border border-gray-200 rounded-xl">
                                <div class="flex items-center mb-3">
                                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-blue-600 font-bold">SM</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">Sarah Miller, RN</div>
                                        <div class="text-sm text-gray-600">5 years experience</div>
                                    </div>
                                </div>
                                <div class="text-sm text-gray-600 mb-3">Specializes in elderly care, medication management</div>
                                <div class="flex space-x-2">
                                    <button class="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm">Call Now</button>
                                    <button onclick="showNurseProfile('Sarah Miller', 'RN', '5 years experience', 'Specializes in elderly care, medication management, wound care, and mobility assistance. Available for home visits and long-term care arrangements.', '4.8', '127', '+91 98765 43210')" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">View Profile</button>
                                </div>
                            </div>
                            
                            <div class="p-4 border border-gray-200 rounded-xl">
                                <div class="flex items-center mb-3">
                                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-green-600 font-bold">RJ</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">Robert Johnson, RN</div>
                                        <div class="text-sm text-gray-600">8 years experience</div>
                                    </div>
                                </div>
                                <div class="text-sm text-gray-600 mb-3">Home care specialist, physical therapy support</div>
                                <div class="flex space-x-2">
                                    <button class="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm">Call Now</button>
                                    <button onclick="showNurseProfile('Robert Johnson', 'RN', '8 years experience', 'Home care specialist with expertise in physical therapy support, chronic disease management, and post-operative care. Certified in CPR and first aid.', '4.9', '203', '+91 87654 32109')" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">View Profile</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full btn-primary text-white py-4 rounded-2xl font-semibold">
                        Contact Hospital Staff
                    </button>
                </div>
            `;
            showFeature('Find Nurse', content);
        }

        function showHealthStatus() {
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            const bloodGroup = profileData.bloodGroup || 'Not Set';
            const healthConditions = profileData.healthConditions || [];
            const doctorName = profileData.doctorName || 'Not Set';
            const doctorPhone = profileData.doctorPhone || 'Not Set';
            
            let healthConditionsHTML = '';
            if (healthConditions.length > 0) {
                healthConditions.forEach((condition, index) => {
                    const cleanCondition = condition.replace(/\\n/g, '').trim();
                    if (cleanCondition) {
                        healthConditionsHTML += `
                            <div class="p-3 bg-blue-50 rounded-xl flex justify-between items-center">
                                <div>
                                    <div class="font-medium text-blue-800">${cleanCondition}</div>
                                    <div class="text-sm text-blue-600">Monitor regularly</div>
                                </div>
                                <button onclick="removeHealthCondition(${index})" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                            </div>
                        `;
                    }
                });
            } else {
                healthConditionsHTML = '<p class="text-gray-500 text-center py-4">No health conditions recorded</p>';
            }
            
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg">Health Overview</h3>
                            <button onclick="showAddHealthConditionModal()" class="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">+ Add</button>
                        </div>
                        <div class="space-y-3">
                            ${healthConditionsHTML}
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg">Blood Group</h3>
                            <button onclick="editBloodGroup()" class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                        </div>
                        <div class="text-2xl font-bold text-red-600">${bloodGroup}</div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg">Family Doctor</h3>
                            <button onclick="editDoctorInfo()" class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                        </div>
                        <div class="font-medium">${doctorName}</div>
                        <div class="text-sm text-gray-600">${doctorPhone}</div>
                    </div>
                </div>
                
                <!-- Add Health Condition Modal -->
                <div id="addHealthConditionModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Add Health Condition</h3>
                        <form onsubmit="addNewHealthCondition(event)" class="space-y-4">
                            <input type="text" id="newHealthCondition" placeholder="Enter health condition (e.g., Diabetes)" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Add</button>
                                <button type="button" onclick="closeAddHealthConditionModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            showFeature('Health Status', content);
        }

        function showCaretakers() {
            const savedCaretakers = JSON.parse(localStorage.getItem('caretakers') || '[]');
            
            let caretakersHTML = '';
            if (savedCaretakers.length > 0) {
                savedCaretakers.forEach((caretaker, index) => {
                    const isPrimary = index === 0;
                    const badgeClass = isPrimary ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
                    const badgeText = isPrimary ? 'Primary' : 'Secondary';
                    
                    caretakersHTML += `
                        <div class="p-4 border border-gray-200 rounded-xl">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-medium">${caretaker.name}</div>
                                <span class="text-xs ${badgeClass} px-2 py-1 rounded-full">${badgeText}</span>
                            </div>
                            <div class="text-sm text-gray-600">${caretaker.phone}</div>
                            <div class="text-sm text-gray-600">${caretaker.email}</div>
                            <div class="flex space-x-2 mt-3">
                                <button onclick="callCaretaker('${caretaker.phone}')" class="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm">Call</button>
                                <button onclick="messageCaretaker('${caretaker.phone}')" class="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm">Message</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                caretakersHTML = '<p class="text-gray-500 text-center py-8">No caretakers added yet</p>';
            }
            
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Linked Caretakers</h3>
                        <div class="space-y-4">
                            ${caretakersHTML}
                        </div>
                    </div>
                    
                    <button onclick="showAddCaretakerModal()" class="w-full btn-primary text-white py-4 rounded-2xl font-semibold">
                        + Add New Caretaker
                    </button>
                </div>
                
                <!-- Add Caretaker Modal -->
                <div id="addCaretakerModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Add New Caretaker</h3>
                        <form onsubmit="addNewCaretaker(event)" class="space-y-4">
                            <input type="text" id="newCaretakerName" placeholder="Full Name" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="tel" id="newCaretakerPhone" placeholder="Phone Number" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" oninput="validatePhoneInput(this)" onkeypress="return isNumber(event)" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="email" id="newCaretakerEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Add</button>
                                <button type="button" onclick="closeAddCaretakerModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            showFeature('Caretakers', content);
        }

        function showUploadRecords() {
            const savedDocuments = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
            
            let documentsHTML = '';
            if (savedDocuments.length > 0) {
                savedDocuments.forEach((doc, index) => {
                    const icon = doc.type === 'medical' ? '📄' : '🏥';
                    const displayName = doc.name || doc.fileName || 'Unnamed Document';
                    const fileName = doc.fileName ? `(${doc.fileName})` : '';
                    documentsHTML += `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div class="flex items-center">
                                <span class="text-2xl mr-3">${icon}</span>
                                <div>
                                    <div class="font-medium">${displayName}</div>
                                    <div class="text-xs text-gray-500">${fileName}</div>
                                    <div class="text-sm text-gray-600">Uploaded ${doc.date} • ${doc.size}</div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="viewDocument(${index})" class="text-blue-500 hover:text-blue-700 text-sm">View</button>
                                <button onclick="deleteDocument(${index})" class="text-red-500 hover:text-red-700 text-sm">Delete</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                documentsHTML = '<p class="text-gray-500 text-center py-4">No documents uploaded yet</p>';
            }
            
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Upload Documents</h3>
                        <div class="space-y-3">
                            <button onclick="showUploadModal('medical')" class="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50">
                                <div class="text-3xl mb-2 text-center">📄</div>
                                <div class="font-medium text-center">Upload Medical Reports</div>
                                <div class="text-sm text-gray-600 text-center">PDF, JPG, PNG files</div>
                            </button>
                            
                            <button onclick="showUploadModal('insurance')" class="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50">
                                <div class="text-3xl mb-2 text-center">🏥</div>
                                <div class="font-medium text-center">Upload Insurance Details</div>
                                <div class="text-sm text-gray-600 text-center">Insurance cards and policies</div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Uploaded Documents</h3>
                        <div class="space-y-3">
                            ${documentsHTML}
                        </div>
                    </div>
                </div>
                
                <!-- Upload Document Modal -->
                <div id="uploadDocumentModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Upload Document</h3>
                        <form onsubmit="handleDocumentUpload(event)" class="space-y-4">
                            <input type="text" id="documentName" placeholder="Document Name (e.g., Blood Test Report)" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="file" id="documentFile" accept=".pdf,.jpg,.jpeg,.png" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            <input type="hidden" id="documentType">
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Upload</button>
                                <button type="button" onclick="closeUploadModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            showFeature('Upload Records', content);
        }

        function showProfile() {
            const user = currentUser || JSON.parse(localStorage.getItem('registeredUser') || '{}');
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            
            const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
            const bloodGroup = profileData.bloodGroup || 'Not Set';
            const healthConditions = profileData.healthConditions || [];
            const doctorName = profileData.doctorName || 'Not Set';
            const doctorPhone = profileData.doctorPhone || 'Not Set';
            
            let healthConditionsHTML = '';
            if (healthConditions.length > 0) {
                healthConditions.forEach(condition => {
                    if (condition.trim()) {
                        healthConditionsHTML += `<div class="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded mb-1">${condition}</div>`;
                    }
                });
            } else {
                healthConditionsHTML = '<div class="text-sm text-gray-500">No conditions recorded</div>';
            }
            
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow text-center">
                        <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span class="text-white text-2xl font-bold">${initials}</span>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800">${user.name || 'User'}</h2>
                        <p class="text-gray-600">${user.age || 'N/A'} years old • ${user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A'}</p>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Contact Information</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Phone</span>
                                <span class="font-medium">${user.phone || 'Not Set'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Email</span>
                                <span class="font-medium">${user.email || 'Not Set'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Health Information</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Blood Group</span>
                                <span class="font-medium">${bloodGroup}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Health Conditions</span>
                                <div class="mt-2">
                                    ${healthConditionsHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Family Doctor</h3>
                        <div class="space-y-2">
                            <div class="font-medium">${doctorName}</div>
                            <div class="text-gray-600">${doctorPhone}</div>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="showEditProfile()" class="w-full btn-primary text-white py-4 rounded-2xl font-semibold">
                            Edit Profile
                        </button>
                        <button onclick="logout()" class="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold">
                            Logout
                        </button>
                    </div>
                </div>
            `;
            showFeature('Profile', content);
        }

        // Edit Profile Modal
        function showEditProfile() {
            const user = currentUser || JSON.parse(localStorage.getItem('registeredUser') || '{}');
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            
            const editProfileModal = `
                <div id="editProfileModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
                        <h3 class="text-xl font-bold mb-4">Edit Profile</h3>
                        <form onsubmit="saveProfileChanges(event)" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">Name</label>
                                    <input type="text" id="editName" value="${user.name || ''}" class="w-full p-3 border border-gray-300 rounded-xl text-sm" required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">Age</label>
                                    <input type="number" id="editAge" value="${user.age || ''}" class="w-full p-3 border border-gray-300 rounded-xl text-sm" min="1" max="120" required>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">Gender</label>
                                    <select id="editGender" class="w-full p-3 border border-gray-300 rounded-xl text-sm" required>
                                        <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Male</option>
                                        <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Female</option>
                                        <option value="other" ${user.gender === 'other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">Blood Group</label>
                                    <select id="editBloodGroup" class="w-full p-3 border border-gray-300 rounded-xl text-sm">
                                        <option value="">Select</option>
                                        <option value="A+" ${profileData.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
                                        <option value="A-" ${profileData.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
                                        <option value="B+" ${profileData.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
                                        <option value="B-" ${profileData.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
                                        <option value="AB+" ${profileData.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
                                        <option value="AB-" ${profileData.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
                                        <option value="O+" ${profileData.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
                                        <option value="O-" ${profileData.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 font-medium mb-2 text-sm">Phone Number</label>
                                <input type="tel" id="editPhone" value="${user.phone || ''}" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" oninput="validatePhoneInput(this)" onkeypress="return isNumber(event)" class="w-full p-3 border border-gray-300 rounded-xl text-sm" required>
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 font-medium mb-2 text-sm">Email (Optional)</label>
                                <input type="email" id="editEmail" value="${user.email || ''}" class="w-full p-3 border border-gray-300 rounded-xl text-sm">
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 font-medium mb-2 text-sm">Health Conditions</label>
                                <textarea id="editHealthConditions" rows="3" class="w-full p-3 border border-gray-300 rounded-xl text-sm" placeholder="Enter health conditions (one per line)">${(profileData.healthConditions || []).join('\\n')}</textarea>
                            </div>
                            
                            <div class="border-t pt-4">
                                <h4 class="font-medium text-gray-700 mb-3 text-sm">Family Doctor</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <input type="text" id="editDoctorName" value="${profileData.doctorName || ''}" placeholder="Doctor's Name" class="w-full p-3 border border-gray-300 rounded-xl text-sm">
                                    <input type="tel" id="editDoctorPhone" value="${profileData.doctorPhone || ''}" placeholder="Phone Number" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" oninput="validatePhoneInput(this)" onkeypress="return isNumber(event)" class="w-full p-3 border border-gray-300 rounded-xl text-sm">
                                </div>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Save Changes</button>
                                <button type="button" onclick="closeEditProfile()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', editProfileModal);
        }

        function closeEditProfile() {
            const modal = document.getElementById('editProfileModal');
            if (modal) {
                modal.remove();
            }
        }

        function saveProfileChanges(event) {
            event.preventDefault();
            
            // Update user data
            const updatedUser = {
                name: document.getElementById('editName').value,
                age: document.getElementById('editAge').value,
                gender: document.getElementById('editGender').value,
                phone: document.getElementById('editPhone').value,
                email: document.getElementById('editEmail').value
            };
            
            // Update profile data
            const healthConditionsText = document.getElementById('editHealthConditions').value;
            const healthConditions = healthConditionsText.split('\n').filter(condition => condition.trim() !== '');
            
            const updatedProfileData = {
                bloodGroup: document.getElementById('editBloodGroup').value,
                healthConditions: healthConditions,
                doctorName: document.getElementById('editDoctorName').value,
                doctorPhone: document.getElementById('editDoctorPhone').value
            };
            
            // Save to localStorage
            localStorage.setItem('registeredUser', JSON.stringify(updatedUser));
            localStorage.setItem('profileData', JSON.stringify(updatedProfileData));
            
            // Update current user
            currentUser = updatedUser;
            
            closeEditProfile();
            alert('✅ Profile updated successfully!');
            showProfile(); // Refresh the profile view
        }

        // Language system
        const translations = {
            EN: {
                // Welcome Screen
                welcomeTitle: "Raksha",
                welcomeSubtitle: "Your trusted elderly care companion",
                loginBtn: "Login",
                registerBtn: "Register",
                caretakerLoginBtn: "Login as Caretaker",
                
                // Login Screen
                loginTitle: "Login",
                phoneLabel: "Phone Number",
                phonePlaceholder: "+91 98765 43210",
                loginSubmitBtn: "Login",
                otpLoginBtn: "Login via OTP",
                
                // Register Screen
                registerTitle: "Register",
                nameLabel: "Full Name",
                ageLabel: "Age",
                genderLabel: "Gender",
                selectGender: "Select",
                male: "Male",
                female: "Female",
                other: "Other",
                registerSubmitBtn: "Register",
                
                // OTP Screen
                otpTitle: "Verify OTP",
                otpSubtitle: "Enter the 6-digit code sent to your phone",
                verifyBtn: "Verify OTP",
                resendBtn: "Resend OTP",
                
                // Permissions Screen
                permissionsTitle: "Allow Permissions",
                permissionsSubtitle: "We need these permissions to provide you the best care",
                location: "Location",
                notifications: "Notifications",
                storage: "Storage",
                allowBtn: "Allow",
                continueBtn: "Continue",
                
                // Profile Setup
                profileSetupTitle: "Profile Setup",
                bloodGroupLabel: "Blood Group",
                selectBloodGroup: "Select Blood Group",
                healthConditionsLabel: "Health Conditions",
                healthConditionPlaceholder: "Enter health condition",
                addConditionBtn: "+ Add another condition",
                familyDoctorLabel: "Family Doctor (Optional)",
                doctorNamePlaceholder: "Doctor's Name",
                doctorPhonePlaceholder: "Phone Number",
                
                // Caretaker Setup
                caretakerTitle: "Add Caretaker",
                caretakerSubtitle: "Add at least one caretaker for emergency contacts",
                caretakerRequired: "Caretaker 1 (Required)",
                caretakerOptional: "Caretaker",
                fullNamePlaceholder: "Full Name",
                emailPlaceholder: "Email Address",
                addAnotherCaretakerBtn: "+ Add Another Caretaker (Optional)",
                completeSetupBtn: "Complete Setup",
                
                // Home Screen
                homeTitle: "Raksha",
                homeSubtitle: "Your safety companion",
                helloUser: "Hello",
                stayMessage: "Stay safe and healthy",
                emergencyBtn: "EMERGENCY",
                emergencySubtext: "Tap for immediate help",
                
                // Feature buttons
                reminders: "Reminders",
                remindersSubtext: "Medicine & Checkups",
                nearby: "Nearby",
                nearbySubtext: "Hospitals & Stores",
                findNurse: "Find Nurse",
                findNurseSubtext: "Verified Nurses",
                healthStatus: "Health Status",
                healthStatusSubtext: "Your Health Info",
                caretakers: "Caretakers",
                caretakersSubtext: "Linked Contacts",
                records: "Records",
                recordsSubtext: "Upload Documents",
                
                // Emergency Modal
                emergencyAlertTitle: "Emergency Alert",
                emergencyAlertText: "This will immediately contact your caretakers and emergency services with your location.",
                yesCallHelp: "YES, CALL FOR HELP",
                cancel: "Cancel",
                emergencyConfirmTitle: "Emergency Alert Sent!",
                caretakersNotified: "Caretakers notified",
                ambulanceCalled: "Ambulance called",
                locationShared: "Location shared",
                helpOnWay: "Help is on the way!",
                ok: "OK",
                
                // Common buttons
                back: "← Back",
                edit: "Edit",
                add: "+ Add",
                save: "Save",
                delete: "Delete",
                view: "View",
                call: "Call",
                message: "Message",
                upload: "Upload",
                close: "Close",
                
                // Voice Assistant
                voiceAssistant: "Voice Assistant",
                voiceAssistantGreeting: "Hello! I'm your Raksha voice assistant. You can say:",
                voiceCallEmergency: "Call emergency",
                voiceShowMedicines: "Show my medicines",
                voiceFindHospital: "Find nearby hospital",
                voiceCheckHealth: "Check my health status",
                voiceDemo: "(This is a demo - voice recognition would be implemented here)",
                voiceDemoEmergency: "Demo: \"Call Emergency\"",
                
                // Messages
                setupComplete: "Setup completed successfully!",
                profileUpdated: "Profile updated successfully!",
                conditionAdded: "Health condition added successfully!",
                conditionRemoved: "Health condition removed successfully!",
                documentUploaded: "uploaded successfully!",
                languageChanged: "Language changed to",
                calling: "Calling",
                
                // Medicine Reminders
                medicineReminderTitle: "Medicine Reminder",
                timeToTake: "Time to take your medicine",
                taken: "Taken",
                snooze: "Snooze 5 min",
                dismiss: "Dismiss",
                medicineTakenSuccess: "Medicine marked as taken!",
                reminderSnoozed: "Reminder snoozed for 5 minutes",
                reminderAdded: "Medicine reminder added successfully!"
            },
            
            HI: {
                // Welcome Screen
                welcomeTitle: "रक्षा",
                welcomeSubtitle: "आपका विश्वसनीय बुजुर्ग देखभाल साथी",
                loginBtn: "लॉगिन",
                registerBtn: "पंजीकरण",
                caretakerLoginBtn: "देखभालकर्ता के रूप में लॉगिन",
                
                // Login Screen
                loginTitle: "लॉगिन",
                phoneLabel: "फोन नंबर",
                phonePlaceholder: "+91 98765 43210",
                loginSubmitBtn: "लॉगिन",
                otpLoginBtn: "OTP से लॉगिन",
                
                // Register Screen
                registerTitle: "पंजीकरण",
                nameLabel: "पूरा नाम",
                ageLabel: "उम्र",
                genderLabel: "लिंग",
                selectGender: "चुनें",
                male: "पुरुष",
                female: "महिला",
                other: "अन्य",
                registerSubmitBtn: "पंजीकरण",
                
                // OTP Screen
                otpTitle: "OTP सत्यापित करें",
                otpSubtitle: "अपने फोन पर भेजा गया 6-अंकीय कोड दर्ज करें",
                verifyBtn: "OTP सत्यापित करें",
                resendBtn: "OTP पुनः भेजें",
                
                // Permissions Screen
                permissionsTitle: "अनुमतियां दें",
                permissionsSubtitle: "आपको बेहतर देखभाल प्रदान करने के लिए हमें इन अनुमतियों की आवश्यकता है",
                location: "स्थान",
                notifications: "सूचनाएं",
                storage: "भंडारण",
                allowBtn: "अनुमति दें",
                continueBtn: "जारी रखें",
                
                // Profile Setup
                profileSetupTitle: "प्रोफाइल सेटअप",
                bloodGroupLabel: "रक्त समूह",
                selectBloodGroup: "रक्त समूह चुनें",
                healthConditionsLabel: "स्वास्थ्य स्थितियां",
                healthConditionPlaceholder: "स्वास्थ्य स्थिति दर्ज करें",
                addConditionBtn: "+ अन्य स्थिति जोड़ें",
                familyDoctorLabel: "पारिवारिक डॉक्टर (वैकल्पिक)",
                doctorNamePlaceholder: "डॉक्टर का नाम",
                doctorPhonePlaceholder: "फोन नंबर",
                
                // Caretaker Setup
                caretakerTitle: "देखभालकर्ता जोड़ें",
                caretakerSubtitle: "आपातकालीन संपर्क के लिए कम से कम एक देखभालकर्ता जोड़ें",
                caretakerRequired: "देखभालकर्ता 1 (आवश्यक)",
                caretakerOptional: "देखभालकर्ता",
                fullNamePlaceholder: "पूरा नाम",
                emailPlaceholder: "ईमेल पता",
                addAnotherCaretakerBtn: "+ अन्य देखभालकर्ता जोड़ें (वैकल्पिक)",
                completeSetupBtn: "सेटअप पूरा करें",
                
                // Home Screen
                homeTitle: "रक्षा",
                homeSubtitle: "आपका सुरक्षा साथी",
                helloUser: "नमस्ते",
                stayMessage: "सुरक्षित और स्वस्थ रहें",
                emergencyBtn: "आपातकाल",
                emergencySubtext: "तत्काल सहायता के लिए टैप करें",
                
                // Feature buttons
                reminders: "रिमाइंडर",
                remindersSubtext: "दवा और जांच",
                nearby: "नजदीकी",
                nearbySubtext: "अस्पताल और दुकानें",
                findNurse: "नर्स खोजें",
                findNurseSubtext: "सत्यापित नर्स",
                healthStatus: "स्वास्थ्य स्थिति",
                healthStatusSubtext: "आपकी स्वास्थ्य जानकारी",
                caretakers: "देखभालकर्ता",
                caretakersSubtext: "जुड़े संपर्क",
                records: "रिकॉर्ड",
                recordsSubtext: "दस्तावेज़ अपलोड करें",
                
                // Emergency Modal
                emergencyAlertTitle: "आपातकालीन अलर्ट",
                emergencyAlertText: "यह तुरंत आपके देखभालकर्ताओं और आपातकालीन सेवाओं को आपके स्थान के साथ संपर्क करेगा।",
                yesCallHelp: "हां, सहायता के लिए कॉल करें",
                cancel: "रद्द करें",
                emergencyConfirmTitle: "आपातकालीन अलर्ट भेजा गया!",
                caretakersNotified: "देखभालकर्ताओं को सूचित किया गया",
                ambulanceCalled: "एम्बुलेंस बुलाई गई",
                locationShared: "स्थान साझा किया गया",
                helpOnWay: "सहायता आ रही है!",
                ok: "ठीक है",
                
                // Common buttons
                back: "← वापस",
                edit: "संपादित करें",
                add: "+ जोड़ें",
                save: "सहेजें",
                delete: "हटाएं",
                view: "देखें",
                call: "कॉल करें",
                message: "संदेश",
                upload: "अपलोड करें",
                close: "बंद करें",
                
                // Voice Assistant
                voiceAssistant: "आवाज सहायक",
                voiceAssistantGreeting: "नमस्ते! मैं आपका रक्षा आवाज सहायक हूं। आप कह सकते हैं:",
                voiceCallEmergency: "आपातकाल कॉल करें",
                voiceShowMedicines: "मेरी दवाएं दिखाएं",
                voiceFindHospital: "नजदीकी अस्पताल खोजें",
                voiceCheckHealth: "मेरी स्वास्थ्य स्थिति जांचें",
                voiceDemo: "(यह एक डेमो है - आवाज पहचान यहां लागू की जाएगी)",
                voiceDemoEmergency: "डेमो: \"आपातकाल कॉल करें\"",
                
                // Messages
                setupComplete: "सेटअप सफलतापूर्वक पूरा हुआ!",
                profileUpdated: "प्रोफाइल सफलतापूर्वक अपडेट हुआ!",
                conditionAdded: "स्वास्थ्य स्थिति सफलतापूर्वक जोड़ी गई!",
                conditionRemoved: "स्वास्थ्य स्थिति सफलतापूर्वक हटाई गई!",
                documentUploaded: "सफलतापूर्वक अपलोड हुआ!",
                languageChanged: "भाषा बदली गई",
                calling: "कॉल कर रहे हैं",
                
                // Medicine Reminders
                medicineReminderTitle: "दवा रिमाइंडर",
                timeToTake: "दवा लेने का समय हो गया है",
                taken: "ले लिया",
                snooze: "5 मिनट बाद याद दिलाएं",
                dismiss: "बंद करें",
                medicineTakenSuccess: "दवा ली गई के रूप में चिह्नित!",
                reminderSnoozed: "रिमाइंडर 5 मिनट के लिए स्थगित",
                reminderAdded: "दवा रिमाइंडर सफलतापूर्वक जोड़ा गया!"
            },
            
            KN: {
                // Welcome Screen
                welcomeTitle: "ರಕ್ಷ",
                welcomeSubtitle: "ನಿಮ್ಮ ವಿಶ್ವಾಸಾರ್ಹ ವೃದ್ಧ ಆರೈಕೆ ಸಹಚರ",
                loginBtn: "ಲಾಗಿನ್",
                registerBtn: "ನೋಂದಣಿ",
                caretakerLoginBtn: "ಆರೈಕೆದಾರರಾಗಿ ಲಾಗಿನ್",
                
                // Login Screen
                loginTitle: "ಲಾಗಿನ್",
                phoneLabel: "ಫೋನ್ ಸಂಖ್ಯೆ",
                phonePlaceholder: "+91 98765 43210",
                loginSubmitBtn: "ಲಾಗಿನ್",
                otpLoginBtn: "OTP ಮೂಲಕ ಲಾಗಿನ್",
                
                // Register Screen
                registerTitle: "ನೋಂದಣಿ",
                nameLabel: "ಪೂರ್ಣ ಹೆಸರು",
                ageLabel: "ವಯಸ್ಸು",
                genderLabel: "ಲಿಂಗ",
                selectGender: "ಆಯ್ಕೆಮಾಡಿ",
                male: "ಪುರುಷ",
                female: "ಮಹಿಳೆ",
                other: "ಇತರೆ",
                registerSubmitBtn: "ನೋಂದಣಿ",
                
                // OTP Screen
                otpTitle: "OTP ಪರಿಶೀಲಿಸಿ",
                otpSubtitle: "ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಕಳುಹಿಸಲಾದ 6-ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ",
                verifyBtn: "OTP ಪರಿಶೀಲಿಸಿ",
                resendBtn: "OTP ಮರುಕಳುಹಿಸಿ",
                
                // Permissions Screen
                permissionsTitle: "ಅನುಮತಿಗಳನ್ನು ನೀಡಿ",
                permissionsSubtitle: "ನಿಮಗೆ ಉತ್ತಮ ಆರೈಕೆ ಒದಗಿಸಲು ನಮಗೆ ಈ ಅನುಮತಿಗಳ ಅಗತ್ಯವಿದೆ",
                location: "ಸ್ಥಳ",
                notifications: "ಅಧಿಸೂಚನೆಗಳು",
                storage: "ಸಂಗ್ರಹಣೆ",
                allowBtn: "ಅನುಮತಿಸಿ",
                continueBtn: "ಮುಂದುವರಿಸಿ",
                
                // Profile Setup
                profileSetupTitle: "ಪ್ರೊಫೈಲ್ ಸೆಟಪ್",
                bloodGroupLabel: "ರಕ್ತ ಗುಂಪು",
                selectBloodGroup: "ರಕ್ತ ಗುಂಪು ಆಯ್ಕೆಮಾಡಿ",
                healthConditionsLabel: "ಆರೋಗ್ಯ ಸ್ಥಿತಿಗಳು",
                healthConditionPlaceholder: "ಆರೋಗ್ಯ ಸ್ಥಿತಿ ನಮೂದಿಸಿ",
                addConditionBtn: "+ ಇನ್ನೊಂದು ಸ್ಥಿತಿ ಸೇರಿಸಿ",
                familyDoctorLabel: "ಕುಟುಂಬ ವೈದ್ಯರು (ಐಚ್ಛಿಕ)",
                doctorNamePlaceholder: "ವೈದ್ಯರ ಹೆಸರು",
                doctorPhonePlaceholder: "ಫೋನ್ ಸಂಖ್ಯೆ",
                
                // Caretaker Setup
                caretakerTitle: "ಆರೈಕೆದಾರರನ್ನು ಸೇರಿಸಿ",
                caretakerSubtitle: "ತುರ್ತು ಸಂಪರ್ಕಗಳಿಗಾಗಿ ಕನಿಷ್ಠ ಒಬ್ಬ ಆರೈಕೆದಾರರನ್ನು ಸೇರಿಸಿ",
                caretakerRequired: "ಆರೈಕೆದಾರ 1 (ಅಗತ್ಯ)",
                caretakerOptional: "ಆರೈಕೆದಾರ",
                fullNamePlaceholder: "ಪೂರ್ಣ ಹೆಸರು",
                emailPlaceholder: "ಇಮೇಲ್ ವಿಳಾಸ",
                addAnotherCaretakerBtn: "+ ಇನ್ನೊಬ್ಬ ಆರೈಕೆದಾರರನ್ನು ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)",
                completeSetupBtn: "ಸೆಟಪ್ ಪೂರ್ಣಗೊಳಿಸಿ",
                
                // Home Screen
                homeTitle: "ರಕ್ಷ",
                homeSubtitle: "ನಿಮ್ಮ ಸುರಕ್ಷತಾ ಸಹಚರ",
                helloUser: "ನಮಸ್ಕಾರ",
                stayMessage: "ಸುರಕ್ಷಿತವಾಗಿ ಮತ್ತು ಆರೋಗ್ಯವಾಗಿರಿ",
                emergencyBtn: "ತುರ್ತುಸ್ಥಿತಿ",
                emergencySubtext: "ತಕ್ಷಣದ ಸಹಾಯಕ್ಕಾಗಿ ಟ್ಯಾಪ್ ಮಾಡಿ",
                
                // Feature buttons
                reminders: "ಜ್ಞಾಪನೆಗಳು",
                remindersSubtext: "ಔಷಧ ಮತ್ತು ತಪಾಸಣೆಗಳು",
                nearby: "ಹತ್ತಿರದ",
                nearbySubtext: "ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಅಂಗಡಿಗಳು",
                findNurse: "ನರ್ಸ್ ಹುಡುಕಿ",
                findNurseSubtext: "ಪರಿಶೀಲಿತ ನರ್ಸ್‌ಗಳು",
                healthStatus: "ಆರೋಗ್ಯ ಸ್ಥಿತಿ",
                healthStatusSubtext: "ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿ",
                caretakers: "ಆರೈಕೆದಾರರು",
                caretakersSubtext: "ಸಂಪರ್ಕಿತ ಸಂಪರ್ಕಗಳು",
                records: "ದಾಖಲೆಗಳು",
                recordsSubtext: "ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
                
                // Emergency Modal
                emergencyAlertTitle: "ತುರ್ತು ಎಚ್ಚರಿಕೆ",
                emergencyAlertText: "ಇದು ತಕ್ಷಣವೇ ನಿಮ್ಮ ಆರೈಕೆದಾರರು ಮತ್ತು ತುರ್ತು ಸೇವೆಗಳನ್ನು ನಿಮ್ಮ ಸ್ಥಳದೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
                yesCallHelp: "ಹೌದು, ಸಹಾಯಕ್ಕಾಗಿ ಕರೆ ಮಾಡಿ",
                cancel: "ರದ್ದುಮಾಡಿ",
                emergencyConfirmTitle: "ತುರ್ತು ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ!",
                caretakersNotified: "ಆರೈಕೆದಾರರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ",
                ambulanceCalled: "ಆಂಬುಲೆನ್ಸ್ ಕರೆಯಲಾಗಿದೆ",
                locationShared: "ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಲಾಗಿದೆ",
                helpOnWay: "ಸಹಾಯ ಬರುತ್ತಿದೆ!",
                ok: "ಸರಿ",
                
                // Common buttons
                back: "← ಹಿಂದೆ",
                edit: "ಸಂಪಾದಿಸಿ",
                add: "+ ಸೇರಿಸಿ",
                save: "ಉಳಿಸಿ",
                delete: "ಅಳಿಸಿ",
                view: "ವೀಕ್ಷಿಸಿ",
                call: "ಕರೆ ಮಾಡಿ",
                message: "ಸಂದೇಶ",
                upload: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
                close: "ಮುಚ್ಚಿ",
                
                // Voice Assistant
                voiceAssistant: "ಧ್ವನಿ ಸಹಾಯಕ",
                voiceAssistantGreeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ರಕ್ಷ ಧ್ವನಿ ಸಹಾಯಕ. ನೀವು ಹೇಳಬಹುದು:",
                voiceCallEmergency: "ತುರ್ತುಸ್ಥಿತಿ ಕರೆ ಮಾಡಿ",
                voiceShowMedicines: "ನನ್ನ ಔಷಧಗಳನ್ನು ತೋರಿಸಿ",
                voiceFindHospital: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ",
                voiceCheckHealth: "ನನ್ನ ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ",
                voiceDemo: "(ಇದು ಡೆಮೊ - ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯನ್ನು ಇಲ್ಲಿ ಅಳವಡಿಸಲಾಗುವುದು)",
                voiceDemoEmergency: "ಡೆಮೊ: \"ತುರ್ತುಸ್ಥಿತಿ ಕರೆ ಮಾಡಿ\"",
                
                // Messages
                setupComplete: "ಸೆಟಪ್ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!",
                profileUpdated: "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
                conditionAdded: "ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!",
                conditionRemoved: "ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆದುಹಾಕಲಾಗಿದೆ!",
                documentUploaded: "ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ!",
                languageChanged: "ಭಾಷೆ ಬದಲಾಯಿಸಲಾಗಿದೆ",
                calling: "ಕರೆ ಮಾಡುತ್ತಿದ್ದೇವೆ",
                
                // Medicine Reminders
                medicineReminderTitle: "ಔಷಧ ಜ್ಞಾಪನೆ",
                timeToTake: "ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ ಬಂದಿದೆ",
                taken: "ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ",
                snooze: "5 ನಿಮಿಷ ನಂತರ ನೆನಪಿಸಿ",
                dismiss: "ಮುಚ್ಚಿ",
                medicineTakenSuccess: "ಔಷಧ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ!",
                reminderSnoozed: "ಜ್ಞಾಪನೆಯನ್ನು 5 ನಿಮಿಷಗಳಿಗೆ ಮುಂದೂಡಲಾಗಿದೆ",
                reminderAdded: "ಔಷಧ ಜ್ಞಾಪನೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!"
            }
        };

        let currentLanguage = 'EN';

        // Language dropdown functions
        function toggleLanguageDropdown() {
            const dropdown = document.getElementById('languageDropdown');
            dropdown.classList.toggle('hidden');
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function closeDropdown(event) {
                if (!event.target.closest('.relative')) {
                    dropdown.classList.add('hidden');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }

        function selectLanguage(code, name) {
            currentLanguage = code;
            document.getElementById('currentLanguage').textContent = code;
            document.getElementById('languageDropdown').classList.add('hidden');
            localStorage.setItem('selectedLanguage', JSON.stringify({code, name}));
            
            // Update all text on the page
            updatePageLanguage();
            
            showLanguageChangePopup(name);
        }

        function updatePageLanguage() {
            const lang = translations[currentLanguage];
            
            // Update all elements with data-translate attribute
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                if (lang[key]) {
                    if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'tel' || element.type === 'email')) {
                        element.placeholder = lang[key];
                    } else {
                        element.textContent = lang[key];
                    }
                }
            });
        }

        // Initialize language on page load
        function initializeLanguage() {
            const savedLanguage = localStorage.getItem('selectedLanguage');
            if (savedLanguage) {
                const langData = JSON.parse(savedLanguage);
                currentLanguage = langData.code;
                document.getElementById('currentLanguage').textContent = langData.code;
                updatePageLanguage();
            }
        }

        // Voice assistant function
        function toggleVoiceAssistant() {
            showVoiceAssistantModal();
        }
        
        function showVoiceAssistantModal() {
            const lang = translations[currentLanguage];
            const voiceModal = `
                <div id="voiceAssistantModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
                        <div class="text-6xl mb-4">🎤</div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">${lang.voiceAssistant}</h2>
                        <p class="text-gray-600 mb-6">${lang.voiceAssistantGreeting}</p>
                        
                        <div class="text-left bg-gray-50 rounded-xl p-4 mb-6">
                            <div class="text-sm text-gray-700 space-y-2">
                                <div>• "${lang.voiceCallEmergency}"</div>
                                <div>• "${lang.voiceShowMedicines}"</div>
                                <div>• "${lang.voiceFindHospital}"</div>
                                <div>• "${lang.voiceCheckHealth}"</div>
                            </div>
                        </div>
                        
                        <div class="text-xs text-gray-500 mb-6">${lang.voiceDemo}</div>
                        
                        <div class="space-y-3">
                            <button onclick="simulateVoiceCommand('emergency')" class="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600">
                                ${lang.voiceDemoEmergency}
                            </button>
                            <button onclick="closeVoiceAssistantModal()" class="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">
                                ${lang.close}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', voiceModal);
        }
        
        function closeVoiceAssistantModal() {
            const modal = document.getElementById('voiceAssistantModal');
            if (modal) {
                modal.remove();
            }
        }
        
        function simulateVoiceCommand(command) {
            closeVoiceAssistantModal();
            if (command === 'emergency') {
                showEmergencyConfirm();
            }
        }

        // Number validation for OTP and phone inputs
        function isNumber(event) {
            const charCode = event.which ? event.which : event.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                return false;
            }
            return true;
        }

        // Phone number validation function
        function validatePhoneInput(input) {
            // Remove any non-numeric characters
            let value = input.value.replace(/\D/g, '');
            
            // Limit to 10 digits
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            
            // Update the input value
            input.value = value;
            
            // Visual feedback based on length
            if (value.length === 10) {
                input.style.borderColor = '#10b981'; // Green border for valid
                input.style.backgroundColor = '#f0fdf4'; // Light green background
            } else if (value.length > 0) {
                input.style.borderColor = '#f59e0b'; // Orange border for incomplete
                input.style.backgroundColor = '#fffbeb'; // Light orange background
            } else {
                input.style.borderColor = '#d1d5db'; // Default gray border
                input.style.backgroundColor = '#ffffff'; // White background
            }
        }

        // Medicine reminder system with notifications
        let reminderCheckInterval = null;
        let activeReminderAudio = null;
        let activeReminders = new Map(); // Track active reminders that are repeating

        // Initialize reminder checking when app starts
        function initializeReminderSystem() {
            // Check for reminders every minute
            reminderCheckInterval = setInterval(checkMedicineReminders, 60000);
            // Also check immediately
            checkMedicineReminders();
        }

        function checkMedicineReminders() {
            const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            
            reminders.forEach((reminder, index) => {
                const reminderKey = `${index}-${reminder.time}`;
                
                if (reminder.time === currentTime && !reminder.taken && !reminder.snoozed && !reminder.dismissedToday) {
                    // Check if we should remind based on frequency
                    if (shouldRemindToday(reminder, now)) {
                        // Start repeating reminder if not already active
                        if (!activeReminders.has(reminderKey)) {
                            startRepeatingReminder(reminder, index, reminderKey);
                        }
                    }
                }
                
                // Stop repeating if reminder is taken or snoozed
                if ((reminder.taken || reminder.snoozed) && activeReminders.has(reminderKey)) {
                    stopRepeatingReminder(reminderKey);
                }
            });
            
            // Reset daily notifications at midnight
            if (currentTime === '00:00') {
                resetDailyNotifications();
            }
        }

        function startRepeatingReminder(reminder, index, reminderKey) {
            // Mark as active
            activeReminders.set(reminderKey, {
                reminder: reminder,
                index: index,
                intervalId: null,
                voiceIntervalId: null
            });
            
            // Show initial reminder
            triggerMedicineReminder(reminder, index);
            
            // Set up repeating every 2 minutes until action is taken
            const intervalId = setInterval(() => {
                const currentReminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
                const currentReminder = currentReminders[index];
                
                // Check if reminder still needs attention
                if (currentReminder && !currentReminder.taken && !currentReminder.snoozed && !currentReminder.dismissedToday) {
                    triggerMedicineReminder(currentReminder, index);
                } else {
                    // Stop repeating if taken or snoozed
                    stopRepeatingReminder(reminderKey);
                }
            }, 120000); // Repeat every 2 minutes
            
            // Set up continuous voice reminders every 30 seconds
            const voiceIntervalId = setInterval(() => {
                const currentReminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
                const currentReminder = currentReminders[index];
                
                // Check if reminder still needs attention
                if (currentReminder && !currentReminder.taken && !currentReminder.snoozed && !currentReminder.dismissedToday) {
                    // Play sound and voice announcement
                    playReminderSound();
                    speakReminder(currentReminder.name, translations[currentLanguage]);
                } else {
                    // Stop repeating if taken or snoozed
                    stopRepeatingReminder(reminderKey);
                }
            }, 30000); // Voice reminder every 30 seconds
            
            // Update the interval IDs
            const activeReminder = activeReminders.get(reminderKey);
            activeReminder.intervalId = intervalId;
            activeReminder.voiceIntervalId = voiceIntervalId;
        }

        function stopRepeatingReminder(reminderKey) {
            const activeReminder = activeReminders.get(reminderKey);
            if (activeReminder) {
                // Clear main reminder interval
                if (activeReminder.intervalId) {
                    clearInterval(activeReminder.intervalId);
                }
                // Clear voice reminder interval
                if (activeReminder.voiceIntervalId) {
                    clearInterval(activeReminder.voiceIntervalId);
                }
                // Stop any currently playing speech
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                activeReminders.delete(reminderKey);
            }
        }

        function shouldRemindToday(reminder, currentDate) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            switch (reminder.frequency) {
                case 'Daily':
                    return true;
                case 'Twice Daily':
                    return true; // Will have multiple time entries
                case 'Weekly':
                    return dayOfWeek === 1; // Monday
                case 'As Needed':
                    return false; // Don't auto-remind for as-needed medicines
                default:
                    return true;
            }
        }

        function triggerMedicineReminder(reminder, index) {
            const lang = translations[currentLanguage];
            
            // Play notification sound
            playReminderSound();
            
            // Speak the reminder
            speakReminder(reminder.name, lang);
            
            // Show visual notification
            showMedicineReminderModal(reminder, index);
            
            // Browser notification if permission granted
            if (Notification.permission === 'granted') {
                new Notification('💊 Medicine Reminder', {
                    body: `Time to take ${reminder.name}`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
                    requireInteraction: true
                });
            }
        }

        function playReminderSound() {
            // Create a pleasant reminder tone using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a sequence of tones for a pleasant reminder sound
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.8);
                }, index * 300);
            });
            
            // Store reference to stop if needed
            activeReminderAudio = audioContext;
        }

        function speakReminder(medicineName, lang) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance();
                
                // Set message based on language
                switch (currentLanguage) {
                    case 'HI':
                        utterance.text = `दवा लेने का समय हो गया है। कृपया ${medicineName} लें।`;
                        utterance.lang = 'hi-IN';
                        break;
                    case 'KN':
                        utterance.text = `ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ ಬಂದಿದೆ। ದಯವಿಟ್ಟು ${medicineName} ತೆಗೆದುಕೊಳ್ಳಿ।`;
                        utterance.lang = 'kn-IN';
                        break;
                    default:
                        utterance.text = `It's time to take your medicine. Please take ${medicineName}.`;
                        utterance.lang = 'en-US';
                }
                
                utterance.rate = 0.8;
                utterance.pitch = 1;
                utterance.volume = 0.8;
                
                speechSynthesis.speak(utterance);
            }
        }

        function showMedicineReminderModal(reminder, index) {
            const lang = translations[currentLanguage];
            
            const reminderModal = `
                <div id="medicineReminderModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center animate-bounce">
                        <div class="text-6xl mb-4 animate-pulse">💊</div>
                        <h2 class="text-2xl font-bold text-blue-600 mb-4">${lang.medicineReminderTitle || 'Medicine Reminder'}</h2>
                        <div class="bg-blue-50 rounded-xl p-4 mb-6">
                            <div class="text-lg font-semibold text-blue-800">${reminder.name}</div>
                            <div class="text-sm text-blue-600">${lang.timeToTake || 'Time to take your medicine'}</div>
                            <div class="text-xs text-gray-600 mt-2">${reminder.time} • ${reminder.frequency}</div>
                        </div>
                        
                        <div class="space-y-3">
                            <button onclick="markMedicineTakenFromReminder(${index})" class="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600">
                                ✅ ${lang.taken || 'Taken'}
                            </button>
                            <button onclick="snoozeReminder(${index})" class="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold hover:bg-orange-600">
                                ⏰ ${lang.snooze || 'Snooze 5 min'}
                            </button>
                            <button onclick="dismissReminder(${index})" class="w-full bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-300">
                                ${lang.dismiss || 'Dismiss'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', reminderModal);
            
            // Auto-dismiss after 2 minutes if no action taken
            setTimeout(() => {
                const modal = document.getElementById('medicineReminderModal');
                if (modal) {
                    modal.remove();
                }
            }, 120000);
        }

        function markMedicineTakenFromReminder(index) {
            const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            reminders[index].taken = true;
            reminders[index].takenTime = new Date().toLocaleTimeString();
            reminders[index].snoozed = false; // Clear snooze status
            localStorage.setItem('medicineReminders', JSON.stringify(reminders));
            
            // Stop any active repeating reminders for this medicine
            const reminderKey = `${index}-${reminders[index].time}`;
            stopRepeatingReminder(reminderKey);
            
            dismissReminder();
            
            // Show success message
            const lang = translations[currentLanguage];
            showSuccessToast(lang.medicineTakenSuccess || 'Medicine marked as taken!');
        }

        function snoozeReminder(index) {
            const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            reminders[index].snoozed = true;
            reminders[index].snoozeTime = Date.now();
            localStorage.setItem('medicineReminders', JSON.stringify(reminders));
            
            // Stop current repeating reminder
            const reminderKey = `${index}-${reminders[index].time}`;
            stopRepeatingReminder(reminderKey);
            
            dismissReminder();
            
            // Set a new reminder for 5 minutes later
            setTimeout(() => {
                const currentReminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
                const reminder = currentReminders[index];
                if (reminder && !reminder.taken) {
                    // Clear snooze status and start repeating again
                    reminder.snoozed = false;
                    currentReminders[index] = reminder;
                    localStorage.setItem('medicineReminders', JSON.stringify(currentReminders));
                    
                    // Start new repeating reminder
                    const newReminderKey = `${index}-${reminder.time}-snoozed-${Date.now()}`;
                    startRepeatingReminder(reminder, index, newReminderKey);
                }
            }, 5 * 60 * 1000); // 5 minutes
            
            const lang = translations[currentLanguage];
            showSuccessToast(lang.reminderSnoozed || 'Reminder snoozed for 5 minutes');
        }

        function dismissReminder(index = null) {
            const modal = document.getElementById('medicineReminderModal');
            if (modal) {
                modal.remove();
            }
            
            // Stop any playing audio
            if (activeReminderAudio) {
                activeReminderAudio.close();
                activeReminderAudio = null;
            }
            
            // If index is provided, this is a permanent dismiss (stops repeating)
            if (index !== null) {
                const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
                const reminder = reminders[index];
                if (reminder) {
                    const reminderKey = `${index}-${reminder.time}`;
                    stopRepeatingReminder(reminderKey);
                    
                    // Mark as dismissed for today (but don't mark as taken)
                    reminder.dismissedToday = true;
                    reminders[index] = reminder;
                    localStorage.setItem('medicineReminders', JSON.stringify(reminders));
                }
            }
        }

        function resetDailyNotifications() {
            const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            reminders.forEach(reminder => {
                reminder.notifiedToday = false;
                reminder.taken = false; // Reset taken status for daily reminders
                reminder.snoozed = false; // Reset snooze status
                reminder.dismissedToday = false; // Reset dismiss status
            });
            localStorage.setItem('medicineReminders', JSON.stringify(reminders));
            
            // Clear all active repeating reminders at midnight
            activeReminders.forEach((value, key) => {
                stopRepeatingReminder(key);
            });
        }

        function showSuccessToast(message) {
            const toast = `
                <div id="successToast" class="fixed top-4 right-4 bg-green-500 text-white rounded-xl shadow-lg p-4 z-50 max-w-sm">
                    <div class="flex items-center">
                        <span class="text-xl mr-3">✅</span>
                        <span>${message}</span>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', toast);
            
            setTimeout(() => {
                const toastElement = document.getElementById('successToast');
                if (toastElement) {
                    toastElement.remove();
                }
            }, 3000);
        }

        // Reminder management functions
        function showAddMedicineForm() {
            document.getElementById('addMedicineModal').classList.remove('hidden');
        }

        function closeAddMedicineModal() {
            document.getElementById('addMedicineModal').classList.add('hidden');
            document.getElementById('medicineName').value = '';
            document.getElementById('medicineTime').value = '';
            document.getElementById('medicineFrequency').value = '';
        }

        function addMedicineReminder(event) {
            event.preventDefault();
            const name = document.getElementById('medicineName').value;
            const time = document.getElementById('medicineTime').value;
            const frequency = document.getElementById('medicineFrequency').value;
            const imageFile = document.getElementById('medicineImage').files[0];
            
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    saveReminder(e.target.result);
                };
                reader.readAsDataURL(imageFile);
            } else {
                saveReminder(null);
            }
            
            function saveReminder(image) {
                const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
                reminders.push({ name, time, frequency, image, taken: false, notifiedToday: false, createdDate: new Date().toISOString() });
                localStorage.setItem('medicineReminders', JSON.stringify(reminders));
                closeAddMedicineModal();
                showReminders();
                const lang = translations[currentLanguage];
                showSuccessToast(lang.reminderAdded || 'Medicine reminder added successfully!');
            }
        }

        function markMedicineTaken(index) {
            const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            reminders[index].taken = true;
            reminders[index].takenTime = new Date().toLocaleTimeString();
            localStorage.setItem('medicineReminders', JSON.stringify(reminders));
            showReminders(); // Refresh the view
        }

        function showAddCheckupForm() {
            document.getElementById('addCheckupModal').classList.remove('hidden');
        }

        function closeAddCheckupModal() {
            document.getElementById('addCheckupModal').classList.add('hidden');
            document.getElementById('checkupName').value = '';
            document.getElementById('checkupDate').value = '';
        }

        function addHealthCheckup(event) {
            event.preventDefault();
            const name = document.getElementById('checkupName').value;
            const date = document.getElementById('checkupDate').value;
            const hospital = document.getElementById('hospitalName').value;
            
            const checkups = JSON.parse(localStorage.getItem('healthCheckups') || '[]');
            checkups.push({ name, date, hospital });
            localStorage.setItem('healthCheckups', JSON.stringify(checkups));
            
            closeAddCheckupModal();
            showReminders();
        }

        // Health condition management functions
        function showAddHealthConditionModal() {
            document.getElementById('addHealthConditionModal').classList.remove('hidden');
        }
        
        function closeAddHealthConditionModal() {
            document.getElementById('addHealthConditionModal').classList.add('hidden');
            document.getElementById('newHealthCondition').value = '';
        }
        
        function addNewHealthCondition(event) {
            event.preventDefault();
            const newCondition = document.getElementById('newHealthCondition').value.trim();
            
            if (!newCondition) return;
            
            // Get existing profile data
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            const healthConditions = profileData.healthConditions || [];
            
            // Add new condition if it doesn't already exist
            if (!healthConditions.includes(newCondition)) {
                healthConditions.push(newCondition);
                profileData.healthConditions = healthConditions;
                localStorage.setItem('profileData', JSON.stringify(profileData));
                
                closeAddHealthConditionModal();
                showHealthStatus(); // Refresh the view
                alert('✅ Health condition added successfully!');
            } else {
                alert('This health condition is already added!');
            }
        }
        
        function removeHealthCondition(index) {
            if (confirm('Are you sure you want to remove this health condition?')) {
                const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
                const healthConditions = profileData.healthConditions || [];
                
                healthConditions.splice(index, 1);
                profileData.healthConditions = healthConditions;
                localStorage.setItem('profileData', JSON.stringify(profileData));
                
                showHealthStatus(); // Refresh the view
                alert('✅ Health condition removed successfully!');
            }
        }
        
        function editBloodGroup() {
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            const currentBloodGroup = profileData.bloodGroup || '';
            
            const bloodGroupModal = `
                <div id="editBloodGroupModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Edit Blood Group</h3>
                        <form onsubmit="saveBloodGroup(event)" class="space-y-4">
                            <select id="newBloodGroup" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" required>
                                <option value="">Select Blood Group</option>
                                <option value="A+" ${currentBloodGroup === 'A+' ? 'selected' : ''}>A+</option>
                                <option value="A-" ${currentBloodGroup === 'A-' ? 'selected' : ''}>A-</option>
                                <option value="B+" ${currentBloodGroup === 'B+' ? 'selected' : ''}>B+</option>
                                <option value="B-" ${currentBloodGroup === 'B-' ? 'selected' : ''}>B-</option>
                                <option value="AB+" ${currentBloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
                                <option value="AB-" ${currentBloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
                                <option value="O+" ${currentBloodGroup === 'O+' ? 'selected' : ''}>O+</option>
                                <option value="O-" ${currentBloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                            </select>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Save</button>
                                <button type="button" onclick="closeBloodGroupModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', bloodGroupModal);
        }

        function closeBloodGroupModal() {
            const modal = document.getElementById('editBloodGroupModal');
            if (modal) {
                modal.remove();
            }
        }

        function saveBloodGroup(event) {
            event.preventDefault();
            const newBloodGroup = document.getElementById('newBloodGroup').value;
            
            if (!newBloodGroup) {
                alert('Please select a blood group');
                return;
            }
            
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            profileData.bloodGroup = newBloodGroup;
            localStorage.setItem('profileData', JSON.stringify(profileData));
            
            closeBloodGroupModal();
            showHealthStatus(); // Refresh the view
            alert('✅ Blood group updated successfully!');
        }
        
        function editDoctorInfo() {
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            const currentDoctorName = profileData.doctorName || '';
            const currentDoctorPhone = profileData.doctorPhone || '';
            
            const doctorInfoModal = `
                <div id="editDoctorInfoModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h3 class="text-xl font-bold mb-4">Edit Doctor Information</h3>
                        <form onsubmit="saveDoctorInfo(event)" class="space-y-4">
                            <input type="text" id="newDoctorName" value="${currentDoctorName}" placeholder="Doctor's Name" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" required>
                            <input type="tel" id="newDoctorPhone" value="${currentDoctorPhone}" placeholder="Phone Number" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" oninput="validatePhoneInput(this)" onkeypress="return isNumber(event)" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" required>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Save</button>
                                <button type="button" onclick="closeDoctorInfoModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', doctorInfoModal);
        }

        function closeDoctorInfoModal() {
            const modal = document.getElementById('editDoctorInfoModal');
            if (modal) {
                modal.remove();
            }
        }

        function saveDoctorInfo(event) {
            event.preventDefault();
            const newDoctorName = document.getElementById('newDoctorName').value;
            const newDoctorPhone = document.getElementById('newDoctorPhone').value;
            
            if (!newDoctorName || !newDoctorPhone) {
                alert('Please fill in both doctor name and phone number');
                return;
            }
            
            if (newDoctorPhone.length !== 10) {
                alert('Please enter a valid 10-digit phone number');
                return;
            }
            
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            profileData.doctorName = newDoctorName;
            profileData.doctorPhone = newDoctorPhone;
            localStorage.setItem('profileData', JSON.stringify(profileData));
            
            closeDoctorInfoModal();
            showHealthStatus(); // Refresh the view
            alert('✅ Doctor information updated successfully!');
        }
        
        function showAddCaretakerModal() {
            document.getElementById('addCaretakerModal').classList.remove('hidden');
        }
        
        function closeAddCaretakerModal() {
            document.getElementById('addCaretakerModal').classList.add('hidden');
            document.getElementById('newCaretakerName').value = '';
            document.getElementById('newCaretakerPhone').value = '';
            document.getElementById('newCaretakerEmail').value = '';
        }
        
        function addNewCaretaker(event) {
            event.preventDefault();
            const name = document.getElementById('newCaretakerName').value.trim();
            const phone = document.getElementById('newCaretakerPhone').value.trim();
            const email = document.getElementById('newCaretakerEmail').value.trim();
            
            // Validate phone number
            if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
                alert('Please enter a valid 10-digit phone number');
                return;
            }
            
            const caretakers = JSON.parse(localStorage.getItem('caretakers') || '[]');
            caretakers.push({ name, phone, email });
            localStorage.setItem('caretakers', JSON.stringify(caretakers));
            
            closeAddCaretakerModal();
            alert('✅ Caretaker added successfully!');
            showCaretakers(); // Refresh the view
        }
        
        function callCaretaker(phone) {
            window.open(`tel:${phone}`, '_blank');
        }
        
        function messageCaretaker(phone) {
            window.open(`sms:${phone}`, '_blank');
        }
        
        function handleFileUpload(event, type) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Simulate file upload
            const documents = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
            const newDoc = {
                name: file.name,
                type: type,
                date: new Date().toLocaleDateString(),
                size: (file.size / 1024).toFixed(1) + ' KB'
            };
            
            documents.push(newDoc);
            localStorage.setItem('uploadedDocuments', JSON.stringify(documents));
            
            alert(`✅ ${file.name} uploaded successfully!`);
            showUploadRecords(); // Refresh the view
        }
        
        function viewDocument(index) {
            const documents = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
            const doc = documents[index];
            alert(`📄 Document: ${doc.name}\n📅 Uploaded: ${doc.date}\n📊 Size: ${doc.size}\n\n(This is a demo - actual viewing would open the document)`);
        }
        
        function deleteDocument(index) {
            if (confirm('Are you sure you want to delete this document?')) {
                const documents = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
                documents.splice(index, 1);
                localStorage.setItem('uploadedDocuments', JSON.stringify(documents));
                showUploadRecords(); // Refresh the view
            }
        }

        // Enhanced OTP input navigation functions
        function handleOTPInput(current, index) {
            // Only allow single digit
            if (current.value.length > 1) {
                current.value = current.value.slice(0, 1);
            }
            
            // Move to next input if current has value and not last input
            if (current.value.length === 1 && index < 5) {
                const otpInputs = document.querySelectorAll('.otp-input');
                otpInputs[index + 1].focus();
            }
            
            // Check if all 6 digits are entered
            checkOTPComplete();
        }

        function handleOTPKeydown(current, index) {
            const otpInputs = document.querySelectorAll('.otp-input');
            
            // Handle backspace
            if (event.key === 'Backspace') {
                if (current.value === '' && index > 0) {
                    // Move to previous input if current is empty
                    otpInputs[index - 1].focus();
                } else {
                    // Clear current input
                    current.value = '';
                }
            }
            
            // Handle Enter key - verify OTP if all digits entered
            if (event.key === 'Enter') {
                event.preventDefault();
                let otp = '';
                otpInputs.forEach(input => otp += input.value);
                if (otp.length === 6) {
                    verifyOTP();
                } else {
                    alert('Please enter all 6 digits');
                }
            }
        }

        function checkOTPComplete() {
            const otpInputs = document.querySelectorAll('.otp-input');
            let otp = '';
            otpInputs.forEach(input => otp += input.value);
            
            // Auto-verify when 6 digits are entered
            if (otp.length === 6) {
                // Small delay to ensure last digit is processed
                setTimeout(() => {
                    verifyOTP();
                }, 100);
            }
        }

        // Logout function
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                // Clear all session-related data
                currentUser = null;
                localStorage.removeItem('authToken'); // This is the most important line
                localStorage.removeItem('currentUser');

                // Go back to the main welcome screen
                showWelcome();
            }
        }

        // Upload modal functions
        function showUploadModal(type) {
            document.getElementById('uploadDocumentModal').classList.remove('hidden');
            document.getElementById('documentType').value = type;
            document.getElementById('documentName').placeholder = type === 'medical' ? 
                'Document Name (e.g., Blood Test Report)' : 
                'Document Name (e.g., Health Insurance Card)';
        }

        function closeUploadModal() {
            document.getElementById('uploadDocumentModal').classList.add('hidden');
            document.getElementById('documentName').value = '';
            document.getElementById('documentFile').value = '';
        }

        function handleDocumentUpload(event) {
            event.preventDefault();
            const name = document.getElementById('documentName').value;
            const file = document.getElementById('documentFile').files[0];
            const type = document.getElementById('documentType').value;
            
            if (!file) {
                alert('Please select a file to upload');
                return;
            }
            
            // Simulate file upload
            const documents = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
            const newDoc = {
                name: name,
                fileName: file.name,
                type: type,
                date: new Date().toLocaleDateString(),
                size: (file.size / 1024).toFixed(1) + ' KB'
            };
            
            documents.push(newDoc);
            localStorage.setItem('uploadedDocuments', JSON.stringify(documents));
            
            closeUploadModal();
            alert(`✅ ${name} uploaded successfully!`);
            showUploadRecords(); // Refresh the view
        }

        // Nurse profile function
        function showNurseProfile(name, credentials, experience, description, rating, reviews, phone) {
            const nurseProfileModal = `
                <div id="nurseProfileModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span class="text-blue-600 text-2xl font-bold">${name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">${name}, ${credentials}</h3>
                            <p class="text-gray-600">${experience}</p>
                            <div class="flex items-center justify-center mt-2">
                                <span class="text-yellow-500 text-lg">⭐</span>
                                <span class="font-semibold ml-1">${rating}</span>
                                <span class="text-gray-500 ml-1">(${reviews} reviews)</span>
                            </div>
                        </div>
                        
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-800 mb-2">About</h4>
                            <p class="text-gray-600 text-sm">${description}</p>
                        </div>
                        
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-800 mb-2">Services</h4>
                            <div class="flex flex-wrap gap-2">
                                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Home Visits</span>
                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Medication Management</span>
                                <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Health Monitoring</span>
                                <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">Emergency Care</span>
                            </div>
                        </div>
                        
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-800 mb-2">Availability</h4>
                            <div class="text-sm text-gray-600">
                                <div class="flex justify-between">
                                    <span>Monday - Friday:</span>
                                    <span>8:00 AM - 6:00 PM</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Saturday:</span>
                                    <span>9:00 AM - 4:00 PM</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Emergency:</span>
                                    <span class="text-green-600">24/7 Available</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <button onclick="callCaretaker('${phone}')" class="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600">
                                📞 Call Now
                            </button>
                            <button onclick="messageCaretaker('${phone}')" class="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600">
                                💬 Send Message
                            </button>
                            <button onclick="closeNurseProfile()" class="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', nurseProfileModal);
        }

        function closeNurseProfile() {
            const modal = document.getElementById('nurseProfileModal');
            if (modal) {
                modal.remove();
            }
        }

        // Language change popup function
        function showLanguageChangePopup(languageName) {
            const lang = translations[currentLanguage];
            const popup = `
                <div id="languageChangePopup" class="fixed top-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 max-w-sm">
                    <div class="flex items-center">
                        <span class="text-2xl mr-3">🌐</span>
                        <div>
                            <div class="font-semibold text-gray-800">${lang.languageChanged}</div>
                            <div class="text-sm text-gray-600">${languageName}</div>
                        </div>
                        <button onclick="closeLanguagePopup()" class="ml-4 text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', popup);
            
            // Auto-close after 3 seconds
            setTimeout(() => {
                closeLanguagePopup();
            }, 3000);
        }

        function closeLanguagePopup() {
            const popup = document.getElementById('languageChangePopup');
            if (popup) {
                popup.remove();
            }
        }

        // NEW FUNCTIONALITY: Check if reminder should reset based on frequency
        function checkIfShouldReset(reminder) {
            if (!reminder.lastResetDate) {
                return false;
            }
            
            const lastReset = new Date(reminder.lastResetDate);
            const now = new Date();
            
            if (reminder.frequency === 'Daily' || reminder.frequency === 'Twice Daily') {
                // Reset daily at midnight
                return lastReset.toDateString() !== now.toDateString();
            } else if (reminder.frequency === 'Weekly') {
                // Reset weekly (check if 7 days have passed)
                const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
                return daysSinceReset >= 7;
            }
            
            return false;
        }
        
        // NEW FUNCTIONALITY: Handle twice daily dose tracking
        function toggleDoseTaken(index, doseNumber) {
            const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
            if (!reminders[index]) return;
            
            const reminder = reminders[index];
            reminder.takenTimes = reminder.takenTimes || [];
            
            const doseIndex = reminder.takenTimes.indexOf(doseNumber);
            if (doseIndex > -1) {
                reminder.takenTimes.splice(doseIndex, 1);
                reminder.taken = false;
            } else {
                reminder.takenTimes.push(doseNumber);
                // Mark as completely taken if both doses are checked
                if (reminder.takenTimes.length >= 2) {
                    reminder.taken = true;
                }
            }
            
            reminder.lastResetDate = new Date().toISOString();
            reminders[index] = reminder;
            localStorage.setItem('medicineReminders', JSON.stringify(reminders));
            showReminders(); // Refresh view
        }
        
        // NEW FUNCTIONALITY: Delete reminder
        function deleteReminder(index) {
            if (confirm('Are you sure you want to delete this reminder?')) {
                const reminders = JSON.parse(localStorage.getItem('medicineReminders') || '[]');
                reminders.splice(index, 1);
                localStorage.setItem('medicineReminders', JSON.stringify(reminders));
                showReminders(); // Refresh view
                showSuccessToast('Reminder deleted successfully!');
            }
        }
        
        // NEW FUNCTIONALITY: View medicine image
        function viewMedicineImage(imageData) {
            const imageModal = `
                <div id="medicineImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onclick="closeMedicineImageModal()">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-md">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold">Medicine Photo</h3>
                            <button onclick="closeMedicineImageModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <img src="${imageData}" alt="Medicine photo" class="w-full h-auto rounded-xl">
                        <button onclick="closeMedicineImageModal()" class="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', imageModal);
        }
        
        function closeMedicineImageModal() {
            const modal = document.getElementById('medicineImageModal');
            if (modal) {
                modal.remove();
            }
        }
        
        // UPDATED: Show profile with height and weight
        function showProfile() {
            // 1. Get the complete user object that was saved after login.
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                
            // If for some reason user data isn't found, handle it gracefully.
            if (!user || !user.name) {
                alert("Could not load user data. Please log in again.");
                return showLogin();
            }
        
            // 2. Extract data directly from the single 'user' object.
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            const bloodGroup = user.bloodGroup || 'Not Set';
            const healthConditions = user.healthConditions || [];
            const doctorName = user.doctor ? user.doctor.name : 'Not Set';
            const doctorPhone = user.doctor ? user.doctor.phone : 'Not Set';
            const weight = user.weight || 'Not Set'; // Assumes you add weight to the model
            const height = user.height || 'Not Set'; // Assumes you add height to the model
        
            let healthConditionsHTML = '';
            if (healthConditions.length > 0) {
                healthConditions.forEach(condition => {
                    if (condition.trim()) {
                        healthConditionsHTML += `<div class="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded mb-1">${condition}</div>`;
                    }
                });
            } else {
                healthConditionsHTML = '<div class="text-sm text-gray-500">No conditions recorded</div>';
            }
            
            // 3. Build the HTML content with the correct data.
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow text-center">
                        <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span class="text-white text-2xl font-bold">${initials}</span>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800">${user.name}</h2>
                        <p class="text-gray-600">${user.age} years old • ${user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</p>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Contact Information</h3>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Phone</span>
                            <span class="font-medium">${user.phone}</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Health Information</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Blood Group</span>
                                <span class="font-medium">${bloodGroup}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-600">Weight</span>
                                <span class="font-medium">${weight} ${weight !== 'Not Set' ? 'kg' : ''}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Height</span>
                                <span class="font-medium">${height} ${height !== 'Not Set' ? 'cm' : ''}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Health Conditions</span>
                                <div class="mt-2">${healthConditionsHTML}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">Family Doctor</h3>
                        <div class="font-medium">${doctorName}</div>
                        <div class="text-gray-600">${doctorPhone}</div>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="logout()" class="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold">
                            Logout
                        </button>
                    </div>
                </div>
            `;
            showFeature('Profile', content);
        }
        
        // UPDATED: Enhanced nearby places with booking functionality
        function showNearbyPlaces() {
            const content = `
                <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">🏥 Nearby Hospitals</h3>
                        <div class="space-y-3">
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">City General Hospital</div>
                                <div class="text-sm text-gray-600">2.3 km away • Emergency Available</div>
                                <div class="text-xs text-green-600 mb-2">✅ Open 24/7</div>
                                <button onclick="bookAppointment('City General Hospital', 'hospital')" class="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600">
                                    📅 Book Appointment
                                </button>
                            </div>
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">Medicare Clinic</div>
                                <div class="text-sm text-gray-600">1.8 km away • General Practice</div>
                                <div class="text-xs text-green-600 mb-2">✅ Open until 8 PM</div>
                                <button onclick="bookAppointment('Medicare Clinic', 'hospital')" class="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600">
                                    📅 Book Appointment
                                </button>
                            </div>
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">Apollo Hospitals</div>
                                <div class="text-sm text-gray-600">3.5 km away • Multi-specialty</div>
                                <div class="text-xs text-green-600 mb-2">✅ Open 24/7</div>
                                <button onclick="bookAppointment('Apollo Hospitals', 'hospital')" class="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600">
                                    📅 Book Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <h3 class="font-bold text-lg mb-4">💊 Medical Stores</h3>
                        <div class="space-y-3">
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">Apollo Pharmacy</div>
                                <div class="text-sm text-gray-600">0.8 km away</div>
                                <div class="text-xs text-green-600 mb-2">✅ Open 24/7</div>
                                <button onclick="bookAppointment('Apollo Pharmacy', 'pharmacy')" class="w-full bg-purple-500 text-white py-2 rounded-lg text-sm hover:bg-purple-600">
                                    📋 Request Visit
                                </button>
                            </div>
                            <div class="p-3 border border-gray-200 rounded-xl">
                                <div class="font-medium">MedPlus</div>
                                <div class="text-sm text-gray-600">1.2 km away</div>
                                <div class="text-xs text-orange-600 mb-2">⏰ Closes at 10 PM</div>
                                <button onclick="bookAppointment('MedPlus', 'pharmacy')" class="w-full bg-purple-500 text-white py-2 rounded-lg text-sm hover:bg-purple-600">
                                    📋 Request Visit
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl p-6 card-shadow">
                        <button onclick="searchHospitals()" class="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600">
                            🔍 Search More Hospitals
                        </button>
                    </div>
                </div>
            `;
            showFeature('Nearby Places', content);
        }
        
        // NEW FUNCTIONALITY: Book appointment
        function bookAppointment(facilityName, type) {
            const appointmentModal = `
                <div id="appointmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-md">
                        <h3 class="text-xl font-bold mb-4">Book Appointment</h3>
                        <div class="mb-4">
                            <div class="font-medium text-lg">${facilityName}</div>
                            <div class="text-sm text-gray-600">${type === 'hospital' ? '🏥 Hospital' : '💊 Medical Store'}</div>
                        </div>
                        
                        <form onsubmit="confirmAppointment(event, '${facilityName}', '${type}')" class="space-y-4">
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Patient Name</label>
                                <input type="text" id="patientName" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Phone Number</label>
                                <input type="tel" id="appointmentPhone" maxlength="10" pattern="[0-9]{10}" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Preferred Date</label>
                                <input type="date" id="appointmentDate" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Preferred Time</label>
                                <input type="time" id="appointmentTime" class="w-full p-3 border border-gray-300 rounded-xl" required>
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Reason for Visit (Optional)</label>
                                <textarea id="appointmentReason" rows="3" class="w-full p-3 border border-gray-300 rounded-xl" placeholder="Brief description of your concern"></textarea>
                            </div>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600">Confirm Booking</button>
                                <button type="button" onclick="closeAppointmentModal()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', appointmentModal);
            
            // Pre-fill with user data
            const user = currentUser || JSON.parse(localStorage.getItem('registeredUser') || '{}');
            if (user.name) document.getElementById('patientName').value = user.name;
            if (user.phone) document.getElementById('appointmentPhone').value = user.phone;
        }
        
        function closeAppointmentModal() {
            const modal = document.getElementById('appointmentModal');
            if (modal) {
                modal.remove();
            }
        }
        
        function confirmAppointment(event, facilityName, type) {
            event.preventDefault();
            
            const appointment = {
                facility: facilityName,
                type: type,
                patientName: document.getElementById('patientName').value,
                phone: document.getElementById('appointmentPhone').value,
                date: document.getElementById('appointmentDate').value,
                time: document.getElementById('appointmentTime').value,
                reason: document.getElementById('appointmentReason').value,
                bookedOn: new Date().toISOString()
            };
            
            // Save appointment
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            appointments.push(appointment);
            localStorage.setItem('appointments', JSON.stringify(appointments));
            
            closeAppointmentModal();
            
            // Show confirmation
            alert(`✅ Appointment Booked Successfully!\n\n📍 ${facilityName}\n📅 ${appointment.date} at ${appointment.time}\n\nYou will receive a confirmation call shortly.`);
            showSuccessToast('Appointment booked successfully!');
        }
        
        function searchHospitals() {
            const searchModal = `
                <div id="searchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-md">
                        <h3 class="text-xl font-bold mb-4">Search Hospitals</h3>
                        <input type="text" id="searchInput" placeholder="Search by name or location..." class="w-full p-3 border border-gray-300 rounded-xl mb-4" oninput="performHospitalSearch()">
                        <div id="searchResults" class="space-y-2 mb-4 max-h-64 overflow-y-auto">
                            <p class="text-gray-500 text-center py-4">Enter search term to find hospitals...</p>
                        </div>
                        <button onclick="closeSearchModal()" class="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">Close</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', searchModal);
        }
        
        function closeSearchModal() {
            const modal = document.getElementById('searchModal');
            if (modal) {
                modal.remove();
            }
        }
        
        function performHospitalSearch() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const resultsDiv = document.getElementById('searchResults');
            
            if (!searchTerm) {
                resultsDiv.innerHTML = '<p class="text-gray-500 text-center py-4">Enter search term to find hospitals...</p>';
                return;
            }
            
            // Demo search results
            const hospitals = [
                { name: 'City General Hospital', distance: '2.3 km', specialty: 'Emergency' },
                { name: 'Medicare Clinic', distance: '1.8 km', specialty: 'General Practice' },
                { name: 'Apollo Hospitals', distance: '3.5 km', specialty: 'Multi-specialty' },
                { name: 'Fortis Healthcare', distance: '4.2 km', specialty: 'Cardiology' },
                { name: 'Manipal Hospital', distance: '5.1 km', specialty: 'Orthopedics' },
                { name: 'Max Hospital', distance: '6.0 km', specialty: 'Neurology' }
            ];
            
            const filtered = hospitals.filter(h => 
                h.name.toLowerCase().includes(searchTerm) || 
                h.specialty.toLowerCase().includes(searchTerm)
            );
            
            if (filtered.length === 0) {
                resultsDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No hospitals found</p>';
                return;
            }
            
            let html = '';
            filtered.forEach(hospital => {
                html += `
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <div class="font-medium">${hospital.name}</div>
                        <div class="text-sm text-gray-600">${hospital.distance} • ${hospital.specialty}</div>
                        <button onclick="closeSearchModal(); bookAppointment('${hospital.name}', 'hospital')" class="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600">
                            Book Appointment
                        </button>
                    </div>
                `;
            });
            
            resultsDiv.innerHTML = html;
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            initializeLanguage();
            initializeReminderSystem();
            showWelcome();
        });


import { getFilteredInternships } from './filter.js';
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { app } from "./firebase-config.js";

// --- Main Web Component Logic ---

class PopupModal extends HTMLElement {
    constructor() {
        super();
        this.currentStep = 1;
        this.userId = null; 
        this.userData = {}; 
        this.style.display = 'none';
        this.internships = [];
        this.internshipsLoaded = false;
        this.defaultProfilePic = 'assets/default-pfp.png';
    }

    connectedCallback() {
        const popupContent = this.querySelector('.popup-content');
        const surveyWizard = this.querySelector('.survey-wizard');
        const filterTagsContainer = this.querySelector('.filter-tags');
        const searchBar = this.querySelector('.search-bar input');

        if (popupContent) {
            this.setupSidebar();
            this.setupThemeToggle();
            this.setupNavigation();
            this.setupLogout();
            this.setupDownloadLink(); // Add this call
        }

        this.loadInternships(); // Load data from Firestore
        this.setupSurveyWizard(surveyWizard, popupContent, filterTagsContainer);
        this.setupFiltering(searchBar, filterTagsContainer);
        this.setupVoiceSearch(searchBar);
        this.setupInlineEditing(filterTagsContainer);
        this.setupProfileEditing();
        this.setupProfilePictureUpload();

        this.addEventListener('click', (e) => {
            if (e.target === this) this.close();
        });
    }

    async loadInternships() {
        if (this.internshipsLoaded) return;
        console.log("Loading internships from Firestore...");
        try {
            const db = getFirestore(app);
            const internshipsCol = collection(db, 'internships');
            const internshipSnapshot = await getDocs(internshipsCol);
            const internshipsList = internshipSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.internships = internshipsList;
            this.internshipsLoaded = true;
            console.log("Internships loaded:", this.internships);
            this.updateFilteredView();
        } catch (error) {
            console.error("Error loading internships from Firestore:", error);
            const messageArea = this.querySelector('#internship-message-area');
            if(messageArea){
                messageArea.textContent = 'Could not load internships. Please check your connection and security rules.';
                messageArea.style.display = 'block';
            }
        }
    }

    async saveUserData() {
       console.log("Simulating save for user data:", this.userData);
    }
    
    updateFilteredView() {
        const activeSkillTags = this.querySelectorAll('.filter-tags .tag:not(.deselected)');
        const activeSkills = Array.from(activeSkillTags).map(tag => tag.textContent.trim());
        
        this.userData.skills = activeSkills.join(', ');

        const result = getFilteredInternships(this.internships, this.userData);
        const internshipListContainer = this.querySelector('.internship-list');
        const messageArea = this.querySelector('#internship-message-area');

        internshipListContainer.innerHTML = '';
        
        if (result.message) {
            messageArea.textContent = result.message;
            messageArea.style.display = 'block';
            internshipListContainer.style.display = 'none';
        } else if (!result.internships || result.internships.length === 0) {
            messageArea.textContent = 'No internships match the current filters.';
            messageArea.style.display = 'block';
            internshipListContainer.style.display = 'none';
        } else {
            messageArea.style.display = 'none';
            internshipListContainer.style.display = 'grid';
            result.internships.forEach(internship => {
                const card = this.createInternshipCard(internship);
                internshipListContainer.appendChild(card);
            });
        }
    }


    createInternshipCard(internship) {
        const card = document.createElement('div');
        card.classList.add('internship-card');
        card.dataset.internshipId = internship.id;
        
        const skillMatchPercentage = internship.skillMatchPercentage;

        const stipendHTML = internship.isPaid
            ? `<p><i class="fa-solid fa-indian-rupee-sign"></i> ${internship.stipend}</p>`
            : '<p><i class="fa-solid fa-leaf"></i> Unpaid</p>';

        const durationHTML = internship.commitment && internship.duration
            ? `<p><i class="fa-solid fa-clock"></i> ${internship.commitment} (${internship.duration} months)</p>`
            : '';

        card.innerHTML = `
            <div class="internship-details">
                <h4>${internship.title || 'N/A'}</h4>
                <p>${internship.company || 'N/A'}</p>
                <p><i class="fa-solid fa-location-dot"></i> ${internship.location || 'N/A'}</p>
                ${stipendHTML}
                ${durationHTML}
            </div>
            <div class="skill-match">
                <div class="progress-circle" style="--progress: ${skillMatchPercentage};"><span>${skillMatchPercentage}%</span></div>
                <p>skill match</p>
                <a href="${internship.url || '#'}" class="apply-btn" target="_blank">Apply</a>
            </div>
        `;
        return card;
    }


    setupSurveyWizard(surveyWizard, popupContent, filterTagsContainer) {
        const showStep = (stepNumber) => {
            this.querySelectorAll('.survey-step').forEach(step => step.classList.remove('active'));
            const nextStepElement = this.querySelector(`.survey-step[data-step="${stepNumber}"]`);
            if (nextStepElement) {
                nextStepElement.classList.add('active');
                this.currentStep = stepNumber;
            }
        };

        this.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => showStep(this.currentStep + 1));
        });

        this.querySelectorAll('.back-btn').forEach(button => {
            button.addEventListener('click', () => showStep(this.currentStep - 1));
        });

        const finishBtn = this.querySelector('.finish-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', async () => {
                this.collectSurveyData();
                await this.saveUserData();
                this.updateAllDisplays();
                this.populateFilterTags(this.userData.skills, filterTagsContainer);

                this.updateFilteredView();

                if (surveyWizard && popupContent) {
                    surveyWizard.style.display = 'none';
                    popupContent.style.display = 'flex';
                    this.showView('ai-match-view');
                }
            });
        }
    }

    setupProfileEditing() {
        const saveChangesBtn = this.querySelector('#profile-view .save-changes-btn');
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener('click', async () => {
                this.userData.name = document.getElementById('name-edit').value;
                this.userData.age = document.getElementById('age-edit').value;
                this.userData.gender = document.getElementById('gender-edit').value;
                this.userData.course = document.getElementById('study-edit').value;
                this.userData.stream = document.getElementById('stream-edit').value;
                this.userData.college = document.getElementById('college-edit').value;
                
                await this.saveUserData();
                this.updateAllDisplays();

                const notification = this.querySelector('#save-notification');
                if (notification) {
                    notification.style.display = 'block';
                    setTimeout(() => { notification.style.display = 'none'; }, 3000);
                }
            });
        }
    }

    setupProfilePictureUpload() {
        const changePicBtn = this.querySelector('.change-pic-btn');
        const imageUpload = this.querySelector('#image-upload');
        const editorProfilePic = this.querySelector('#editor-profile-pic');
        const sidebarProfilePic = this.querySelector('#sidebar-profile-pic');

        if (changePicBtn && imageUpload && editorProfilePic && sidebarProfilePic) {
            changePicBtn.addEventListener('click', () => imageUpload.click());

            imageUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imageUrl = e.target.result;
                        editorProfilePic.src = imageUrl;
                        sidebarProfilePic.src = imageUrl;
                        this.userData.profilePicture = imageUrl; 
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    setupInlineEditing(filterTagsContainer) {
        this.setupInlineEditView('skills', '#skills-display', '.skills-input-edit', async (newValue) => {
            this.userData.skills = newValue;
            await this.saveUserData();
            this.populateFilterTags(this.userData.skills, filterTagsContainer);
            this.updateFilteredView();
        });
        this.setupInlineEditView('language', '#language-display', '.language-input-edit', async (newValue) => { 
            this.userData.language = newValue; 
            await this.saveUserData();
        });
        this.setupInlineEditView('location', '#location-display', '.location-input-edit', async (newValue) => {
            this.userData.location = newValue;
            await this.saveUserData();
            document.getElementById('profile-location-text').textContent = newValue;
            this.updateFilteredView();
        });
    }

    collectSurveyData() {
        this.userData = {
            name: this.querySelector('#name-input').value,
            skills: this.querySelector('#skills-input').value,
            language: this.querySelector('#language-input').value,
            location: this.querySelector('#location-input').value,
            gender: this.querySelector('#gender-input').value,
            course: this.querySelector('#course-input').value,
            internshipType: this.querySelector('#internship-type-input').value,
        };
    }

    updateAllDisplays() {
        const data = this.userData;
        const profilePic = data.profilePicture || this.defaultProfilePic;

        // Update sidebar and profile view displays
        document.getElementById('profile-name').textContent = data.name || 'User Name';
        document.getElementById('profile-course').textContent = (data.course || 'Course').split(' (')[0];
        document.getElementById('profile-location-text').textContent = data.location || 'Location';
        document.getElementById('skills-display').textContent = data.skills || 'Your Skills';
        document.getElementById('language-display').textContent = data.language || 'Preferred Language';
        document.getElementById('location-display').textContent = data.location || 'Preferred Location';

        // Update profile edit form fields
        document.getElementById('name-edit').value = data.name || '';
        document.getElementById('age-edit').value = data.age || '';
        document.getElementById('gender-edit').value = data.gender || '';
        document.getElementById('study-edit').value = data.course || '';
        document.getElementById('stream-edit').value = data.stream || '';
        document.getElementById('college-edit').value = data.college || '';
        
        // Update profile pictures
        this.querySelector('#editor-profile-pic').src = profilePic;
        this.querySelector('#sidebar-profile-pic').src = profilePic;
    }

    setupSidebar() {
        const sidebarToggle = this.querySelector('#sidebar-toggle');
        const sidebar = this.querySelector(".sidebar");
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    setupThemeToggle() {
        const themeToggle = this.querySelector('#theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const icon = themeToggle.querySelector('i');
                const text = themeToggle.querySelector('span');
                if (document.body.classList.contains('dark-theme')) {
                    icon.classList.replace('fa-moon', 'fa-sun');
                    text.textContent = 'Light Mode';
                } else {
                    icon.classList.replace('fa-sun', 'fa-moon');
                    text.textContent = 'Dark Mode';
                }
            });
        }
    }

    setupNavigation() {
        const navLinks = this.querySelectorAll('.sidebar nav a');
        navLinks.forEach(link => {
            if (link.id === 'download-project-link') return; // Skip the download link
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.id.replace('-link', '-view');
                if(this.querySelector(`#${viewId}`)) {
                    this.showView(viewId);
                }
            });
        });
    }

    async setupDownloadLink() {
        const downloadLink = this.querySelector('#download-project-link');
        if (!downloadLink) return;

        const icon = downloadLink.querySelector('i');
        const span = downloadLink.querySelector('span');

        try {
            span.textContent = 'Preparing...';
            const storage = getStorage(app);
            const fileRef = ref(storage, 'Govt_hackathon_project.tar.gz');
            const downloadURL = await getDownloadURL(fileRef);

            downloadLink.href = downloadURL;
            downloadLink.setAttribute('download', 'Govt_hackathon_project.tar.gz');
            span.textContent = 'Download Project';
            
            // Re-enable the link
            downloadLink.style.pointerEvents = 'auto';
            downloadLink.style.opacity = '1';

        } catch (error) {
            console.error("Error getting download link:", error);
            span.textContent = 'Download Failed';
            icon.classList.remove('fa-download');
            icon.classList.add('fa-exclamation-triangle');
        }
    }


    setupLogout() {
        const logoutLink = this.querySelector('#logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.reset();
                this.close();
            });
        }
    }
    
    setupFiltering(searchBar, filterTagsContainer) {
        if (filterTagsContainer) {
            filterTagsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag')) {
                    e.target.classList.toggle('deselected');
                    this.updateFilteredView();
                }
            });
        }
        if (searchBar) {
            searchBar.addEventListener('input', () => this.updateFilteredView());
        }
    }
    
    setupVoiceSearch(searchBar) {
        const micIcon = this.querySelector('.search-bar .fa-microphone');
        if (!micIcon) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition is not supported by this browser.");
            micIcon.style.display = 'none';
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        let isListening = false;

        micIcon.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                return;
            }
            try {
                recognition.start();
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                alert(`Could not start voice search. Error: ${error.message}`);
            }
        });

        recognition.onstart = () => {
            isListening = true;
            micIcon.style.color = 'var(--primary-color)';
            micIcon.classList.add('fa-beat');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            searchBar.value = transcript;
            this.updateFilteredView();
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            let errorMessage = `An error occurred with voice search: ${event.error}.`;
            if (event.error === 'not-allowed') {
                errorMessage = "Microphone access was denied. Please allow it in your browser settings to use voice search.";
            } else if (event.error === 'no-speech') {
                // This is a common occurrence, so maybe don't alert for it.
            } else if (event.error === 'network') {
                errorMessage = "A network error occurred with the voice search service. Please check your connection.";
            }
            if (event.error !== 'no-speech') {
                alert(errorMessage);
            }
        };

        recognition.onend = () => {
            isListening = false;
            micIcon.style.color = '#888';
            micIcon.classList.remove('fa-beat');
        };
    }
    
    setupInlineEditView(viewName, displaySelector, inputSelector, onSave) {
        const view = this.querySelector(`#${viewName}-view`);
        if (!view) return;
        const displayMode = view.querySelector('.display-mode');
        const editMode = view.querySelector('.edit-mode');
        const editBtn = view.querySelector(`.${viewName}-edit-btn`);
        const saveBtn = view.querySelector(`.${viewName}-save-btn`);
        const input = view.querySelector(inputSelector);
        const displayP = view.querySelector(displaySelector);

        if(editBtn) editBtn.addEventListener('click', () => {
            if(input && displayP) input.value = displayP.textContent;
            if(displayMode) displayMode.style.display = 'none';
            if(editMode) editMode.style.display = 'block';
        });

        if(saveBtn) saveBtn.addEventListener('click', async () => {
            if(input && displayP) {
                const newValue = input.value;
                displayP.textContent = newValue;
                await onSave(newValue);
            }
            if(displayMode) displayMode.style.display = 'block';
            if(editMode) editMode.style.display = 'none';
        });
    }
    
    populateFilterTags(s, container) {
        if (container) {
             container.innerHTML = '';
            if(s){
                const skillArray = s.split(',').map(skill => skill.trim()).filter(Boolean);
                skillArray.forEach(skill => {
                    const tag = document.createElement('span');
                    tag.classList.add('tag');
                    tag.textContent = skill;
                    container.appendChild(tag);
                });
            }
        }
    }

    showView(viewId) {
        this.querySelectorAll('#ai-match-view, .info-view').forEach(view => view.style.display = 'none');
        const targetView = this.querySelector(`#${viewId}`);
        if (targetView) targetView.style.display = 'block';
        
        this.querySelectorAll('.sidebar nav a').forEach(link => link.classList.remove('active'));
        const activeLink = this.querySelector(`a[id='${viewId.replace('-view', '-link')}']`);
        if (activeLink) activeLink.classList.add('active');
    }

    open() {
        this.style.display = 'flex';
        this.reset();
    }

    close() {
        this.style.display = 'none';
    }
    
    reset() {
        // Clear internal data
        this.userData = {};

        // Reset UI elements
        const surveyWizard = this.querySelector('.survey-wizard');
        const popupContent = this.querySelector('.popup-content');
        const filterTagsContainer = this.querySelector('.filter-tags');

        // Reset all survey inputs
        this.querySelectorAll('.survey-wizard input[type="text"]').forEach(input => input.value = '');
        this.querySelectorAll('.survey-wizard select').forEach(select => select.selectedIndex = 0);

        // Clear filter tags
        this.populateFilterTags('', filterTagsContainer);

        // Clear all displays by calling updateAllDisplays with empty data
        this.updateAllDisplays();

        // Reset view to the initial survey screen
        this.querySelectorAll('.survey-step').forEach(s => s.classList.remove('active'));
        const step1 = this.querySelector('.survey-step[data-step="1"]');
        if (step1) step1.classList.add('active');
        this.currentStep = 1;

        if (surveyWizard && popupContent) {
            surveyWizard.style.display = 'block';
            popupContent.style.display = 'none';
        }

        // Update the filtered view which should show the default state
        this.updateFilteredView();
    }
}

customElements.define('popup-modal', PopupModal);

// Wait for the custom element to be defined before attaching the event listener
customElements.whenDefined('popup-modal').then(() => {
    const openBtn = document.getElementById('open-popup-btn');
    const popup = document.getElementById('recommendation-popup');

    if (openBtn && popup) {
        openBtn.addEventListener('click', () => popup.open());
    } else {
        console.error('Could not find the open button or the popup modal.');
    }
});

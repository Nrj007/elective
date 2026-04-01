document.addEventListener('DOMContentLoaded', () => {
    const courseSelect = document.getElementById('course');
    const electivesContainer = document.getElementById('electivesContainer');
    const registrationForm = document.getElementById('registrationForm');
    const messageBox = document.getElementById('message');

    // List of electives for each course
    const mscElectives = [
        "Data Science",
        "Artificial Intelligence"
    ];

    const mcaElectives = [
        "Cloud Computing",
        "Cyber Security",
        "Mobile App Development"
    ];

    courseSelect.addEventListener('change', () => {
        const selectedCourse = courseSelect.value;
        renderElectives(selectedCourse);
    });

    function renderElectives(course) {
        electivesContainer.innerHTML = '';
        const count = 2; // Always 2 dropdowns
        const electiveOptions = course === 'MSc' ? mscElectives : mcaElectives;

        for (let i = 1; i <= count; i++) {
            const group = document.createElement('div');
            group.className = 'form-group elective-group';

            const label = document.createElement('label');
            label.textContent = `Select Elective ${i}`;
            label.setAttribute('for', `elective${i}`);

            const select = document.createElement('select');
            select.id = `elective${i}`;
            select.name = `elective${i}`;
            select.required = true;

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = `-- Select Elective ${i} --`;
            select.appendChild(defaultOption);

            electiveOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });

            group.appendChild(label);
            group.appendChild(select);
            electivesContainer.appendChild(group);
        }
    }

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(registrationForm);
        const data = {};
        formData.forEach((value, key) => {
            if (key.startsWith('elective')) {
                if (!data.electives) data.electives = [];
                data.electives.push(value);
            } else {
                data[key] = value;
            }
        });

        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'SUBMITTING...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://elective-backend.vercel.app/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('Registration Successful!', 'success');
                registrationForm.reset();
                electivesContainer.innerHTML = '';
            } else {
                const errorMsg = result.error || 'Registration failed.';
                if (errorMsg === 'Student with this roll number is already registered.') {
                    alert(errorMsg);
                }
                showMessage(errorMsg, 'error');
            }
        } catch (error) {
            showMessage('Connection to server failed.', 'error');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
});

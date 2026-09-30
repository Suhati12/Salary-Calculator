/**
 * ============================================================================
 * Salary Calculator Web Application
 * Vanilla JavaScript Implementation for College Practical
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------------
    // 1. DOM Elements Selection
    // ------------------------------------------------------------------------
    const salaryForm = document.getElementById('salaryForm');
    const currencySelect = document.getElementById('currencySelect');
    const currencySymbols = document.querySelectorAll('.currency-symbol');

    // Input Fields
    const employeeNameInput = document.getElementById('employeeName');
    const basicSalaryInput = document.getElementById('basicSalary');
    const allowancesInput = document.getElementById('allowances');
    const deductionsInput = document.getElementById('deductions');

    // Error Message Elements
    const nameError = document.getElementById('nameError');
    const basicError = document.getElementById('basicError');
    const allowancesError = document.getElementById('allowancesError');
    const deductionsError = document.getElementById('deductionsError');

    // Action Buttons
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const printBtn = document.getElementById('printBtn');
    const saveHistoryBtn = document.getElementById('saveHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Result Display Container Elements
    const emptyState = document.getElementById('emptyState');
    const resultContent = document.getElementById('resultContent');
    const timestampSpan = document.getElementById('timestamp');

    // Result Data Outlets
    const resEmployeeName = document.getElementById('resEmployeeName');
    const resGrossSalary = document.getElementById('resGrossSalary');
    const resDeductions = document.getElementById('resDeductions');
    const resNetSalary = document.getElementById('resNetSalary');

    // Table Outlets
    const tblBasic = document.getElementById('tblBasic');
    const tblAllowances = document.getElementById('tblAllowances');
    const tblGross = document.getElementById('tblGross');
    const tblDeductions = document.getElementById('tblDeductions');
    const tblNet = document.getElementById('tblNet');

    // Visual Bar Outlets
    const barBasic = document.getElementById('barBasic');
    const barAllowances = document.getElementById('barAllowances');
    const barDeductions = document.getElementById('barDeductions');
    const takeHomePercent = document.getElementById('takeHomePercent');
    const basicPctSpan = document.getElementById('basicPct');
    const allowancePctSpan = document.getElementById('allowancePct');
    const deductionPctSpan = document.getElementById('deductionPct');

    // History Table Outlet
    const historyTableBody = document.getElementById('historyTableBody');

    // State Variables
    let currentCurrency = '₹';
    let lastCalculation = null;

    // ------------------------------------------------------------------------
    // 2. Initial Setup & Currency Event Handling
    // ------------------------------------------------------------------------
    updateCurrencySymbols(currencySelect.value);
    loadHistoryFromStorage();

    currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        updateCurrencySymbols(currentCurrency);
        if (lastCalculation) {
            displayResults(lastCalculation);
        }
    });

    function updateCurrencySymbols(symbol) {
        currentCurrency = symbol;
        currencySymbols.forEach(span => {
            span.textContent = symbol;
        });
    }

    // ------------------------------------------------------------------------
    // 3. Input Real-time Clearing of Validation Errors
    // ------------------------------------------------------------------------
    const inputFields = [
        { input: employeeNameInput, errorEl: nameError },
        { input: basicSalaryInput, errorEl: basicError },
        { input: allowancesInput, errorEl: allowancesError },
        { input: deductionsInput, errorEl: deductionsError }
    ];

    inputFields.forEach(({ input, errorEl }) => {
        input.addEventListener('input', () => {
            clearFieldError(input, errorEl);
        });
    });

    function clearFieldError(input, errorEl) {
        input.parentElement.classList.remove('has-error');
        if (input.classList) input.classList.remove('has-error');
        const formGroup = input.closest('.form-group');
        if (formGroup) formGroup.classList.remove('has-error');
        errorEl.textContent = '';
    }

    function setFieldError(input, errorEl, message) {
        const formGroup = input.closest('.form-group');
        if (formGroup) formGroup.classList.add('has-error');
        errorEl.textContent = message;
    }

    // ------------------------------------------------------------------------
    // 4. Input Validation Logic
    // ------------------------------------------------------------------------
    function validateInputs() {
        let isValid = true;

        // 1. Employee Name Validation
        const nameVal = employeeNameInput.value.trim();
        if (nameVal === '') {
            setFieldError(employeeNameInput, nameError, 'Employee name is required.');
            isValid = false;
        } else if (nameVal.length < 2) {
            setFieldError(employeeNameInput, nameError, 'Name must be at least 2 characters.');
            isValid = false;
        } else {
            clearFieldError(employeeNameInput, nameError);
        }

        // 2. Basic Salary Validation
        const basicRaw = basicSalaryInput.value.trim();
        const basicVal = parseFloat(basicRaw);
        if (basicRaw === '') {
            setFieldError(basicSalaryInput, basicError, 'Basic salary is required.');
            isValid = false;
        } else if (isNaN(basicVal)) {
            setFieldError(basicSalaryInput, basicError, 'Please enter a valid numeric salary.');
            isValid = false;
        } else if (basicVal < 0) {
            setFieldError(basicSalaryInput, basicError, 'Basic salary cannot be negative.');
            isValid = false;
        } else {
            clearFieldError(basicSalaryInput, basicError);
        }

        // 3. Allowances Validation
        const allowRaw = allowancesInput.value.trim();
        const allowVal = parseFloat(allowRaw);
        if (allowRaw === '') {
            setFieldError(allowancesInput, allowancesError, 'Allowances field is required. Enter 0 if none.');
            isValid = false;
        } else if (isNaN(allowVal)) {
            setFieldError(allowancesInput, allowancesError, 'Please enter a valid numeric allowance.');
            isValid = false;
        } else if (allowVal < 0) {
            setFieldError(allowancesInput, allowancesError, 'Allowances cannot be negative.');
            isValid = false;
        } else {
            clearFieldError(allowancesInput, allowancesError);
        }

        // 4. Deductions Validation
        const deductRaw = deductionsInput.value.trim();
        const deductVal = parseFloat(deductRaw);
        if (deductRaw === '') {
            setFieldError(deductionsInput, deductionsError, 'Deductions field is required. Enter 0 if none.');
            isValid = false;
        } else if (isNaN(deductVal)) {
            setFieldError(deductionsInput, deductionsError, 'Please enter a valid numeric deduction.');
            isValid = false;
        } else if (deductVal < 0) {
            setFieldError(deductionsInput, deductionsError, 'Deductions cannot be negative.');
            isValid = false;
        } else {
            clearFieldError(deductionsInput, deductionsError);
        }

        // 5. Cross-field check: Deductions vs Gross Salary
        if (isValid) {
            const gross = basicVal + allowVal;
            if (deductVal > gross) {
                setFieldError(deductionsInput, deductionsError, `Deductions (${currentCurrency}${deductVal.toFixed(2)}) cannot exceed Gross Salary (${currentCurrency}${gross.toFixed(2)}).`);
                isValid = false;
            }
        }

        return isValid;
    }

    // ------------------------------------------------------------------------
    // 5. Main Form Submit Event: Calculate Salary
    // ------------------------------------------------------------------------
    salaryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateInputs()) {
            return;
        }

        // Retrieve and parse clean inputs
        const name = employeeNameInput.value.trim();
        const basicSalary = parseFloat(basicSalaryInput.value.trim());
        const allowances = parseFloat(allowancesInput.value.trim());
        const deductions = parseFloat(deductionsInput.value.trim());

        // Business Logic Formulas
        const grossSalary = basicSalary + allowances;
        const netSalary = grossSalary - deductions;

        const timestamp = new Date().toLocaleString();

        lastCalculation = {
            id: Date.now(),
            name,
            basicSalary,
            allowances,
            grossSalary,
            deductions,
            netSalary,
            timestamp,
            currency: currentCurrency
        };

        displayResults(lastCalculation);
    });

    // ------------------------------------------------------------------------
    // 6. Display Results in UI
    // ------------------------------------------------------------------------
    function formatMoney(amount, currencySymbol = currentCurrency) {
        return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function displayResults(data) {
        // Toggle view from empty state to results
        emptyState.classList.add('hidden');
        resultContent.classList.remove('hidden');

        timestampSpan.textContent = `Calculated on ${data.timestamp}`;

        // Populate Employee Name & Metric Cards
        resEmployeeName.textContent = data.name;
        resGrossSalary.textContent = formatMoney(data.grossSalary, currentCurrency);
        resDeductions.textContent = formatMoney(data.deductions, currentCurrency);
        resNetSalary.textContent = formatMoney(data.netSalary, currentCurrency);

        // Detailed Table
        tblBasic.textContent = formatMoney(data.basicSalary, currentCurrency);
        tblAllowances.textContent = `+ ${formatMoney(data.allowances, currentCurrency)}`;
        tblGross.textContent = formatMoney(data.grossSalary, currentCurrency);
        tblDeductions.textContent = `- ${formatMoney(data.deductions, currentCurrency)}`;
        tblNet.textContent = formatMoney(data.netSalary, currentCurrency);

        // Calculate Visual Percentages
        const gross = data.grossSalary > 0 ? data.grossSalary : 1;
        const basicPct = Math.round((data.basicSalary / gross) * 100);
        const allowancePct = Math.round((data.allowances / gross) * 100);
        const deductionPct = Math.round((data.deductions / gross) * 100);
        const netTakeHomePct = Math.round((data.netSalary / gross) * 100);

        barBasic.style.width = `${basicPct}%`;
        barAllowances.style.width = `${allowancePct}%`;
        barDeductions.style.width = `${deductionPct}%`;

        basicPctSpan.textContent = `${basicPct}%`;
        allowancePctSpan.textContent = `${allowancePct}%`;
        deductionPctSpan.textContent = `${deductionPct}%`;
        takeHomePercent.textContent = `${netTakeHomePct}% Take-Home Net`;
    }

    // ------------------------------------------------------------------------
    // 7. Reset Event Listener
    // ------------------------------------------------------------------------
    resetBtn.addEventListener('click', () => {
        salaryForm.reset();
        
        // Clear errors
        inputFields.forEach(({ input, errorEl }) => {
            clearFieldError(input, errorEl);
        });

        // Hide results card, show empty state
        resultContent.classList.add('hidden');
        emptyState.classList.remove('hidden');
        lastCalculation = null;
    });

    // ------------------------------------------------------------------------
    // 8. Print Payslip Feature
    // ------------------------------------------------------------------------
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // ------------------------------------------------------------------------
    // 9. History / Local Storage Management
    // ------------------------------------------------------------------------
    saveHistoryBtn.addEventListener('click', () => {
        if (!lastCalculation) return;

        let history = getHistory();
        // Prevent duplicate immediate save
        if (history.length > 0 && history[0].id === lastCalculation.id) {
            alert('This calculation record is already saved in history.');
            return;
        }

        history.unshift(lastCalculation);
        // Limit history to 10 entries max
        if (history.length > 10) history.pop();

        saveHistory(history);
        renderHistoryTable();
        alert(`Record for "${lastCalculation.name}" saved successfully!`);
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all calculation history?')) {
            localStorage.removeItem('salary_calc_history');
            renderHistoryTable();
        }
    });

    function getHistory() {
        const stored = localStorage.getItem('salary_calc_history');
        return stored ? JSON.parse(stored) : [];
    }

    function saveHistory(historyArray) {
        localStorage.setItem('salary_calc_history', JSON.stringify(historyArray));
    }

    function loadHistoryFromStorage() {
        renderHistoryTable();
    }

    function renderHistoryTable() {
        const history = getHistory();
        historyTableBody.innerHTML = '';

        if (history.length === 0) {
            historyTableBody.innerHTML = `
                <tr class="empty-history-row">
                    <td colspan="9" class="text-center text-muted">No saved calculations yet.</td>
                </tr>
            `;
            return;
        }

        history.forEach((item, index) => {
            const tr = document.createElement('tr');
            const sym = item.currency || '₹';

            tr.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td>${escapeHtml(item.name)}</td>
                <td>${sym}${item.basicSalary.toFixed(2)}</td>
                <td>${sym}${item.allowances.toFixed(2)}</td>
                <td><strong>${sym}${item.grossSalary.toFixed(2)}</strong></td>
                <td class="negative">-${sym}${item.deductions.toFixed(2)}</td>
                <td class="net-amount"><strong>${sym}${item.netSalary.toFixed(2)}</strong></td>
                <td><small class="text-muted">${item.timestamp}</small></td>
                <td>
                    <button class="delete-record-btn" data-id="${item.id}" title="Delete Record">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;

            historyTableBody.appendChild(tr);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                deleteHistoryItem(id);
            });
        });
    }

    function deleteHistoryItem(id) {
        let history = getHistory();
        history = history.filter(item => item.id !== id);
        saveHistory(history);
        renderHistoryTable();
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});

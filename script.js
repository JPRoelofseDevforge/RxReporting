// RxReporting Platform - Main JavaScript
class RxReportingApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.charts = {};


        this.initializeElements();
        this.bindEvents();
        this.updateDataSourceDisplay(); // Initialize the display state
        this.loadStoredData();
    }

    initializeElements() {
        // DOM Elements
        this.uploadSection = document.getElementById('uploadSection');
        this.dashboardSection = document.getElementById('dashboardSection');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadBtnMain = document.getElementById('uploadBtnMain');
        this.loadSampleBtn = document.getElementById('loadSampleBtn');
        this.uploadOption = document.getElementById('uploadOption');
        this.sampleOption = document.getElementById('sampleOption');
        this.fileInfo = document.getElementById('fileInfo');

        // Summary cards - with null checks
        this.totalMembers = document.getElementById('totalMembers');
        this.totalProtocols = document.getElementById('totalProtocols');
        this.highRiskCases = document.getElementById('highRiskCases');
        // Note: lastUpdated element was removed from HTML, so we don't initialize it here

        // Charts - with null checks and logging
        console.log('DEBUG: Checking canvas elements...');

        // Helper function to safely get canvas context
        const getCanvasContext = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`DEBUG: Canvas element '${id}' not found in DOM`);
                return null;
            }
            console.log(`DEBUG: Canvas element '${id}' found, getting context...`);
            try {
                return element.getContext('2d');
            } catch (error) {
                console.error(`DEBUG: Error getting context for '${id}':`, error);
                return null;
            }
        };

        this.diseaseChart = getCanvasContext('diseaseChart');
        this.riskChart = getCanvasContext('riskChart');
        this.peoplePerConditionChart = getCanvasContext('peoplePerConditionChart');
        this.riskBreakdownChart = getCanvasContext('riskBreakdownChart');
        this.calculationTypeChart = getCanvasContext('calculationTypeChart');
        this.calculationTypePerDiseaseChart = getCanvasContext('calculationTypePerDiseaseChart');
        this.recordsOverTimeChart = getCanvasContext('recordsOverTimeChart');
        this.commonCalcTypesChart = getCanvasContext('commonCalcTypesChart');
        this.diseaseCooccurrenceChart = getCanvasContext('diseaseCooccurrenceChart');
        this.riskByCalcTypeChart = getCanvasContext('riskByCalcTypeChart');
        this.protocolUsageChart = getCanvasContext('protocolUsageChart');
        this.highRiskAnalysisChart = getCanvasContext('highRiskAnalysisChart');
        this.dataEntryPatternsChart = getCanvasContext('dataEntryPatternsChart');
        this.riskTrendChart = getCanvasContext('riskTrendChart');
        this.calcMethodEffectivenessChart = getCanvasContext('calcMethodEffectivenessChart');
        this.diseaseSeverityChart = getCanvasContext('diseaseSeverityChart');
        this.riskPerProtocolChart = getCanvasContext('riskPerProtocolChart');

        console.log('DEBUG: Canvas element initialization complete');

        // Data table
        this.dataTableBody = document.getElementById('dataTableBody');
        this.searchInput = document.getElementById('searchInput');
        this.filterDisease = document.getElementById('filterDisease');
        this.filterRisk = document.getElementById('filterRisk');

        // Pagination
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.pageInfo = document.getElementById('pageInfo');

        // Modal
        this.drillDownModal = document.getElementById('drillDownModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.closeModal = document.getElementById('closeModal');
    }

    bindEvents() {
        // File upload events - only bind if elements exist
        if (this.uploadBtn) this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        if (this.uploadBtnMain) this.uploadBtnMain.addEventListener('click', () => this.fileInput.click());
        if (this.fileInput) this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Sample data events
        if (this.loadSampleBtn) this.loadSampleBtn.addEventListener('click', () => this.loadSampleData());

        // Data source selection events
        if (this.uploadOption) this.uploadOption.addEventListener('change', () => this.updateDataSourceDisplay());
        if (this.sampleOption) this.sampleOption.addEventListener('change', () => this.updateDataSourceDisplay());

        // Chart type changes - only bind for existing chart types
        const chartTypeElements = [
            'diseaseChartType', 'riskChartType', 'peoplePerConditionChartType', 'riskBreakdownChartType',
            'calculationTypeChartType', 'calculationTypePerDiseaseChartType', 'recordsOverTimeChartType',
            'commonCalcTypesChartType', 'diseaseCooccurrenceChartType', 'riskByCalcTypeChartType',
            'protocolUsageChartType', 'highRiskAnalysisChartType', 'dataEntryPatternsChartType',
            'riskTrendChartType', 'calcMethodEffectivenessChartType', 'diseaseSeverityChartType',
            'riskPerProtocolChartType'
        ];

        chartTypeElements.forEach(chartTypeId => {
            const element = document.getElementById(chartTypeId);
            if (element) {
                element.addEventListener('change', (e) => {
                    const methodName = `update${chartTypeId.replace('ChartType', 'Chart')}`;
                    if (this[methodName]) {
                        this[methodName](e.target.value);
                    }
                });
            }
        });

        // Search and filter events
        this.searchInput.addEventListener('input', () => this.applyFilters());
        this.filterDisease.addEventListener('change', () => this.applyFilters());
        this.filterRisk.addEventListener('change', () => this.applyFilters());

        // Pagination events
        this.prevPageBtn.addEventListener('click', () => this.changePage(-1));
        this.nextPageBtn.addEventListener('click', () => this.changePage(1));

        // Modal events
        this.closeModal.addEventListener('click', () => this.hideModal());

        // Close modal when clicking outside
        this.drillDownModal.addEventListener('click', (e) => {
            if (e.target === this.drillDownModal) {
                this.hideModal();
            }
        });

        // Fullscreen modal events
        const fullscreenModal = document.getElementById('fullscreenModal');
        fullscreenModal.addEventListener('click', (e) => {
            if (e.target === fullscreenModal) {
                this.toggleFullscreen('');
            }
        });

        // Close fullscreen on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullscreenModal.style.display === 'flex') {
                this.toggleFullscreen('');
            }
        });

        // Chart right-click functionality
        this.initializeChartContextMenus();
    }

    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Validate all files
        const invalidFiles = files.filter(file => !file.name.match(/\.(xlsx|xls|json)$/));
        if (invalidFiles.length > 0) {
            alert('Please select only Excel files (.xlsx or .xls) or JSON files (.json)');
            return;
        }

        try {
            this.showLoading(`Processing ${files.length} file${files.length > 1 ? 's' : ''}...`);

            // Process main data file
            if (files.length > 0) {
                // Only process the first main data file (in case multiple are selected)
                const mainFile = files[0];
                const data = await this.parseExcelFile(mainFile);
                this.data = data;
                this.saveDataToStorage();
                this.initializeDashboard();
            }

            this.hideLoading();

            // Show success message
            if (files.length === 1) {
                this.showSuccessMessage(`Successfully processed ${files[0].name}`);
            } else {
                this.showSuccessMessage(`Successfully processed ${files.length} files`);
            }

        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files. Please check the file formats and try again.');
            this.hideLoading();
        }
    }

    async loadSampleData() {
        try {
            this.showLoading('Loading sample data...');

            // Load the sample data from Azure blob storage
            const response = await fetch('https://samapiimages.blob.core.windows.net/sam/jsonfile.json');
            if (!response.ok) {
                throw new Error('Failed to load sample data');
            }

            const sampleData = await response.json();
            this.data = this.processSampleData(sampleData);
            this.saveDataToStorage();
            this.initializeDashboard();

            this.hideLoading();
            this.showSuccessMessage('Successfully loaded sample data');

        } catch (error) {
            console.error('Error loading sample data:', error);
            alert('Error loading sample data. Please try again.');
            this.hideLoading();
        }
    }

    processSampleData(sampleData) {
        return sampleData.map(row => {
            // Map the sample data fields to the expected format
            const processedRow = {
                MemberNumber: row.MemberNumber,
                DependentCode: row.DependantCode,
                DiseaseProtocolName: row.DiseaseProtocolName,
                RiskRatingName: row.RiskRatingName,
                RiskCalculationTypeName: row.RiskCalculationTypeName,
                DateCalculated: row.DateCalculated,
                MemberDependant: row.MemberDependant
            };

            // All sample data is considered active
            processedRow.isActive = true;
            processedRow.activeStatusReason = 'Sample data loaded';
            processedRow.activeStatusSource = 'sample_data';

            return processedRow;
        });
    }

    updateDataSourceDisplay() {
        const actionButtons = document.querySelector('.action-buttons');
        const fileInfo = document.getElementById('fileInfo');

        if (this.uploadOption.checked) {
            // Show upload button, hide sample button
            document.getElementById('uploadBtnMain').style.display = 'inline-block';
            document.getElementById('loadSampleBtn').style.display = 'none';
            fileInfo.innerHTML = '<small><em>Select multiple files at once if needed</em></small>';
        } else {
            // Show sample button, hide upload button
            document.getElementById('uploadBtnMain').style.display = 'none';
            document.getElementById('loadSampleBtn').style.display = 'inline-block';
            fileInfo.innerHTML = '<small><em>Sample data contains diabetes risk calculation records</em></small>';
        }
    }



    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // Convert to objects with proper headers
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1);

                    const data = rows.map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] || '';
                        });

                        // All members are active since we're only loading active member data
                        obj.isActive = true;
                        obj.activeStatusReason = 'Active member data loaded';
                        obj.activeStatusSource = 'main_data';

                        return obj;
                    });

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsBinaryString(file);
        });
    }

    saveDataToStorage() {
        try {
            // Compress data before saving to reduce storage size
            const compressedData = this.compressData(this.data);
            localStorage.setItem('rxReportingData', compressedData);
            localStorage.setItem('rxReportingLastUpdated', new Date().toISOString());
        } catch (error) {
            console.error('Error saving to localStorage:', error);

            // Handle specific localStorage quota exceeded error
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                this.showStorageWarning();
                // Try to clear some space by removing older data if needed
                this.handleStorageQuotaExceeded();
            } else {
                alert('Error saving data. Please try again or check your browser settings.');
            }
        }
    }

    showStorageWarning() {
        // Create a warning message for the user
        const warningDiv = document.createElement('div');
        warningDiv.id = 'storageWarning';
        warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            color: #856404;
            padding: 1rem;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
        `;
        warningDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>Storage Warning</strong><br>
                    <small>Your browser storage is full. Some data may not be saved locally.</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
        `;
        document.body.appendChild(warningDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.getElementById('storageWarning')) {
                document.getElementById('storageWarning').remove();
            }
        }, 10000);
    }

    handleStorageQuotaExceeded() {
        try {
            // Try to free up space by removing non-essential localStorage items
            const keysToRemove = ['rxReportingLastUpdated'];
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.log('Could not remove item:', key);
                }
            });

            // If we still can't save, try with compressed data
            const dataString = JSON.stringify(this.data);
            if (dataString.length > 4 * 1024 * 1024) { // If data is larger than 4MB
                console.warn('Data is very large. Consider reducing dataset size or implementing server-side storage.');
            }
        } catch (error) {
            console.error('Error handling storage quota:', error);
        }
    }

    compressData(data) {
        try {
            // Simple compression by removing redundant fields and using shorter keys
            const compressed = data.map(row => {
                const compressedRow = {
                    mn: row.MemberNumber,           // MemberNumber -> mn
                    dc: row.DependentCode,          // DependentCode -> dc
                    dpn: row.DiseaseProtocolName,   // DiseaseProtocolName -> dpn
                    rrn: row.RiskRatingName,        // RiskRatingName -> rrn
                    rctn: row.RiskCalculationTypeName, // RiskCalculationTypeName -> rctn
                    dt: row.DateCalculated,         // DateCalculated -> dt
                    md: row.MemberDependant,        // MemberDependant -> md
                    ia: row.isActive,               // isActive -> ia
                    asr: row.activeStatusReason,    // activeStatusReason -> asr
                    ass: row.activeStatusSource     // activeStatusSource -> ass
                };
                return compressedRow;
            });

            const jsonString = JSON.stringify(compressed);
            console.log(`Data compression: ${JSON.stringify(data).length} -> ${jsonString.length} bytes (${((jsonString.length / JSON.stringify(data).length) * 100).toFixed(1)}%)`);

            return jsonString;
        } catch (error) {
            console.error('Error compressing data:', error);
            // Fallback to original data if compression fails
            return JSON.stringify(data);
        }
    }

    decompressData(compressedString) {
        try {
            const compressed = JSON.parse(compressedString);
            const decompressed = compressed.map(row => ({
                MemberNumber: row.mn,
                DependentCode: row.dc,
                DiseaseProtocolName: row.dpn,
                RiskRatingName: row.rrn,
                RiskCalculationTypeName: row.rctn,
                DateCalculated: row.dt,
                MemberDependant: row.md,
                isActive: row.ia,
                activeStatusReason: row.asr,
                activeStatusSource: row.ass
            }));

            return decompressed;
        } catch (error) {
            console.error('Error decompressing data:', error);
            // Try to parse as original format if decompression fails
            try {
                return JSON.parse(compressedString);
            } catch (fallbackError) {
                console.error('Error parsing as original format:', fallbackError);
                return [];
            }
        }
    }

    loadStoredData() {
        try {
            const storedData = localStorage.getItem('rxReportingData');
            const lastUpdated = localStorage.getItem('rxReportingLastUpdated');

            if (storedData) {
                // Try to decompress data, fallback to direct parsing if needed
                this.data = this.decompressData(storedData);

                // Update lastUpdated if element exists (was removed from HTML)
                const lastUpdatedEl = document.getElementById('lastUpdated');
                if (lastUpdatedEl) {
                    lastUpdatedEl.textContent = lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown';
                }

                this.initializeDashboard();
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }






    parseExcelDate(excelDate) {
        if (!excelDate) return null;
        if (typeof excelDate === 'number') {
            // Excel date format (days since 1900-01-01)
            const date = new Date((excelDate - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
        // Handle string dates
        const date = new Date(excelDate);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }





    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.id = 'successMessage';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
        `;
        successDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong><i class="fas fa-check-circle"></i> Success</strong><br>
                    <small>${message}</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
        `;
        document.body.appendChild(successDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.getElementById('successMessage')) {
                document.getElementById('successMessage').remove();
            }
        }, 5000);
    }


    initializeDashboard() {
        this.uploadSection.style.display = 'none';
        this.dashboardSection.style.display = 'block';
        this.updateSummaryCards();
        this.populateFilters();
        this.applyFilters();
        this.initializeCharts();
    }

    updateSummaryCards() {
        // Count unique people (not records)
        const uniquePeople = new Set();
        const uniqueProtocols = new Set();
        const highRiskPeople = new Set();
        const activePeople = new Set();
        const inactivePeople = new Set();

        this.data.forEach(row => {
            const personKey = `${row.MemberNumber}-${row.DependentCode}`;
            const protocol = row.DiseaseProtocolName;
            const risk = row.RiskRatingName;
            const isActive = row.isActive;

            uniquePeople.add(personKey);
            if (protocol) uniqueProtocols.add(protocol);
            if (risk === 'High Risk') highRiskPeople.add(personKey);

            if (isActive) {
                activePeople.add(personKey);
            } else {
                inactivePeople.add(personKey);
            }
        });

        // Update DOM elements with null checks
        if (this.totalMembers) {
            this.totalMembers.textContent = uniquePeople.size.toLocaleString();
        }
        if (this.totalProtocols) {
            this.totalProtocols.textContent = uniqueProtocols.size.toLocaleString();
        }
        if (this.highRiskCases) {
            this.highRiskCases.textContent = highRiskPeople.size.toLocaleString();
        }

        // Update active/inactive counts if elements exist
        const activeMembersEl = document.getElementById('activeMembers');
        const inactiveMembersEl = document.getElementById('inactiveMembers');

        if (activeMembersEl) {
            activeMembersEl.textContent = activePeople.size.toLocaleString();
        }
        if (inactiveMembersEl) {
            inactiveMembersEl.textContent = inactivePeople.size.toLocaleString();
        }

        // Update lastUpdated if element exists (was removed from HTML)
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = new Date().toLocaleString();
        }
    }

    populateFilters() {
        const diseases = [...new Set(this.data.map(row => row.DiseaseProtocolName))].filter(Boolean);
        const risks = [...new Set(this.data.map(row => row.RiskRatingName))].filter(Boolean);

        this.filterDisease.innerHTML = '<option value="">All Diseases</option>';
        this.filterRisk.innerHTML = '<option value="">All Risk Levels</option>';

        diseases.forEach(disease => {
            const option = document.createElement('option');
            option.value = disease;
            option.textContent = disease;
            this.filterDisease.appendChild(option);
        });

        risks.forEach(risk => {
            const option = document.createElement('option');
            option.value = risk;
            option.textContent = risk;
            this.filterRisk.appendChild(option);
        });
    }

    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const diseaseFilter = this.filterDisease.value;
        const riskFilter = this.filterRisk.value;

        this.filteredData = this.data.filter(row => {
            const matchesSearch = searchTerm === '' ||
                Object.values(row).some(value =>
                    value.toString().toLowerCase().includes(searchTerm)
                );
            const matchesDisease = diseaseFilter === '' || row.DiseaseProtocolName === diseaseFilter;
            const matchesRisk = riskFilter === '' || row.RiskRatingName === riskFilter;

            return matchesSearch && matchesDisease && matchesRisk;
        });

        this.currentPage = 1;
        this.renderTable();
    }

    renderTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        this.dataTableBody.innerHTML = '';

        pageData.forEach((row, index) => {
            const tr = document.createElement('tr');
            const statusClass = row.isActive ? 'status-active' : 'status-inactive';
            const statusIcon = row.isActive ? 'fas fa-user-check' : 'fas fa-user-times';
            const statusText = row.isActive ? 'Active' : 'Inactive';

            tr.innerHTML = `
                <td>${row.MemberNumber || '-'}</td>
                <td>${row.DependentCode || '-'}</td>
                <td>${row.DiseaseProtocolName || '-'}</td>
                <td><span class="status-${(row.RiskRatingName || '').toLowerCase().replace(' ', '-')}">${row.RiskRatingName || '-'}</span></td>
                <td>${row.RiskCalculationTypeName || '-'}</td>
                <td><span class="${statusClass}"><i class="${statusIcon}"></i> ${statusText}</span></td>
                <td>${this.formatDate(row.DateCalculated)}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="app.showDrillDown(${startIndex + index})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            this.dataTableBody.appendChild(tr);
        });

        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        this.pageInfo.textContent = `Page ${this.currentPage} of ${totalPages || 1}`;
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;

        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderTable();
        }
    }

    formatDate(dateValue) {
        if (!dateValue) return '-';
        try {
            // Handle Excel date format (number of days since 1900-01-01)
            if (typeof dateValue === 'number') {
                const date = new Date((dateValue - 25569) * 86400 * 1000);
                return date.toLocaleDateString();
            }
            // Handle string dates
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? dateValue : date.toLocaleDateString();
        } catch (error) {
            return dateValue;
        }
    }

    initializeCharts() {
        // Only create charts for canvas elements that exist
        if (this.diseaseChart) this.createDiseaseChart();
        if (this.riskChart) this.createRiskChart();
        if (this.peoplePerConditionChart) this.createPeoplePerConditionChart();
        if (this.riskBreakdownChart) this.createRiskBreakdownChart();
        if (this.calculationTypeChart) this.createCalculationTypeChart();
        if (this.calculationTypePerDiseaseChart) this.createCalculationTypePerDiseaseChart();
        if (this.recordsOverTimeChart) this.createRecordsOverTimeChart();
        if (this.commonCalcTypesChart) this.createCommonCalcTypesChart();
        if (this.diseaseCooccurrenceChart) this.createDiseaseCooccurrenceChart();
        if (this.riskByCalcTypeChart) this.createRiskByCalcTypeChart();
        if (this.protocolUsageChart) this.createProtocolUsageChart();
        if (this.highRiskAnalysisChart) this.createHighRiskAnalysisChart();
        if (this.dataEntryPatternsChart) this.createDataEntryPatternsChart();
        if (this.riskTrendChart) this.createRiskTrendChart();
        if (this.calcMethodEffectivenessChart) this.createCalcMethodEffectivenessChart();
        if (this.diseaseSeverityChart) this.createDiseaseSeverityChart();
        if (this.riskPerProtocolChart) this.createRiskPerProtocolChart();
    }

    createDiseaseChart(type = 'pie') {
        const diseaseData = this.getDiseaseDistribution();
        const chartConfig = this.getChartConfig(type, diseaseData, 'Disease Distribution');

        if (this.charts.diseaseChart) {
            this.charts.diseaseChart.destroy();
        }

        this.charts.diseaseChart = new Chart(this.diseaseChart, chartConfig);
    }

    createRiskChart(type = 'bar') {
        const riskData = this.getRiskDistribution();
        const chartConfig = this.getChartConfig(type, riskData, 'Risk Rating Distribution');

        if (this.charts.riskChart) {
            this.charts.riskChart.destroy();
        }

        this.charts.riskChart = new Chart(this.riskChart, chartConfig);
    }

    updateDiseaseChart(type) {
        this.createDiseaseChart(type);
    }

    updateRiskChart(type) {
        this.createRiskChart(type);
    }

    // New chart methods
    createPeoplePerConditionChart(type = 'bar') {
        const chartData = this.getPeoplePerConditionData();
        const chartConfig = this.getChartConfig(type, chartData, 'People per Condition');

        if (this.charts.peoplePerConditionChart) {
            this.charts.peoplePerConditionChart.destroy();
        }

        this.charts.peoplePerConditionChart = new Chart(this.peoplePerConditionChart, chartConfig);
    }

    createRiskBreakdownChart(type = 'pie') {
        const chartData = this.getRiskBreakdownData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Rating Breakdown');

        if (this.charts.riskBreakdownChart) {
            this.charts.riskBreakdownChart.destroy();
        }

        this.charts.riskBreakdownChart = new Chart(this.riskBreakdownChart, chartConfig);
    }

    createCalculationTypeChart(type = 'bar') {
        const chartData = this.getCalculationTypeData();
        const chartConfig = this.getChartConfig(type, chartData, 'Calculation Types per Risk Rating');

        if (this.charts.calculationTypeChart) {
            this.charts.calculationTypeChart.destroy();
        }

        this.charts.calculationTypeChart = new Chart(this.calculationTypeChart, chartConfig);
    }

    updatePeoplePerConditionChart(type) {
        this.createPeoplePerConditionChart(type);
    }

    updateRiskBreakdownChart(type) {
        this.createRiskBreakdownChart(type);
    }

    updateCalculationTypeChart(type) {
        this.createCalculationTypeChart(type);
    }

    createCalculationTypePerDiseaseChart(type = 'bar') {
        const chartData = this.getCalculationTypePerDiseaseData();
        const chartConfig = this.getChartConfig(type, chartData, 'Calculation Types per Disease');

        if (this.charts.calculationTypePerDiseaseChart) {
            this.charts.calculationTypePerDiseaseChart.destroy();
        }

        this.charts.calculationTypePerDiseaseChart = new Chart(this.calculationTypePerDiseaseChart, chartConfig);
    }

    updateCalculationTypePerDiseaseChart(type) {
        this.createCalculationTypePerDiseaseChart(type);
    }

    // New chart creation methods
    createRecordsOverTimeChart(type = 'line') {
        const chartData = this.getRecordsOverTimeData();
        const chartConfig = this.getChartConfig(type, chartData, 'Records Over Time');

        if (this.charts.recordsOverTimeChart) {
            this.charts.recordsOverTimeChart.destroy();
        }

        this.charts.recordsOverTimeChart = new Chart(this.recordsOverTimeChart, chartConfig);
    }

    createCommonCalcTypesChart(type = 'pie') {
        const chartData = this.getCommonCalcTypesData();
        const chartConfig = this.getChartConfig(type, chartData, 'Most Common Calculation Types');

        if (this.charts.commonCalcTypesChart) {
            this.charts.commonCalcTypesChart.destroy();
        }

        this.charts.commonCalcTypesChart = new Chart(this.commonCalcTypesChart, chartConfig);
    }

    createDiseaseCooccurrenceChart(type = 'bar') {
        const chartData = this.getDiseaseCooccurrenceData();
        const chartConfig = this.getChartConfig(type, chartData, 'Disease Co-occurrence');

        if (this.charts.diseaseCooccurrenceChart) {
            this.charts.diseaseCooccurrenceChart.destroy();
        }

        this.charts.diseaseCooccurrenceChart = new Chart(this.diseaseCooccurrenceChart, chartConfig);
    }

    createRiskByCalcTypeChart(type = 'bar') {
        const chartData = this.getRiskByCalcTypeData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk by Calculation Type');

        if (this.charts.riskByCalcTypeChart) {
            this.charts.riskByCalcTypeChart.destroy();
        }

        this.charts.riskByCalcTypeChart = new Chart(this.riskByCalcTypeChart, chartConfig);
    }

    createProtocolUsageChart(type = 'bar') {
        const chartData = this.getProtocolUsageData();
        const chartConfig = this.getChartConfig(type, chartData, 'Protocol Usage Frequency');

        if (this.charts.protocolUsageChart) {
            this.charts.protocolUsageChart.destroy();
        }

        this.charts.protocolUsageChart = new Chart(this.protocolUsageChart, chartConfig);
    }

    createHighRiskAnalysisChart(type = 'pie') {
        const chartData = this.getHighRiskAnalysisData();
        const chartConfig = this.getChartConfig(type, chartData, 'High Risk Patient Analysis');

        if (this.charts.highRiskAnalysisChart) {
            this.charts.highRiskAnalysisChart.destroy();
        }

        this.charts.highRiskAnalysisChart = new Chart(this.highRiskAnalysisChart, chartConfig);
    }

    createDataEntryPatternsChart(type = 'line') {
        const chartData = this.getDataEntryPatternsData();
        const chartConfig = this.getChartConfig(type, chartData, 'Data Entry Patterns');

        if (this.charts.dataEntryPatternsChart) {
            this.charts.dataEntryPatternsChart.destroy();
        }

        this.charts.dataEntryPatternsChart = new Chart(this.dataEntryPatternsChart, chartConfig);
    }

    createRiskTrendChart(type = 'line') {
        const chartData = this.getRiskTrendData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Trend Analysis');

        if (this.charts.riskTrendChart) {
            this.charts.riskTrendChart.destroy();
        }

        this.charts.riskTrendChart = new Chart(this.riskTrendChart, chartConfig);
    }

    createCalcMethodEffectivenessChart(type = 'bar') {
        const chartData = this.getCalcMethodEffectivenessData();
        const chartConfig = this.getChartConfig(type, chartData, 'Calculation Method Effectiveness');

        if (this.charts.calcMethodEffectivenessChart) {
            this.charts.calcMethodEffectivenessChart.destroy();
        }

        this.charts.calcMethodEffectivenessChart = new Chart(this.calcMethodEffectivenessChart, chartConfig);
    }

    createDiseaseSeverityChart(type = 'bar') {
        const chartData = this.getDiseaseSeverityData();
        const chartConfig = this.getChartConfig(type, chartData, 'Disease Severity Patterns');

        if (this.charts.diseaseSeverityChart) {
            this.charts.diseaseSeverityChart.destroy();
        }

        this.charts.diseaseSeverityChart = new Chart(this.diseaseSeverityChart, chartConfig);
    }

    // Update methods for new charts
    updateRecordsOverTimeChart(type) {
        this.createRecordsOverTimeChart(type);
    }

    updateCommonCalcTypesChart(type) {
        this.createCommonCalcTypesChart(type);
    }

    updateDiseaseCooccurrenceChart(type) {
        this.createDiseaseCooccurrenceChart(type);
    }

    updateRiskByCalcTypeChart(type) {
        this.createRiskByCalcTypeChart(type);
    }

    updateProtocolUsageChart(type) {
        this.createProtocolUsageChart(type);
    }

    updateHighRiskAnalysisChart(type) {
        this.createHighRiskAnalysisChart(type);
    }

    updateDataEntryPatternsChart(type) {
        this.createDataEntryPatternsChart(type);
    }

    updateRiskTrendChart(type) {
        this.createRiskTrendChart(type);
    }

    updateCalcMethodEffectivenessChart(type) {
        this.createCalcMethodEffectivenessChart(type);
    }

    updateDiseaseSeverityChart(type) {
        this.createDiseaseSeverityChart(type);
    }

    createRiskPerProtocolChart(type = 'bar') {
        const chartData = this.getRiskPerProtocolData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Rating per Protocol');

        if (this.charts.riskPerProtocolChart) {
            this.charts.riskPerProtocolChart.destroy();
        }

        this.charts.riskPerProtocolChart = new Chart(this.riskPerProtocolChart, chartConfig);
    }

    updateRiskPerProtocolChart(type) {
        this.createRiskPerProtocolChart(type);
    }

    updateAllCharts() {
        // Update all charts with current data
        this.createDiseaseChart(document.getElementById('diseaseChartType').value);
        this.createRiskChart(document.getElementById('riskChartType').value);
        this.createPeoplePerConditionChart(document.getElementById('peoplePerConditionChartType').value);
        this.createRiskBreakdownChart(document.getElementById('riskBreakdownChartType').value);
        this.createCalculationTypeChart(document.getElementById('calculationTypeChartType').value);
        this.createCalculationTypePerDiseaseChart(document.getElementById('calculationTypePerDiseaseChartType').value);
        this.createRecordsOverTimeChart(document.getElementById('recordsOverTimeChartType').value);
        this.createCommonCalcTypesChart(document.getElementById('commonCalcTypesChartType').value);
        this.createDiseaseCooccurrenceChart(document.getElementById('diseaseCooccurrenceChartType').value);
        this.createRiskByCalcTypeChart(document.getElementById('riskByCalcTypeChartType').value);
        this.createProtocolUsageChart(document.getElementById('protocolUsageChartType').value);
        this.createHighRiskAnalysisChart(document.getElementById('highRiskAnalysisChartType').value);
        this.createDataEntryPatternsChart(document.getElementById('dataEntryPatternsChartType').value);
        this.createRiskTrendChart(document.getElementById('riskTrendChartType').value);
        this.createCalcMethodEffectivenessChart(document.getElementById('calcMethodEffectivenessChartType').value);
        this.createDiseaseSeverityChart(document.getElementById('diseaseSeverityChartType').value);
        this.createRiskPerProtocolChart(document.getElementById('riskPerProtocolChartType').value);
    }

    updateAllCharts() {
        // Update all charts with current data - only for existing charts
        if (this.diseaseChart) this.createDiseaseChart(document.getElementById('diseaseChartType')?.value);
        if (this.riskChart) this.createRiskChart(document.getElementById('riskChartType')?.value);
        if (this.peoplePerConditionChart) this.createPeoplePerConditionChart(document.getElementById('peoplePerConditionChartType')?.value);
        if (this.riskBreakdownChart) this.createRiskBreakdownChart(document.getElementById('riskBreakdownChartType')?.value);
        if (this.calculationTypeChart) this.createCalculationTypeChart(document.getElementById('calculationTypeChartType')?.value);
        if (this.calculationTypePerDiseaseChart) this.createCalculationTypePerDiseaseChart(document.getElementById('calculationTypePerDiseaseChartType')?.value);
        if (this.recordsOverTimeChart) this.createRecordsOverTimeChart(document.getElementById('recordsOverTimeChartType')?.value);
        if (this.commonCalcTypesChart) this.createCommonCalcTypesChart(document.getElementById('commonCalcTypesChartType')?.value);
        if (this.diseaseCooccurrenceChart) this.createDiseaseCooccurrenceChart(document.getElementById('diseaseCooccurrenceChartType')?.value);
        if (this.riskByCalcTypeChart) this.createRiskByCalcTypeChart(document.getElementById('riskByCalcTypeChartType')?.value);
        if (this.protocolUsageChart) this.createProtocolUsageChart(document.getElementById('protocolUsageChartType')?.value);
        if (this.highRiskAnalysisChart) this.createHighRiskAnalysisChart(document.getElementById('highRiskAnalysisChartType')?.value);
        if (this.dataEntryPatternsChart) this.createDataEntryPatternsChart(document.getElementById('dataEntryPatternsChartType')?.value);
        if (this.riskTrendChart) this.createRiskTrendChart(document.getElementById('riskTrendChartType')?.value);
        if (this.calcMethodEffectivenessChart) this.createCalcMethodEffectivenessChart(document.getElementById('calcMethodEffectivenessChartType')?.value);
        if (this.diseaseSeverityChart) this.createDiseaseSeverityChart(document.getElementById('diseaseSeverityChartType')?.value);
        if (this.riskPerProtocolChart) this.createRiskPerProtocolChart(document.getElementById('riskPerProtocolChartType')?.value);
    }

    getDiseaseDistribution() {
        // Count unique people per disease (not records) - ACTIVE MEMBERS ONLY
        const peoplePerDisease = new Map();

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const disease = row.DiseaseProtocolName || 'Unknown';
            const personKey = `${row.MemberNumber}-${row.DependentCode}`;

            if (!peoplePerDisease.has(disease)) {
                peoplePerDisease.set(disease, new Set());
            }
            peoplePerDisease.get(disease).add(personKey);
        });

        // Convert to chart data
        const labels = Array.from(peoplePerDisease.keys());
        const data = labels.map(disease => peoplePerDisease.get(disease).size);

        return {
            labels: labels,
            data: data,
            backgroundColor: this.generateColors(labels.length)
        };
    }

    getRiskDistribution() {
        // Count unique people per risk level (not records) - ACTIVE MEMBERS ONLY
        const peoplePerRisk = new Map();

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const risk = row.RiskRatingName || 'Unknown';
            const personKey = `${row.MemberNumber}-${row.DependentCode}`;

            if (!peoplePerRisk.has(risk)) {
                peoplePerRisk.set(risk, new Set());
            }
            peoplePerRisk.get(risk).add(personKey);
        });

        // Convert to chart data
        const labels = Array.from(peoplePerRisk.keys());
        const data = labels.map(risk => peoplePerRisk.get(risk).size);

        return {
            labels: labels,
            data: data,
            backgroundColor: this.generateColors(labels.length, true)
        };
    }

    getPeoplePerConditionData() {
        // Track which conditions each person has - ACTIVE MEMBERS ONLY
        const peopleConditions = new Map();

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const memberNumber = row.MemberNumber;
            const dependentCode = row.DependentCode;
            const condition = row.DiseaseProtocolName || 'Unknown';
            const personKey = `${memberNumber}-${dependentCode}`;

            if (!memberNumber || !condition) return;

            if (!peopleConditions.has(personKey)) {
                peopleConditions.set(personKey, new Set());
            }
            peopleConditions.get(personKey).add(condition);
        });

        // Count unique people per condition
        const conditionPeople = {};
        peopleConditions.forEach(conditions => {
            conditions.forEach(condition => {
                conditionPeople[condition] = (conditionPeople[condition] || 0) + 1;
            });
        });

        return {
            labels: Object.keys(conditionPeople),
            data: Object.values(conditionPeople),
            backgroundColor: this.generateColors(Object.keys(conditionPeople).length)
        };
    }

    getRiskBreakdownData() {
        // Count unique people per risk level (not records) - ACTIVE MEMBERS ONLY
        const peoplePerRisk = new Map();

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const risk = row.RiskRatingName || 'Unknown';
            const personKey = `${row.MemberNumber}-${row.DependentCode}`;

            if (!peoplePerRisk.has(risk)) {
                peoplePerRisk.set(risk, new Set());
            }
            peoplePerRisk.get(risk).add(personKey);
        });

        // Convert to chart data
        const labels = Array.from(peoplePerRisk.keys());
        const data = labels.map(risk => peoplePerRisk.get(risk).size);

        return {
            labels: labels,
            data: data,
            backgroundColor: this.generateColors(labels.length, true)
        };
    }

    getCalculationTypeData() {
        const calculationByRisk = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const risk = row.RiskRatingName || 'Unknown';
            const calculationType = row.RiskCalculationTypeName || 'Unknown';

            if (!calculationByRisk[risk]) {
                calculationByRisk[risk] = {};
            }
            calculationByRisk[risk][calculationType] = (calculationByRisk[risk][calculationType] || 0) + 1;
        });

        // Transform into chart data format
        const labels = Object.keys(calculationByRisk);
        const datasets = [];

        // Get all unique calculation types
        const allCalculationTypes = new Set();
        Object.values(calculationByRisk).forEach(riskData => {
            Object.keys(riskData).forEach(calcType => allCalculationTypes.add(calcType));
        });

        const calculationTypes = Array.from(allCalculationTypes);

        // Create dataset for each calculation type
        calculationTypes.forEach((calcType, index) => {
            const data = labels.map(risk => calculationByRisk[risk][calcType] || 0);
            datasets.push({
                label: calcType,
                data: data,
                backgroundColor: this.generateColors(calculationTypes.length)[index]
            });
        });

        return {
            labels: labels,
            datasets: datasets
        };
    }

    // New data analysis functions
    getRecordsOverTimeData() {
        const monthlyData = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const date = this.formatDate(row.DateCalculated);
            if (date !== '-') {
                const monthKey = date.substring(0, 7); // YYYY-MM format
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        return {
            labels: sortedMonths,
            datasets: [{
                label: 'Records per Month',
                data: sortedMonths.map(month => monthlyData[month]),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                fill: false
            }]
        };
    }

    getCommonCalcTypesData() {
        const calcTypeCount = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const calcType = row.RiskCalculationTypeName || 'Unknown';
            calcTypeCount[calcType] = (calcTypeCount[calcType] || 0) + 1;
        });

        const sortedCalcTypes = Object.entries(calcTypeCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10

        return {
            labels: sortedCalcTypes.map(([type]) => type),
            data: sortedCalcTypes.map(([,count]) => count),
            backgroundColor: this.generateColors(sortedCalcTypes.length)
        };
    }

    getDiseaseCooccurrenceData() {
        const peopleDiseases = new Map();

        // Build person-to-diseases mapping - ACTIVE MEMBERS ONLY
        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependentCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';

            if (!peopleDiseases.has(personKey)) {
                peopleDiseases.set(personKey, new Set());
            }
            peopleDiseases.get(personKey).add(disease);
        });

        // Count co-occurrences
        const cooccurrence = new Map();
        const diseases = new Set();

        peopleDiseases.forEach(personDiseases => {
            const diseaseArray = Array.from(personDiseases);
            diseases.add(...diseaseArray);

            for (let i = 0; i < diseaseArray.length; i++) {
                for (let j = i + 1; j < diseaseArray.length; j++) {
                    const pair = [diseaseArray[i], diseaseArray[j]].sort().join(' + ');
                    cooccurrence.set(pair, (cooccurrence.get(pair) || 0) + 1);
                }
            }
        });

        const sortedPairs = Array.from(cooccurrence.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15); // Top 15 co-occurrences

        return {
            labels: sortedPairs.map(([pair]) => pair),
            data: sortedPairs.map(([,count]) => count),
            backgroundColor: this.generateColors(sortedPairs.length)
        };
    }

    getRiskByCalcTypeData() {
        const riskByCalc = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const calcType = row.RiskCalculationTypeName || 'Unknown';
            const risk = row.RiskRatingName || 'Unknown';

            if (!riskByCalc[calcType]) {
                riskByCalc[calcType] = {};
            }
            riskByCalc[calcType][risk] = (riskByCalc[calcType][risk] || 0) + 1;
        });

        const calcTypes = Object.keys(riskByCalc);
        const riskLevels = ['High Risk', 'Medium Risk', 'Low Risk'];

        const datasets = riskLevels.map((riskLevel, index) => ({
            label: riskLevel,
            data: calcTypes.map(calcType => riskByCalc[calcType][riskLevel] || 0),
            backgroundColor: this.generateColors(riskLevels.length, true)[index]
        }));

        return {
            labels: calcTypes,
            datasets: datasets
        };
    }

    getProtocolUsageData() {
        const protocolCount = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const protocol = row.DiseaseProtocolName || 'Unknown';
            protocolCount[protocol] = (protocolCount[protocol] || 0) + 1;
        });

        const sortedProtocols = Object.entries(protocolCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20); // Top 20 protocols

        return {
            labels: sortedProtocols.map(([protocol]) => protocol),
            data: sortedProtocols.map(([,count]) => count),
            backgroundColor: this.generateColors(sortedProtocols.length)
        };
    }

    getHighRiskAnalysisData() {
        const highRiskData = this.data.filter(row => row.RiskRatingName === 'High Risk' && row.isActive);
        const calcTypeCount = {};

        highRiskData.forEach(row => {
            const calcType = row.RiskCalculationTypeName || 'Unknown';
            calcTypeCount[calcType] = (calcTypeCount[calcType] || 0) + 1;
        });

        const sortedCalcTypes = Object.entries(calcTypeCount)
            .sort(([,a], [,b]) => b - a);

        return {
            labels: sortedCalcTypes.map(([type]) => type),
            data: sortedCalcTypes.map(([,count]) => count),
            backgroundColor: this.generateColors(sortedCalcTypes.length)
        };
    }

    getDataEntryPatternsData() {
        const hourlyData = {};
        const dailyData = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const date = this.formatDate(row.DateCalculated);
            if (date !== '-') {
                const hour = date.split(' ')[1]?.split(':')[0] || '00';
                const day = date.split(' ')[0] || '';

                hourlyData[hour] = (hourlyData[hour] || 0) + 1;
                dailyData[day] = (dailyData[day] || 0) + 1;
            }
        });

        // Return hourly patterns (more granular)
        const sortedHours = Object.keys(hourlyData).sort((a, b) => a - b);
        return {
            labels: sortedHours.map(hour => `${hour}:00`),
            datasets: [{
                label: 'Records per Hour',
                data: sortedHours.map(hour => hourlyData[hour]),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false
            }]
        };
    }

    getRiskTrendData() {
        const monthlyRiskData = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const date = this.formatDate(row.DateCalculated);
            const risk = row.RiskRatingName || 'Unknown';

            if (date !== '-') {
                const monthKey = date.substring(0, 7); // YYYY-MM format

                if (!monthlyRiskData[monthKey]) {
                    monthlyRiskData[monthKey] = { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 };
                }
                monthlyRiskData[monthKey][risk] = (monthlyRiskData[monthKey][risk] || 0) + 1;
            }
        });

        const sortedMonths = Object.keys(monthlyRiskData).sort();
        const riskLevels = ['High Risk', 'Medium Risk', 'Low Risk'];

        const datasets = riskLevels.map((riskLevel, index) => ({
            label: riskLevel,
            data: sortedMonths.map(month => monthlyRiskData[month][riskLevel] || 0),
            backgroundColor: this.generateColors(riskLevels.length, true)[index],
            borderColor: this.generateColors(riskLevels.length, true)[index].replace('0.6', '1'),
            borderWidth: 2,
            fill: false
        }));

        return {
            labels: sortedMonths,
            datasets: datasets
        };
    }

    getCalcMethodEffectivenessData() {
        const methodStats = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const calcType = row.RiskCalculationTypeName || 'Unknown';
            const risk = row.RiskRatingName || 'Unknown';

            if (!methodStats[calcType]) {
                methodStats[calcType] = { total: 0, highRisk: 0 };
            }
            methodStats[calcType].total++;
            if (risk === 'High Risk') {
                methodStats[calcType].highRisk++;
            }
        });

        const calcTypes = Object.keys(methodStats);
        const effectivenessData = calcTypes.map(calcType => {
            const stats = methodStats[calcType];
            return stats.total > 0 ? (stats.highRisk / stats.total) * 100 : 0;
        });

        return {
            labels: calcTypes,
            datasets: [{
                label: 'High Risk Percentage (%)',
                data: effectivenessData,
                backgroundColor: this.generateColors(calcTypes.length)
            }]
        };
    }

    getDiseaseSeverityData() {
        const diseaseRiskProfile = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const disease = row.DiseaseProtocolName || 'Unknown';
            const risk = row.RiskRatingName || 'Unknown';

            if (!diseaseRiskProfile[disease]) {
                diseaseRiskProfile[disease] = { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0, total: 0 };
            }
            diseaseRiskProfile[disease][risk]++;
            diseaseRiskProfile[disease].total++;
        });

        const diseases = Object.keys(diseaseRiskProfile);
        const severityScores = diseases.map(disease => {
            const profile = diseaseRiskProfile[disease];
            // Calculate severity score: High=3, Medium=2, Low=1
            return profile.total > 0 ?
                ((profile['High Risk'] * 3 + profile['Medium Risk'] * 2 + profile['Low Risk'] * 1) / profile.total) : 0;
        });

        return {
            labels: diseases,
            datasets: [{
                label: 'Disease Severity Score',
                data: severityScores,
                backgroundColor: this.generateColors(diseases.length)
            }]
        };
    }

    getRiskPerProtocolData() {
        const protocolRiskData = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const protocol = row.DiseaseProtocolName || 'Unknown';
            const risk = row.RiskRatingName || 'Unknown';

            if (!protocolRiskData[protocol]) {
                protocolRiskData[protocol] = { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0, total: 0 };
            }
            protocolRiskData[protocol][risk]++;
            protocolRiskData[protocol].total++;
        });

        const protocols = Object.keys(protocolRiskData);
        const riskLevels = ['High Risk', 'Medium Risk', 'Low Risk'];

        const datasets = riskLevels.map((riskLevel, index) => ({
            label: riskLevel,
            data: protocols.map(protocol => protocolRiskData[protocol][riskLevel] || 0),
            backgroundColor: this.generateColors(riskLevels.length, true)[index]
        }));

        return {
            labels: protocols,
            datasets: datasets
        };
    }

    getCalculationTypePerDiseaseData() {
        const calculationByDisease = {};

        this.data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const disease = row.DiseaseProtocolName || 'Unknown';
            const calculationType = row.RiskCalculationTypeName || 'Unknown';

            if (!calculationByDisease[disease]) {
                calculationByDisease[disease] = {};
            }
            calculationByDisease[disease][calculationType] = (calculationByDisease[disease][calculationType] || 0) + 1;
        });

        // Transform into chart data format
        const labels = Object.keys(calculationByDisease);
        const datasets = [];

        // Get all unique calculation types
        const allCalculationTypes = new Set();
        Object.values(calculationByDisease).forEach(diseaseData => {
            Object.keys(diseaseData).forEach(calcType => allCalculationTypes.add(calcType));
        });

        const calculationTypes = Array.from(allCalculationTypes);

        // Create dataset for each calculation type
        calculationTypes.forEach((calcType, index) => {
            const data = labels.map(disease => calculationByDisease[disease][calcType] || 0);
            datasets.push({
                label: calcType,
                data: data,
                backgroundColor: this.generateColors(calculationTypes.length)[index]
            });
        });

        return {
            labels: labels,
            datasets: datasets
        };
    }

    getChartConfig(type, data, label) {
        const baseConfig = {
            type: type,
            data: {
                labels: data.labels,
                datasets: data.datasets || [{
                    label: label,
                    data: data.data,
                    backgroundColor: data.backgroundColor,
                    borderColor: data.backgroundColor ? data.backgroundColor.map(color => color.replace('0.6', '1')) : undefined,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (data.datasets) {
                                    // Multi-dataset chart (like calculation types)
                                    return `${context.dataset.label}: ${context.raw}`;
                                } else {
                                    // Single dataset chart
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.raw / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.raw} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            }
        };

        // Type-specific configurations
        if (type === 'bar') {
            baseConfig.options.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            };
        } else if (type === 'line') {
            if (data.datasets) {
                // Multi-dataset line chart
                data.datasets.forEach(dataset => {
                    dataset.fill = false;
                    dataset.tension = 0.4;
                });
            } else {
                // Single dataset line chart
                baseConfig.data.datasets[0].fill = false;
                baseConfig.data.datasets[0].tension = 0.4;
            }
        }

        return baseConfig;
    }

    generateColors(count, isRiskChart = false) {
        const colors = [];
        const riskColors = {
            'High Risk': 'rgba(220, 53, 69, 0.6)',
            'Low Risk': 'rgba(40, 167, 69, 0.6)',
            'Medium Risk': 'rgba(255, 193, 7, 0.6)'
        };

        for (let i = 0; i < count; i++) {
            if (isRiskChart) {
                // Use predefined colors for risk chart
                const riskLevels = Object.keys(riskColors);
                colors.push(riskColors[riskLevels[i % riskLevels.length]]);
            } else {
                // Generate random colors for other charts
                const hue = (i * 137.508) % 360; // Golden angle approximation
                colors.push(`hsla(${hue}, 70%, 50%, 0.6)`);
            }
        }

        return colors;
    }

    showDrillDown(index) {
        const record = this.data[index];
        if (!record) return;

        this.modalTitle.textContent = `Record Details - Member ${record.MemberNumber || 'Unknown'}`;
        this.modalBody.innerHTML = this.generateDrillDownContent(record);
        this.drillDownModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    generateDrillDownContent(record) {
        const relatedRecords = this.data.filter(r =>
            r.MemberNumber === record.MemberNumber &&
            r.DependentCode === record.DependentCode
        );

        return `
            <div class="drill-down-content">
                <div class="drill-down-section">
                    <h4>Patient Information</h4>
                    <p><strong>Member Number:</strong> ${record.MemberNumber || '-'}</p>
                    <p><strong>Dependent Code:</strong> ${record.DependentCode || '-'}</p>
                    <p><strong>Total Records:</strong> ${relatedRecords.length}</p>
                </div>

                <div class="drill-down-section">
                    <h4>Medical Information</h4>
                    <p><strong>Disease Protocol:</strong> ${record.DiseaseProtocolName || '-'}</p>
                    <p><strong>Risk Rating:</strong> <span class="status-${(record.RiskRatingName || '').toLowerCase().replace(' ', '-')}">${record.RiskRatingName || '-'}</span></p>
                    <p><strong>Risk Calculation Type:</strong> ${record.RiskCalculationTypeName || '-'}</p>
                    <p><strong>Member Status:</strong> <span class="${record.isActive ? 'status-active' : 'status-inactive'}"><i class="${record.isActive ? 'fas fa-user-check' : 'fas fa-user-times'}"></i> ${record.isActive ? 'Active' : 'Inactive'}</span></p>
                    <p><strong>Status Reason:</strong> ${record.activeStatusReason || 'Not determined'}</p>
                    <p><strong>Status Source:</strong> ${record.activeStatusSource || 'Unknown'}</p>
                </div>

                <div class="drill-down-section">
                    <h4>Timeline</h4>
                    <p><strong>Date Calculated:</strong> ${this.formatDate(record.DateCalculated)}</p>
                    <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <div class="drill-down-section" style="grid-column: 1 / -1;">
                    <h4>Risk History</h4>
                    <div class="risk-timeline">
                        ${relatedRecords.map(r => `
                            <div class="timeline-item">
                                <div class="timeline-date">${this.formatDate(r.DateCalculated)}</div>
                                <div class="timeline-content">
                                    <strong>${r.DiseaseProtocolName}</strong> -
                                    <span class="status-${(r.RiskRatingName || '').toLowerCase().replace(' ', '-')}">${r.RiskRatingName}</span>
                                    (${r.RiskCalculationTypeName})
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    hideModal() {
        this.drillDownModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showLoading(message = 'Loading...') {
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('loadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 1.2rem;
            `;
            overlay.innerHTML = `
                <div style="text-align: center;">
                    <div class="loading" style="margin: 0 auto 1rem;"></div>
                    <div id="loadingMessage">${message}</div>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            document.getElementById('loadingMessage').textContent = message;
            document.getElementById('loadingOverlay').style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Fullscreen functionality
    toggleFullscreen(chartId) {
        const modal = document.getElementById('fullscreenModal');
        const modalTitle = document.getElementById('fullscreenModalTitle');
        const modalCanvas = document.getElementById('fullscreenModalCanvas');
        const modalControls = document.getElementById('fullscreenModalControls');

        if (modal.style.display === 'flex') {
            // Close fullscreen
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        } else {
            // Open fullscreen
            this.openFullscreen(chartId, modal, modalTitle, modalCanvas, modalControls);
        }
    }

    openFullscreen(chartId, modal, modalTitle, modalCanvas, modalControls) {
        // Get chart title
        const chartContainer = document.querySelector(`[onclick*="${chartId}"]`).closest('.chart-container');
        const chartTitle = chartContainer.querySelector('h3').textContent;

        // Set modal title
        modalTitle.textContent = chartTitle;

        // Clone the canvas
        const originalCanvas = document.getElementById(chartId);
        const originalChart = this.charts[chartId.replace('Chart', 'Chart')];

        // Create a new canvas for fullscreen
        const fullscreenCanvas = document.createElement('canvas');
        fullscreenCanvas.id = 'fullscreenModalCanvas';
        fullscreenCanvas.width = originalCanvas.width;
        fullscreenCanvas.height = originalCanvas.height;

        // Replace the modal canvas
        modalCanvas.parentNode.replaceChild(fullscreenCanvas, modalCanvas);
        modalCanvas = fullscreenCanvas;

        // Clone chart controls
        const originalControls = chartContainer.querySelector('.chart-controls');
        const clonedControls = originalControls.cloneNode(true);
        clonedControls.id = 'fullscreenModalControls';

        // Update cloned control IDs and event handlers
        const select = clonedControls.querySelector('select');
        const button = clonedControls.querySelector('button');

        if (select) {
            const newSelectId = `fullscreen${select.id}`;
            select.id = newSelectId;
            select.addEventListener('change', (e) => {
                this.recreateFullscreenChart(chartId, e.target.value);
            });
        }

        if (button) {
            button.onclick = () => this.toggleFullscreen(chartId);
            button.innerHTML = '<i class="fas fa-compress"></i>';
        }

        // Replace modal controls
        modalControls.parentNode.replaceChild(clonedControls, modalControls);
        modalControls = clonedControls;

        // Create new chart instance for fullscreen
        const ctx = modalCanvas.getContext('2d');
        const chartConfig = this.getChartConfigForFullscreen(originalChart, chartId);

        if (this.fullscreenChart) {
            this.fullscreenChart.destroy();
        }

        this.fullscreenChart = new Chart(ctx, chartConfig);

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    getChartConfigForFullscreen(originalChart, chartId) {
        // Clone the original chart configuration
        const config = JSON.parse(JSON.stringify(originalChart.options));

        // Update for fullscreen display
        config.responsive = true;
        config.maintainAspectRatio = false;

        // Increase font sizes for better visibility
        if (config.plugins && config.plugins.legend) {
            config.plugins.legend.labels = {
                ...config.plugins.legend.labels,
                font: { size: 16 },
                padding: 25
            };
        }

        if (config.plugins && config.plugins.tooltip) {
            config.plugins.tooltip.titleFont = { size: 16 };
            config.plugins.tooltip.bodyFont = { size: 14 };
        }

        // Adjust scales for better readability
        if (config.scales) {
            if (config.scales.x) {
                config.scales.x.ticks = {
                    ...config.scales.x.ticks,
                    font: { size: 14 },
                    maxRotation: 45,
                    minRotation: 45
                };
            }
            if (config.scales.y) {
                config.scales.y.ticks = {
                    ...config.scales.y.ticks,
                    font: { size: 14 }
                };
            }
        }

        return {
            type: originalChart.config.type,
            data: originalChart.data,
            options: config
        };
    }

    recreateFullscreenChart(chartId, newType) {
        if (!this.fullscreenChart) return;

        const modalCanvas = document.getElementById('fullscreenModalCanvas');
        const ctx = modalCanvas.getContext('2d');

        // Destroy old chart
        this.fullscreenChart.destroy();

        // Get data based on chart type
        let chartData;
        switch (chartId) {
            case 'diseaseChart':
                chartData = this.getDiseaseDistribution();
                break;
            case 'riskChart':
                chartData = this.getRiskDistribution();
                break;
            case 'peoplePerConditionChart':
                chartData = this.getPeoplePerConditionData();
                break;
            case 'riskBreakdownChart':
                chartData = this.getRiskBreakdownData();
                break;
            case 'calculationTypeChart':
                chartData = this.getCalculationTypeData();
                break;
            case 'calculationTypePerDiseaseChart':
                chartData = this.getCalculationTypePerDiseaseData();
                break;
            case 'recordsOverTimeChart':
                chartData = this.getRecordsOverTimeData();
                break;
            case 'commonCalcTypesChart':
                chartData = this.getCommonCalcTypesData();
                break;
            case 'diseaseCooccurrenceChart':
                chartData = this.getDiseaseCooccurrenceData();
                break;
            case 'riskByCalcTypeChart':
                chartData = this.getRiskByCalcTypeData();
                break;
            case 'protocolUsageChart':
                chartData = this.getProtocolUsageData();
                break;
            case 'highRiskAnalysisChart':
                chartData = this.getHighRiskAnalysisData();
                break;
            case 'dataEntryPatternsChart':
                chartData = this.getDataEntryPatternsData();
                break;
            case 'riskTrendChart':
                chartData = this.getRiskTrendData();
                break;
            case 'calcMethodEffectivenessChart':
                chartData = this.getCalcMethodEffectivenessData();
                break;
            case 'diseaseSeverityChart':
                chartData = this.getDiseaseSeverityData();
                break;
            case 'riskPerProtocolChart':
                chartData = this.getRiskPerProtocolData();
                break;
            default:
                return;
        }

        // Create new chart with updated type
        const chartConfig = this.getChartConfig(newType, chartData, document.getElementById('fullscreenModalTitle').textContent);
        this.fullscreenChart = new Chart(ctx, chartConfig);
    }

    // Chart Context Menu Functionality
    initializeChartContextMenus() {
        const chartIds = [
            'diseaseChart', 'riskChart', 'peoplePerConditionChart', 'riskBreakdownChart',
            'calculationTypeChart', 'calculationTypePerDiseaseChart', 'recordsOverTimeChart',
            'commonCalcTypesChart', 'diseaseCooccurrenceChart', 'riskByCalcTypeChart',
            'protocolUsageChart', 'highRiskAnalysisChart', 'dataEntryPatternsChart',
            'riskTrendChart', 'calcMethodEffectivenessChart', 'diseaseSeverityChart',
            'riskPerProtocolChart'
        ];

        chartIds.forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas && this[chartId]) { // Only add context menu if canvas exists and context is not null
                canvas.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showChartContextMenu(e, chartId);
                });
            }
        });

        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            // Only hide if clicking outside the context menu
            const contextMenu = document.getElementById('chartContextMenu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                this.hideChartContextMenu();
            }
        });

        // Reset context when window loses focus
        window.addEventListener('blur', () => {
            this.resetChartContext();
        });

        // Reset context on page unload
        window.addEventListener('beforeunload', () => {
            this.resetChartContext();
        });
    }

    showChartContextMenu(event, chartId) {
        // Validate inputs
        if (!event || !chartId) {
            console.warn('Invalid context menu parameters:', { event, chartId });
            return;
        }

        const contextMenu = document.getElementById('chartContextMenu');
        if (!contextMenu) {
            console.warn('Context menu element not found');
            return;
        }

        const rect = event.target.getBoundingClientRect();

        // Position context menu near cursor
        let x = event.clientX;
        let y = event.clientY;

        // Adjust position if menu would go off-screen
        if (x + 200 > window.innerWidth) x = window.innerWidth - 210;
        if (y + 200 > window.innerHeight) y = window.innerHeight - 210;

        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';

        // Store chart info directly on the context menu element
        contextMenu.setAttribute('data-chart-id', chartId);
        contextMenu.setAttribute('data-click-x', event.offsetX);
        contextMenu.setAttribute('data-click-y', event.offsetY);

        // Set a flag to indicate the menu is properly opened
        contextMenu.setAttribute('data-valid-context', 'true');
    }

    hideChartContextMenu() {
        const contextMenu = document.getElementById('chartContextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
            // Clear all data attributes
            contextMenu.removeAttribute('data-chart-id');
            contextMenu.removeAttribute('data-click-x');
            contextMenu.removeAttribute('data-click-y');
            contextMenu.removeAttribute('data-valid-context');
        }
        this.currentChartInfo = null;
    }

    // Reset context when window loses focus or other events
    resetChartContext() {
        this.currentChartInfo = null;
        this.hideChartContextMenu();
    }

    drillDownFromChart(action) {
        // Get chart context from the context menu element
        const contextMenu = document.getElementById('chartContextMenu');
        if (!contextMenu) {
            console.warn('Context menu not found for drill-down action:', action);
            return;
        }

        // Check if context menu is properly opened
        if (contextMenu.getAttribute('data-valid-context') !== 'true') {
            console.warn('Context menu not properly opened for drill-down action:', action);
            this.hideChartContextMenu();
            return;
        }

        const chartId = contextMenu.getAttribute('data-chart-id');
        if (!chartId) {
            console.warn('No chart ID found in context menu for drill-down action:', action);
            this.hideChartContextMenu();
            return;
        }

        // Validate that the chart still exists
        const chart = this.charts[chartId.replace('Chart', 'Chart')];
        if (!chart) {
            console.warn('Chart no longer exists for drill-down action:', action, chartId);
            this.hideChartContextMenu();
            return;
        }

        this.hideChartContextMenu();

        try {
            switch (action) {
                case 'viewDetails':
                    this.showChartDetails(chartId);
                    break;
                case 'filterData':
                    this.filterDataByChartSelection(chartId);
                    break;
                case 'exportData':
                    this.exportChartData(chartId);
                    break;
                case 'relatedRecords':
                    this.showRelatedRecords(chartId);
                    break;
                case 'compareTrends':
                    this.compareChartTrends(chartId);
                    break;
                default:
                    console.warn('Unknown drill-down action:', action);
            }
        } catch (error) {
            console.error('Error in drill-down action:', action, error);
            this.showDrillDownModal('Drill-Down Error', `
                <div class="drill-down-details">
                    <p><strong>An error occurred while processing your request.</strong></p>
                    <p>Please try right-clicking on the chart again and selecting a different option.</p>
                </div>
            `);
        }
    }

    showChartDetails(chartId) {
        try {
            if (!chartId) {
                console.warn('No chart ID provided for details');
                return;
            }

            const chart = this.charts[chartId.replace('Chart', 'Chart')];
            if (!chart) {
                console.warn('Chart not found:', chartId);
                return;
            }

            let details = '';
            let title = '';

            switch (chartId) {
                case 'diseaseChart':
                    title = 'Disease Distribution Details';
                    details = this.getDiseaseChartDetails();
                    break;
                case 'riskChart':
                    title = 'Risk Rating Distribution Details';
                    details = this.getRiskChartDetails();
                    break;
                case 'peoplePerConditionChart':
                    title = 'People per Condition Details';
                    details = this.getPeoplePerConditionDetails();
                    break;
                case 'calculationTypeChart':
                    title = 'Calculation Types per Risk Rating Details';
                    details = this.getCalculationTypeChartDetails();
                    break;
                case 'protocolUsageChart':
                    title = 'Protocol Usage Details';
                    details = this.getProtocolUsageDetails();
                    break;
                case 'highRiskAnalysisChart':
                    title = 'High Risk Patient Analysis Details';
                    details = this.getHighRiskAnalysisDetails();
                    break;
                case 'riskPerProtocolChart':
                    title = 'Risk Rating per Protocol Details';
                    details = this.getRiskPerProtocolDetails();
                    break;
                default:
                    title = 'Chart Details';
                    details = this.getGenericChartDetails(chartId);
            }

            this.showDrillDownModal(title, details);
        } catch (error) {
            console.error('Error showing chart details:', error);
            this.showDrillDownModal('Error', `
                <div class="drill-down-details">
                    <p><strong>An error occurred while loading chart details.</strong></p>
                    <p>Please try again or contact support if the problem persists.</p>
                </div>
            `);
        }
    }

    getDiseaseChartDetails() {
        const data = this.getDiseaseDistribution();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((disease, index) => {
            const count = data.data[index];
            const percentage = ((count / data.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            details += `
                <div class="detail-row">
                    <span class="detail-label">${disease}</span>
                    <span class="detail-value">${count} patients (${percentage}%)</span>
                </div>
            `;
        });

        details += '</div>';
        return details;
    }

    getRiskChartDetails() {
        const data = this.getRiskDistribution();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((risk, index) => {
            const count = data.data[index];
            const percentage = ((count / data.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            details += `
                <div class="detail-row">
                    <span class="detail-label">${risk}</span>
                    <span class="detail-value">${count} patients (${percentage}%)</span>
                </div>
            `;
        });

        details += '</div>';
        return details;
    }

    getPeoplePerConditionDetails() {
        const data = this.getPeoplePerConditionData();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((condition, index) => {
            const count = data.data[index];
            details += `
                <div class="detail-row">
                    <span class="detail-label">${condition}</span>
                    <span class="detail-value">${count} patients</span>
                </div>
            `;
        });

        details += '</div>';
        return details;
    }

    getCalculationTypeChartDetails() {
        const data = this.getCalculationTypeData();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((riskLevel, index) => {
            details += `<h5>${riskLevel}</h5>`;
            data.datasets.forEach(dataset => {
                const count = dataset.data[index];
                if (count > 0) {
                    details += `
                        <div class="detail-row">
                            <span class="detail-label">${dataset.label}</span>
                            <span class="detail-value">${count} cases</span>
                        </div>
                    `;
                }
            });
        });

        details += '</div>';
        return details;
    }

    getProtocolUsageDetails() {
        const data = this.getProtocolUsageData();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((protocol, index) => {
            const count = data.data[index];
            details += `
                <div class="detail-row">
                    <span class="detail-label">${protocol}</span>
                    <span class="detail-value">${count} records</span>
                </div>
            `;
        });

        details += '</div>';
        return details;
    }

    getHighRiskAnalysisDetails() {
        const data = this.getHighRiskAnalysisData();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((calcType, index) => {
            const count = data.data[index];
            details += `
                <div class="detail-row">
                    <span class="detail-label">${calcType}</span>
                    <span class="detail-value">${count} high-risk cases</span>
                </div>
            `;
        });

        details += '</div>';
        return details;
    }

    getRiskPerProtocolDetails() {
        const data = this.getRiskPerProtocolData();
        let details = '<div class="drill-down-details">';

        data.labels.forEach((protocol, index) => {
            details += `<h5>${protocol}</h5>`;
            data.datasets.forEach(dataset => {
                const count = dataset.data[index];
                if (count > 0) {
                    const percentage = ((count / data.datasets.reduce((total, ds) => total + ds.data[index], 0)) * 100).toFixed(1);
                    details += `
                        <div class="detail-row">
                            <span class="detail-label">${dataset.label}</span>
                            <span class="detail-value">${count} patients (${percentage}%)</span>
                        </div>
                    `;
                }
            });
        });

        details += '</div>';
        return details;
    }

    getGenericChartDetails(chartId) {
        const chart = this.charts[chartId.replace('Chart', 'Chart')];
        if (!chart) return '<p>No data available</p>';

        let details = '<div class="drill-down-details">';
        details += '<p>Chart Type: ' + chart.config.type + '</p>';
        details += '<p>Data Points: ' + chart.data.labels.length + '</p>';
        details += '</div>';

        return details;
    }

    filterDataByChartSelection(chartId) {
        // This would filter the main data table based on chart selection
        // For now, show a message
        this.showDrillDownModal('Filter Data', `
            <div class="drill-down-details">
                <p><strong>Filter functionality would be implemented here</strong></p>
                <p>This would filter the main data table to show only records related to the selected chart item.</p>
            </div>
        `);
    }

    exportChartData(chartId) {
        try {
            if (!chartId) {
                console.warn('No chart ID provided for export');
                return;
            }

            const chart = this.charts[chartId.replace('Chart', 'Chart')];
            if (!chart) {
                console.warn('Chart not found for export:', chartId);
                return;
            }

            if (!chart.data || !chart.data.labels || !chart.data.datasets) {
                console.warn('Chart data not available for export:', chartId);
                return;
            }

            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += chart.data.labels.join(',') + '\n';

            // Handle multiple datasets
            if (chart.data.datasets.length > 1) {
                // For multi-dataset charts, create multiple columns
                const maxLength = Math.max(...chart.data.datasets.map(d => d.data.length));
                for (let i = 0; i < maxLength; i++) {
                    const row = chart.data.datasets.map(d => d.data[i] || '').join(',');
                    csvContent += row + '\n';
                }
            } else {
                csvContent += chart.data.datasets[0].data.join(',') + '\n';
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', chartId + '_data.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showDrillDownModal('Export Complete', `
                <div class="drill-down-details">
                    <p><strong>Chart data exported successfully!</strong></p>
                    <p>The CSV file has been downloaded to your default download folder.</p>
                </div>
            `);
        } catch (error) {
            console.error('Error exporting chart data:', error);
            this.showDrillDownModal('Export Error', `
                <div class="drill-down-details">
                    <p><strong>An error occurred while exporting chart data.</strong></p>
                    <p>Please try again or contact support if the problem persists.</p>
                </div>
            `);
        }
    }

    showRelatedRecords(chartId) {
        // This would show related records in the main data table
        this.showDrillDownModal('Related Records', `
            <div class="drill-down-details">
                <p><strong>Related records functionality would be implemented here</strong></p>
                <p>This would highlight or filter records in the main data table that are related to the selected chart item.</p>
            </div>
        `);
    }

    compareChartTrends(chartId) {
        this.showDrillDownModal('Compare Trends', `
            <div class="drill-down-details">
                <p><strong>Trend comparison functionality would be implemented here</strong></p>
                <p>This would allow you to compare trends across different time periods or compare this chart with other related charts.</p>
            </div>
        `);
    }

    showDrillDownModal(title, content) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = content;
        this.drillDownModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RxReportingApp();
});

// Add CSS for drill-down timeline
const style = document.createElement('style');
style.textContent = `
    .risk-timeline {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 0.5rem;
    }

    .timeline-item {
        display: flex;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .timeline-item:last-child {
        border-bottom: none;
    }

    .timeline-date {
        font-size: 0.8rem;
        color: #666;
        min-width: 100px;
    }

    .timeline-content {
        flex: 1;
    }

    .btn-small {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style);
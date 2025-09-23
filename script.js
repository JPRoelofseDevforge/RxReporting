// RxReporting Platform - Main JavaScript
class RxReportingApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.charts = {};

        // Chart-based filtering properties
        this.chartFilters = new Map(); // Store active chart-based filters
        this.chartElementData = null; // Store clicked chart element data

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
            'riskPerProtocolChartType', 'highRiskDiabetesChartType'
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

    // Method to handle data updates and maintain chart filters
    updateDataAndMaintainFilters(newData) {
        this.data = newData;
        this.saveDataToStorage();

        // Clear chart filters since the underlying data has changed
        this.clearAllChartFilters();

        // Reinitialize dashboard with new data
        this.initializeDashboard();
    }

    // Test method to verify chart filtering functionality
    testChartFiltering() {
        console.log('=== Chart Filtering Test ===');
        console.log('Active chart filters:', this.chartFilters.size);
        console.log('Chart element data:', this.chartElementData);

        // Test with sample data if available
        if (this.data.length > 0) {
            console.log('Sample data available:', this.data.length, 'records');

            // Test disease filtering
            const sampleDisease = this.data.find(row => row.DiseaseProtocolName)?.DiseaseProtocolName;
            if (sampleDisease) {
                console.log('Testing disease filter:', sampleDisease);
                const testFilter = {
                    chartId: 'diseaseChart',
                    chartType: 'pie',
                    elementType: 'slice',
                    elementLabel: sampleDisease,
                    elementValue: 1,
                    filterField: 'DiseaseProtocolName',
                    filterValue: sampleDisease,
                    description: `Disease: ${sampleDisease}`
                };

                this.chartFilters.set('diseaseChart', testFilter);
                this.applyChartFilters();
                console.log('Filtered data count:', this.filteredData.length);
            }
        }

        console.log('=== Test Complete ===');
    }

    // Test method to verify chart element detection and context menu functionality
    testChartElementDetection() {
        console.log('=== Chart Element Detection Test ===');

        // Test each chart type
        const testCharts = ['diseaseChart', 'riskChart', 'peoplePerConditionChart'];

        testCharts.forEach(chartId => {
            const chart = this.charts[chartId.replace('Chart', 'Chart')];
            if (chart && chart.data && chart.data.labels && chart.data.labels.length > 0) {
                console.log(`Testing ${chartId} (${chart.config.type})`);

                // Simulate click on first element
                const mockEvent = {
                    target: chart.canvas,
                    offsetX: chart.config.type === 'pie' ? 150 : 50,
                    offsetY: chart.config.type === 'pie' ? 100 : 200
                };

                // Trigger the click event
                chart.canvas.dispatchEvent(new MouseEvent('click', mockEvent));

                // Check if element data was captured
                if (this.chartElementData && this.chartElementData.chartId === chartId) {
                    console.log(`✅ ${chartId} element detection: PASS`);
                    console.log(`   Detected: ${this.chartElementData.label} (${this.chartElementData.elementType})`);

                    // Test context menu functionality
                    this.showChartContextMenu(mockEvent, chartId);

                    const contextMenu = document.getElementById('chartContextMenu');
                    if (contextMenu && contextMenu.style.display === 'block') {
                        const elementLabel = contextMenu.getAttribute('data-element-label');
                        if (elementLabel) {
                            console.log(`✅ ${chartId} context menu: PASS`);
                            console.log(`   Context menu data: ${elementLabel}`);
                        } else {
                            console.log(`❌ ${chartId} context menu: FAIL - No element data in menu`);
                        }
                    } else {
                        console.log(`❌ ${chartId} context menu: FAIL - Menu not displayed`);
                    }

                    // Hide context menu
                    this.hideChartContextMenu();
                } else {
                    console.log(`❌ ${chartId} element detection: FAIL - No element data captured`);
                }
            } else {
                console.log(`⚠️ ${chartId}: SKIP - Chart not available or no data`);
            }
        });

        console.log('=== Element Detection Test Complete ===');
    }

    // Test method to verify the right-click element detection fix
    testRightClickElementDetection() {
        console.log('=== Right-Click Element Detection Test ===');

        const testCharts = ['diseaseChart', 'riskChart', 'peoplePerConditionChart'];

        testCharts.forEach(chartId => {
            const chart = this.charts[chartId.replace('Chart', 'Chart')];
            if (chart && chart.data && chart.data.labels && chart.data.labels.length > 0) {
                console.log(`\nTesting right-click detection for ${chartId} (${chart.config.type})`);

                // Test multiple positions on the chart
                const testPositions = [
                    { x: 100, y: 100, description: 'Center-left' },
                    { x: 200, y: 150, description: 'Center' },
                    { x: 150, y: 200, description: 'Bottom-center' }
                ];

                testPositions.forEach((pos, index) => {
                    console.log(`  Position ${index + 1} (${pos.description}): ${pos.x}, ${pos.y}`);

                    // Create mock right-click event
                    const mockEvent = {
                        target: chart.canvas,
                        clientX: pos.x + chart.canvas.getBoundingClientRect().left,
                        clientY: pos.y + chart.canvas.getBoundingClientRect().top,
                        preventDefault: () => {}
                    };

                    // Test the element detection
                    const canvasPosition = {
                        x: pos.x,
                        y: pos.y
                    };

                    const elementData = this.getChartElementDataAtPosition(chart, canvasPosition);

                    if (elementData) {
                        console.log(`    ✅ SUCCESS: ${elementData.label} (${elementData.elementType})`);
                    } else {
                        console.log(`    ❌ FAILED: No element detected`);
                    }
                });
            } else {
                console.log(`⚠️ ${chartId}: SKIP - Chart not available or no data`);
            }
        });

        console.log('\n=== Right-Click Element Detection Test Complete ===');
    }

    // Debug method to test context menu functionality
    debugContextMenu(chartId) {
        console.log('=== Context Menu Debug Test ===');

        if (!chartId) {
            console.log('No chart ID provided');
            return;
        }

        const chart = this.charts[chartId.replace('Chart', 'Chart')];
        if (!chart) {
            console.log(`Chart ${chartId} not found`);
            return;
        }

        console.log(`Testing context menu for ${chartId} (${chart.config.type})`);
        console.log('Chart data:', {
            hasLabels: chart.data.labels?.length > 0,
            labelCount: chart.data.labels?.length,
            hasDatasets: chart.data.datasets?.length > 0,
            datasetCount: chart.data.datasets?.length
        });

        // Test element detection at center position
        const centerX = chart.chartArea.left + chart.chartArea.width / 2;
        const centerY = chart.chartArea.top + chart.chartArea.height / 2;

        const elementData = this.getChartElementDataAtPosition(chart, { x: centerX, y: centerY });

        if (elementData) {
            console.log('✅ Element detected at center:', elementData);

            // Test context menu creation
            const mockEvent = {
                target: chart.canvas,
                clientX: centerX + chart.canvas.getBoundingClientRect().left,
                clientY: centerY + chart.canvas.getBoundingClientRect().top,
                preventDefault: () => {},
                offsetX: centerX,
                offsetY: centerY
            };

            this.showChartContextMenu(mockEvent, chartId);
            console.log('✅ Context menu should now be visible');
        } else {
            console.log('❌ No element detected at center position');
        }

        console.log('=== Debug Test Complete ===');
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

        // Clear any existing chart filters when dashboard is reinitialized
        this.clearAllChartFilters();
    }

    updateSummaryCards() {
        // Count unique people (not records)
        const uniquePeople = new Set();
        const uniqueProtocols = new Set();
        const highRiskPeople = new Set();
        const activePeople = new Set();
        const inactivePeople = new Set();

        this.data.forEach(row => {
            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
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
        // Apply chart filters first, then regular filters
        this.applyChartFilters();
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
        if (this.highRiskDiabetesChart) this.createHighRiskDiabetesChart();

        // Add chart event listeners after charts are created
        this.addChartEventListeners();
    }

    addChartEventListeners() {
        // Add event listeners to all existing charts
        Object.keys(this.charts).forEach(chartKey => {
            const chart = this.charts[chartKey];
            if (chart) {
                this.addChartClickListener(chart, chartKey);
            }
        });
    }

    addChartClickListener(chart, chartKey) {
        // Add click event listener to detect chart element clicks
        chart.canvas.addEventListener('click', (event) => {
            const canvasPosition = Chart.helpers.getRelativePosition(event, chart);

            // Get clicked element based on chart type
            let elementData = null;

            switch (chart.config.type) {
                case 'pie':
                case 'doughnut':
                    elementData = this.getPieChartElementData(chart, canvasPosition);
                    break;
                case 'bar':
                    elementData = this.getBarChartElementData(chart, canvasPosition);
                    break;
                case 'line':
                    elementData = this.getLineChartElementData(chart, canvasPosition);
                    break;
                default:
                    elementData = this.getGenericChartElementData(chart, canvasPosition);
            }

            if (elementData) {
                // Store the element data for context menu use
                this.chartElementData = {
                    chartId: chartKey,
                    chartType: chart.config.type,
                    ...elementData
                };

                console.log('Chart element clicked:', this.chartElementData);

                // Show a subtle visual feedback that element was detected
                this.showElementDetectionFeedback(chart.canvas, elementData);
            } else {
                // Clear element data if click didn't hit an element
                if (this.chartElementData && this.chartElementData.chartId === chartKey) {
                    this.chartElementData = null;
                }
            }
        });
    }

    showElementDetectionFeedback(canvas, elementData) {
        // Add a subtle visual indicator that the element was detected
        const ctx = canvas.getContext('2d');
        const originalStrokeStyle = ctx.strokeStyle;
        const originalLineWidth = ctx.lineWidth;

        // Draw a subtle highlight around the detected element
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // The specific highlight logic would depend on the chart type and element
        // For now, we'll just log that feedback was shown
        console.log('Element detection feedback shown for:', elementData.label);

        // Reset line dash after a short delay
        setTimeout(() => {
            ctx.setLineDash([]);
            ctx.strokeStyle = originalStrokeStyle;
            ctx.lineWidth = originalLineWidth;
        }, 500);
    }

    getPieChartElementData(chart, position) {
        const elements = chart.getElementsAtEventForMode(position, 'nearest', { intersect: true }, false);

        if (elements.length > 0) {
            const element = elements[0];
            const dataset = chart.data.datasets[element.datasetIndex];
            const dataIndex = element.index;

            return {
                label: chart.data.labels[dataIndex],
                value: dataset.data[dataIndex],
                index: dataIndex,
                datasetIndex: element.datasetIndex,
                elementType: 'slice'
            };
        }

        return null;
    }

    getBarChartElementData(chart, position) {
        const elements = chart.getElementsAtEventForMode(position, 'nearest', { intersect: true }, false);

        if (elements.length > 0) {
            const element = elements[0];
            const dataset = chart.data.datasets[element.datasetIndex];
            const dataIndex = element.index;

            return {
                label: chart.data.labels[dataIndex],
                value: dataset.data[dataIndex],
                index: dataIndex,
                datasetIndex: element.datasetIndex,
                elementType: 'bar'
            };
        }

        return null;
    }

    getLineChartElementData(chart, position) {
        const elements = chart.getElementsAtEventForMode(position, 'nearest', { intersect: true }, false);

        if (elements.length > 0) {
            const element = elements[0];
            const dataset = chart.data.datasets[element.datasetIndex];
            const dataIndex = element.index;

            return {
                label: chart.data.labels[dataIndex],
                value: dataset.data[dataIndex],
                index: dataIndex,
                datasetIndex: element.datasetIndex,
                elementType: 'point'
            };
        }

        return null;
    }

    getGenericChartElementData(chart, position) {
        const elements = chart.getElementsAtEventForMode(position, 'nearest', { intersect: true }, false);

        if (elements.length > 0) {
            const element = elements[0];
            const dataset = chart.data.datasets[element.datasetIndex];
            const dataIndex = element.index;

            return {
                label: chart.data.labels[dataIndex] || `Element ${dataIndex}`,
                value: dataset.data[dataIndex],
                index: dataIndex,
                datasetIndex: element.datasetIndex,
                elementType: 'element'
            };
        }

        return null;
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
        this.addChartEventListeners(); // Re-add event listeners
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateRiskChart(type) {
        this.createRiskChart(type);
        this.addChartEventListeners(); // Re-add event listeners
        this.initializeChartContextMenus(); // Re-add context menu functionality
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
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateRiskBreakdownChart(type) {
        this.createRiskBreakdownChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateCalculationTypeChart(type) {
        this.createCalculationTypeChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
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
        this.initializeChartContextMenus(); // Re-add context menu functionality
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
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateCommonCalcTypesChart(type) {
        this.createCommonCalcTypesChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateDiseaseCooccurrenceChart(type) {
        this.createDiseaseCooccurrenceChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateRiskByCalcTypeChart(type) {
        this.createRiskByCalcTypeChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateProtocolUsageChart(type) {
        this.createProtocolUsageChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateHighRiskAnalysisChart(type) {
        this.createHighRiskAnalysisChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateDataEntryPatternsChart(type) {
        this.createDataEntryPatternsChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateRiskTrendChart(type) {
        this.createRiskTrendChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateCalcMethodEffectivenessChart(type) {
        this.createCalcMethodEffectivenessChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
    }

    updateDiseaseSeverityChart(type) {
        this.createDiseaseSeverityChart(type);
        this.initializeChartContextMenus(); // Re-add context menu functionality
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
        this.initializeChartContextMenus(); // Re-add context menu functionality
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

        // Re-add event listeners and context menu functionality after all charts are recreated
        this.addChartEventListeners();
        this.initializeChartContextMenus();
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

        // Re-add event listeners and context menu functionality after charts are recreated
        this.addChartEventListeners();
        this.initializeChartContextMenus();
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
                // Remove existing context menu listener to avoid duplicates
                canvas.removeEventListener('contextmenu', this.showChartContextMenu);

                // Add new context menu listener with error handling
                const contextMenuHandler = (e) => {
                    try {
                        e.preventDefault();
                        this.showChartContextMenu(e, chartId);
                    } catch (error) {
                        console.error('Error in context menu handler:', error);
                    }
                };

                canvas.addEventListener('contextmenu', contextMenuHandler);

                // Store the handler reference for cleanup if needed
                canvas._contextMenuHandler = contextMenuHandler;

                console.log(`✅ Context menu initialized for ${chartId}`);
            } else {
                console.log(`⚠️ Context menu not initialized for ${chartId} - canvas or context missing`);
            }
        });

        console.log('Context menu initialization complete');
    }

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

    // Enhanced chart element detection with multiple fallback strategies
    getChartElementDataAtPosition(chart, position) {
        console.log('Attempting element detection at position:', position);

        try {
            // Strategy 1: Try the standard Chart.js method with different parameters
            let elements = chart.getElementsAtEventForMode(position, 'nearest', { intersect: true }, true);
            if (elements && elements.length > 0) {
                console.log('✅ Direct intersection detection succeeded:', elements.length, 'elements found');
                return this.extractElementData(chart, elements[0]);
            }

            // Strategy 2: Try with intersect: false (broader detection)
            elements = chart.getElementsAtEventForMode(position, 'nearest', { intersect: false }, true);
            if (elements && elements.length > 0) {
                console.log('✅ Broad intersection detection succeeded:', elements.length, 'elements found');
                return this.extractElementData(chart, elements[0]);
            }

            // Strategy 3: Try different interaction modes
            const modes = ['nearest', 'index', 'dataset', 'point', 'x'];
            for (const mode of modes) {
                try {
                    elements = chart.getElementsAtEventForMode(position, mode, { intersect: false }, true);
                    if (elements && elements.length > 0) {
                        console.log(`✅ Mode '${mode}' detection succeeded:`, elements.length, 'elements found');
                        return this.extractElementData(chart, elements[0]);
                    }
                } catch (error) {
                    console.log(`⚠️ Mode '${mode}' failed:`, error.message);
                }
            }

            // Strategy 4: Use Chart.js built-in tooltip detection
            const tooltip = chart.tooltip;
            if (tooltip && chart.data.labels && chart.data.labels.length > 0) {
                // Try to get the element at the position using tooltip logic
                const tooltipElement = this.getTooltipElementAtPosition(chart, position);
                if (tooltipElement) {
                    console.log('✅ Tooltip-based detection succeeded');
                    return tooltipElement;
                }
            }

            // Strategy 5: Manual calculation using chart metadata
            const manualElement = this.findNearestElementManually(chart, position);
            if (manualElement) {
                console.log('✅ Manual calculation detection succeeded');
                return manualElement;
            }

            console.log('❌ All element detection strategies failed');
            return null;
        } catch (error) {
            console.error('Error in element detection:', error);
            return null;
        }
    }

    // Extract element data from chart element
    extractElementData(chart, element) {
        const dataset = chart.data.datasets[element.datasetIndex];
        const dataIndex = element.index;

        if (!dataset || dataIndex === undefined || dataIndex === null) {
            console.warn('Invalid element data:', { element, dataset, dataIndex });
            return null;
        }

        return {
            label: chart.data.labels?.[dataIndex] || `Element ${dataIndex}`,
            value: dataset.data?.[dataIndex],
            index: dataIndex,
            datasetIndex: element.datasetIndex,
            elementType: this.getElementType(chart.config.type, element)
        };
    }

    // Get element type based on chart type and element properties
    getElementType(chartType, element) {
        switch (chartType) {
            case 'pie':
            case 'doughnut':
                return 'slice';
            case 'bar':
                return 'bar';
            case 'line':
                return 'point';
            default:
                return 'element';
        }
    }

    // Get element using tooltip detection logic
    getTooltipElementAtPosition(chart, position) {
        try {
            // Use Chart.js internal tooltip positioning logic
            const tooltip = chart.tooltip;
            if (!tooltip) return null;

            // Get all data points
            const datasets = chart.data.datasets;
            if (!datasets || datasets.length === 0) return null;

            // Find the closest data point to the position
            let closestElement = null;
            let minDistance = Infinity;

            datasets.forEach((dataset, datasetIndex) => {
                if (!dataset.data || dataset.data.length === 0) return;

                dataset.data.forEach((value, index) => {
                    // Get the pixel position of this data point
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta || !meta.data || !meta.data[index]) return;

                    const element = meta.data[index];
                    const elementX = element.x || 0;
                    const elementY = element.y || 0;

                    // Calculate distance from click position
                    const distance = Math.sqrt(
                        Math.pow(position.x - elementX, 2) +
                        Math.pow(position.y - elementY, 2)
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestElement = {
                            element: element,
                            datasetIndex: datasetIndex,
                            index: index,
                            distance: distance
                        };
                    }
                });
            });

            if (closestElement && minDistance < 50) { // 50px tolerance
                const dataset = datasets[closestElement.datasetIndex];
                const label = chart.data.labels?.[closestElement.index] || `Element ${closestElement.index}`;

                return {
                    label: label,
                    value: dataset.data[closestElement.index],
                    index: closestElement.index,
                    datasetIndex: closestElement.datasetIndex,
                    elementType: this.getElementType(chart.config.type, closestElement.element)
                };
            }

            return null;
        } catch (error) {
            console.error('Error in tooltip-based detection:', error);
            return null;
        }
    }

    // Manual fallback to find nearest element when Chart.js methods fail
    findNearestElementManually(chart, position) {
        try {
            const chartArea = chart.chartArea;
            if (!chartArea) return null;

            // For pie/doughnut charts, find the slice closest to the click position
            if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
                return this.findNearestPieSlice(chart, position);
            }

            // For bar charts, find the bar closest to the click position
            if (chart.config.type === 'bar') {
                return this.findNearestBar(chart, position);
            }

            // For line charts, find the point closest to the click position
            if (chart.config.type === 'line') {
                return this.findNearestLinePoint(chart, position);
            }

            return null;
        } catch (error) {
            console.error('Error in manual element detection:', error);
            return null;
        }
    }

    // Find nearest pie slice manually
    findNearestPieSlice(chart, position) {
        try {
            // Get chart metadata for accurate calculations
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || meta.data.length === 0) return null;

            const centerX = chart.chartArea.left + chart.chartArea.width / 2;
            const centerY = chart.chartArea.top + chart.chartArea.height / 2;
            const clickAngle = Math.atan2(position.y - centerY, position.x - centerX);

            // Normalize angle to 0-2π range
            const normalizedClickAngle = clickAngle < 0 ? clickAngle + 2 * Math.PI : clickAngle;

            let nearestIndex = 0;
            let nearestAngle = Infinity;

            // Check each slice's angle range
            meta.data.forEach((arc, index) => {
                if (arc && typeof arc.startAngle === 'number' && typeof arc.endAngle === 'number') {
                    let startAngle = arc.startAngle;
                    let endAngle = arc.endAngle;

                    // Handle cases where angles wrap around
                    if (startAngle > endAngle) {
                        endAngle += 2 * Math.PI;
                    }

                    // Check if click angle is within this slice's range
                    if (normalizedClickAngle >= startAngle && normalizedClickAngle <= endAngle) {
                        nearestIndex = index;
                        nearestAngle = 0; // Exact match
                        return; // Exit early for exact matches
                    }

                    // Calculate minimum distance to slice boundaries
                    const distances = [
                        Math.abs(normalizedClickAngle - startAngle),
                        Math.abs(normalizedClickAngle - endAngle),
                        Math.abs(normalizedClickAngle - (startAngle - 2 * Math.PI)), // Wrap around
                        Math.abs(normalizedClickAngle - (endAngle + 2 * Math.PI))   // Wrap around
                    ];

                    const minDistance = Math.min(...distances);
                    if (minDistance < nearestAngle) {
                        nearestAngle = minDistance;
                        nearestIndex = index;
                    }
                }
            });

            // Only return if reasonably close (within 45 degrees)
            if (nearestAngle < Math.PI / 4) {
                return {
                    label: chart.data.labels?.[nearestIndex] || `Slice ${nearestIndex}`,
                    value: chart.data.datasets[0]?.data?.[nearestIndex],
                    index: nearestIndex,
                    datasetIndex: 0,
                    elementType: 'slice'
                };
            }

            return null;
        } catch (error) {
            console.error('Error in pie slice detection:', error);
            return null;
        }
    }

    // Find nearest bar manually
    findNearestBar(chart, position) {
        try {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;

            if (!xScale || !yScale) return null;

            // Get chart metadata for accurate bar positions
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || meta.data.length === 0) return null;

            let nearestIndex = 0;
            let nearestDistance = Infinity;

            meta.data.forEach((bar, index) => {
                if (bar && typeof bar.x === 'number') {
                    // Calculate distance from click position to bar center
                    const barX = bar.x;
                    const barY = bar.y || chart.chartArea.bottom; // Use chart bottom if no y value
                    const distance = Math.sqrt(
                        Math.pow(position.x - barX, 2) +
                        Math.pow(position.y - barY, 2)
                    );

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = index;
                    }
                }
            });

            // Check if click is within reasonable range of the bar (100px tolerance)
            if (nearestDistance < 100) {
                return {
                    label: chart.data.labels?.[nearestIndex] || `Bar ${nearestIndex}`,
                    value: chart.data.datasets[0]?.data?.[nearestIndex],
                    index: nearestIndex,
                    datasetIndex: 0,
                    elementType: 'bar'
                };
            }

            return null;
        } catch (error) {
            console.error('Error in bar detection:', error);
            return null;
        }
    }

    // Find nearest line point manually
    findNearestLinePoint(chart, position) {
        try {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;

            if (!xScale || !yScale) return null;

            // Get chart metadata for accurate point positions
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || meta.data.length === 0) return null;

            let nearestIndex = 0;
            let nearestDistance = Infinity;

            meta.data.forEach((point, index) => {
                if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                    // Calculate distance from click position to point
                    const distance = Math.sqrt(
                        Math.pow(position.x - point.x, 2) +
                        Math.pow(position.y - point.y, 2)
                    );

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = index;
                    }
                }
            });

            // Check if click is within reasonable range of the point (40px tolerance)
            if (nearestDistance < 40) {
                return {
                    label: chart.data.labels?.[nearestIndex] || `Point ${nearestIndex}`,
                    value: chart.data.datasets[0]?.data?.[nearestIndex],
                    index: nearestIndex,
                    datasetIndex: 0,
                    elementType: 'point'
                };
            }

            return null;
        } catch (error) {
            console.error('Error in line point detection:', error);
            return null;
        }
    }

    // Get fallback element data when right-click detection fails
    getFallbackElementData(chart) {
        try {
            if (!chart || !chart.data) return null;

            // Try to get the first available element from the chart
            if (chart.data.labels && chart.data.labels.length > 0) {
                const firstLabel = chart.data.labels[0];
                const firstValue = chart.data.datasets?.[0]?.data?.[0];

                if (firstLabel !== undefined && firstValue !== undefined) {
                    return {
                        label: firstLabel,
                        value: firstValue,
                        index: 0,
                        datasetIndex: 0,
                        elementType: this.getElementType(chart.config.type, { index: 0, datasetIndex: 0 })
                    };
                }
            }

            // If no labels, try to create a generic element
            if (chart.data.datasets?.[0]?.data?.length > 0) {
                return {
                    label: `Element 0`,
                    value: chart.data.datasets[0].data[0],
                    index: 0,
                    datasetIndex: 0,
                    elementType: this.getElementType(chart.config.type, { index: 0, datasetIndex: 0 })
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting fallback element data:', error);
            return null;
        }
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

        // Get the canvas position for element detection
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const canvasPosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        // Try to get chart element data at the right-click position
        const chart = this.charts[chartId.replace('Chart', 'Chart')];
        let elementData = null;

        if (chart) {
            // Enhanced element detection with multiple fallback strategies
            elementData = this.getChartElementDataAtPosition(chart, canvasPosition);

            // Debug logging for element detection
            console.log('Right-click element detection:', {
                chartId,
                chartType: chart.config.type,
                position: canvasPosition,
                elementData,
                chartData: {
                    hasLabels: chart.data.labels?.length > 0,
                    labelCount: chart.data.labels?.length,
                    hasDatasets: chart.data.datasets?.length > 0,
                    datasetCount: chart.data.datasets?.length
                }
            });
        }

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

        // Store chart element data if available (either from recent click or right-click detection)
        if (elementData) {
            contextMenu.setAttribute('data-element-label', elementData.label || '');
            contextMenu.setAttribute('data-element-value', elementData.value || '');
            contextMenu.setAttribute('data-element-index', elementData.index || '');
            contextMenu.setAttribute('data-element-type', elementData.elementType || '');
            contextMenu.setAttribute('data-chart-type', chart ? chart.config.type : '');

            // Also update the global chartElementData for consistency
            this.chartElementData = {
                chartId: chartId,
                chartType: chart ? chart.config.type : '',
                ...elementData
            };

            console.log('✅ Element data successfully detected and stored:', elementData);
        } else {
            // Enhanced fallback mechanism
            console.log('⚠️ Right-click element detection failed, attempting fallbacks...');

            // Fallback 1: Use previously stored data for the same chart
            if (this.chartElementData && this.chartElementData.chartId === chartId) {
                console.log('📋 Using previously stored element data as fallback');
                contextMenu.setAttribute('data-element-label', this.chartElementData.label || '');
                contextMenu.setAttribute('data-element-value', this.chartElementData.value || '');
                contextMenu.setAttribute('data-element-index', this.chartElementData.index || '');
                contextMenu.setAttribute('data-element-type', this.chartElementData.elementType || '');
                contextMenu.setAttribute('data-chart-type', this.chartElementData.chartType || '');

                // Set a flag to indicate fallback was used
                contextMenu.setAttribute('data-fallback-used', 'true');
            } else {
                // Fallback 2: Try to get any element from the chart (first/last element)
                const fallbackElement = this.getFallbackElementData(chart);
                if (fallbackElement) {
                    console.log('📋 Using fallback element data (first available element)');
                    contextMenu.setAttribute('data-element-label', fallbackElement.label || '');
                    contextMenu.setAttribute('data-element-value', fallbackElement.value || '');
                    contextMenu.setAttribute('data-element-index', fallbackElement.index || '');
                    contextMenu.setAttribute('data-element-type', fallbackElement.elementType || '');
                    contextMenu.setAttribute('data-chart-type', chart ? chart.config.type : '');

                    // Set a flag to indicate fallback was used
                    contextMenu.setAttribute('data-fallback-used', 'true');
                } else {
                    console.warn('❌ No element data available - context menu will have limited functionality');
                    contextMenu.setAttribute('data-element-label', 'No element detected');
                    contextMenu.setAttribute('data-element-value', '');
                    contextMenu.setAttribute('data-element-index', '');
                    contextMenu.setAttribute('data-element-type', '');
                    contextMenu.setAttribute('data-chart-type', chart ? chart.config.type : '');

                    // Set a flag to indicate no element data
                    contextMenu.setAttribute('data-no-element-data', 'true');
                }
            }
        }

        // Set a flag to indicate the menu is properly opened
        contextMenu.setAttribute('data-valid-context', 'true');

        // Enhanced logging with detailed debugging information
        const contextMenuData = {
            chartId,
            chartType: chart ? chart.config.type : 'unknown',
            position: canvasPosition,
            elementData,
            fallbackUsed: contextMenu.getAttribute('data-fallback-used') === 'true',
            noElementData: contextMenu.getAttribute('data-no-element-data') === 'true',
            canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
            chartData: chart ? {
                hasLabels: chart.data.labels?.length > 0,
                labelCount: chart.data.labels?.length,
                hasDatasets: chart.data.datasets?.length > 0,
                datasetCount: chart.data.datasets?.length
            } : null
        };

        console.log('Context menu opened for chart:', chartId);
        console.log('Element detection result:', elementData ? 'SUCCESS' : 'FAILED');
        console.log('Context menu data:', contextMenuData);

        // Show user-friendly message if no element data was detected
        if (!elementData && !contextMenu.getAttribute('data-fallback-used')) {
            console.warn('⚠️ No chart element detected at right-click position. Context menu will have limited functionality.');
        }
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
            contextMenu.removeAttribute('data-element-label');
            contextMenu.removeAttribute('data-element-value');
            contextMenu.removeAttribute('data-element-index');
            contextMenu.removeAttribute('data-element-type');
            contextMenu.removeAttribute('data-chart-type');
        }
        this.currentChartInfo = null;
        // Don't clear chartElementData immediately - it might be needed for filter operations
        // It will be cleared when a new chart element is clicked or when context is reset
    }

    // Reset context when window loses focus or other events
    resetChartContext() {
        this.currentChartInfo = null;
        this.chartElementData = null; // Clear chart element data
        this.hideChartContextMenu();
    }

    // Clear chart element data when starting a new operation
    clearChartElementData() {
        this.chartElementData = null;
        console.log('Chart element data cleared');
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

        // For filterData action, don't hide the context menu immediately
        // as the filter method needs to access the context menu data
        const shouldHideMenu = action !== 'filterData';

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
        } finally {
            // Hide the context menu after the action is complete (except for filterData)
            if (shouldHideMenu) {
                this.hideChartContextMenu();
            }
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
        try {
            // Get chart element data from context menu
            const contextMenu = document.getElementById('chartContextMenu');
            if (!contextMenu) {
                console.warn('Context menu not found for filtering');
                this.showDrillDownModal('Filter Error', `
                    <div class="drill-down-details">
                        <p><strong>Context menu not found</strong></p>
                        <p>Please right-click on a chart element again and try the filter option.</p>
                    </div>
                `);
                return;
            }

            // Check if context menu is properly opened
            if (contextMenu.getAttribute('data-valid-context') !== 'true') {
                console.warn('Context menu not properly opened for filtering');
                this.showDrillDownModal('Filter Error', `
                    <div class="drill-down-details">
                        <p><strong>No chart element selected</strong></p>
                        <p>Please right-click on a chart element (slice, bar, or point) before using the filter option.</p>
                    </div>
                `);
                return;
            }

            const elementLabel = contextMenu.getAttribute('data-element-label');
            const elementValue = contextMenu.getAttribute('data-element-value');
            const elementIndex = contextMenu.getAttribute('data-element-index');
            const elementType = contextMenu.getAttribute('data-element-type');
            const chartType = contextMenu.getAttribute('data-chart-type');

            // Enhanced validation with more specific error messages
            if (!elementLabel || elementLabel.trim() === '' || elementLabel === 'No element detected') {
                console.warn('No element label found in context menu:', { elementLabel, chartId });

                let errorMessage = '';
                if (contextMenu.getAttribute('data-no-element-data') === 'true') {
                    errorMessage = `
                        <div class="drill-down-details">
                            <p><strong>No chart element detected</strong></p>
                            <p>The right-click position did not intersect with any chart element.</p>
                            <p><strong>Troubleshooting steps:</strong></p>
                            <ul>
                                <li>Try right-clicking closer to the center of chart elements</li>
                                <li>Try left-clicking on an element first, then right-clicking</li>
                                <li>Ensure you're clicking on visible chart elements (slices, bars, points)</li>
                            </ul>
                            <p><strong>Debug Info:</strong> Chart: ${this.getChartDisplayName(chartId)}, Position: ${contextMenu.getAttribute('data-click-x')}, ${contextMenu.getAttribute('data-click-y')}</p>
                        </div>
                    `;
                } else if (contextMenu.getAttribute('data-fallback-used') === 'true') {
                    errorMessage = `
                        <div class="drill-down-details">
                            <p><strong>Using fallback element data</strong></p>
                            <p>The right-click didn't detect a specific element, but fallback data is available.</p>
                            <p><strong>Element:</strong> ${elementLabel}</p>
                            <p>You can still use the filter option with this fallback data.</p>
                        </div>
                    `;
                } else {
                    errorMessage = `
                        <div class="drill-down-details">
                            <p><strong>No chart element detected</strong></p>
                            <p>Please make sure you right-clicked directly on a chart element (slice, bar, or point).</p>
                            <p><strong>Debug Info:</strong> Chart: ${this.getChartDisplayName(chartId)}, Position: ${contextMenu.getAttribute('data-click-x')}, ${contextMenu.getAttribute('data-click-y')}</p>
                        </div>
                    `;
                }

                this.showDrillDownModal('Filter Error', errorMessage);
                return;
            }

            // Validate chart exists
            const chart = this.charts[chartId.replace('Chart', 'Chart')];
            if (!chart) {
                console.warn('Chart not found for filtering:', chartId);
                this.showDrillDownModal('Filter Error', `
                    <div class="drill-down-details">
                        <p><strong>Chart not found</strong></p>
                        <p>The chart may have been recreated. Please try right-clicking on the chart element again.</p>
                    </div>
                `);
                return;
            }

            // Create filter based on chart type and element
            const filterInfo = this.createChartFilter(chartId, elementLabel, elementValue, elementIndex, elementType, chartType);

            if (!filterInfo) {
                console.warn('Could not create filter for:', { chartId, elementLabel, elementType });
                this.showDrillDownModal('Filter Error', `
                    <div class="drill-down-details">
                        <p><strong>Unsupported chart element</strong></p>
                        <p>This type of chart element cannot be used for filtering. Please try a different chart or element.</p>
                    </div>
                `);
                return;
            }

            // Add to active chart filters
            this.chartFilters.set(chartId, filterInfo);

            // Apply the filter
            this.applyChartFilters();

            // Show success message with more detailed information
            this.showDrillDownModal('Filter Applied Successfully', `
                <div class="drill-down-details">
                    <p><strong>✅ Filter applied successfully!</strong></p>
                    <p><strong>Chart:</strong> ${this.getChartDisplayName(chartId)}</p>
                    <p><strong>Filter:</strong> ${filterInfo.description}</p>
                    <p><strong>Records found:</strong> ${this.filteredData.length} (filtered from ${this.data.length} total)</p>
                    <div class="filter-actions">
                        <button class="btn btn-secondary btn-small" onclick="app.clearChartFilter('${chartId}')">
                            <i class="fas fa-times"></i> Clear This Filter
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="app.clearAllChartFilters()">
                            <i class="fas fa-times-circle"></i> Clear All Filters
                        </button>
                    </div>
                </div>
            `);

            // Update active filter indicators
            this.updateActiveFilterIndicators();

            // Hide the context menu now that filtering is complete
            this.hideChartContextMenu();

            console.log('Chart filter applied successfully:', filterInfo);

        } catch (error) {
            console.error('Error applying chart filter:', error);
            this.showDrillDownModal('Filter Error', `
                <div class="drill-down-details">
                    <p><strong>An error occurred while applying the filter.</strong></p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Please try again or contact support if the problem persists.</p>
                </div>
            `);
            // Hide the context menu even if there was an error
            this.hideChartContextMenu();
        }
    }

    createChartFilter(chartId, elementLabel, elementValue, elementIndex, elementType, chartType) {
        let filterField = '';
        let filterValue = '';
        let description = '';

        switch (chartId) {
            case 'diseaseChart':
            case 'diseaseCooccurrenceChart':
            case 'diseaseSeverityChart':
                filterField = 'DiseaseProtocolName';
                filterValue = elementLabel;
                description = `Disease: ${elementLabel}`;
                break;

            case 'riskChart':
            case 'riskBreakdownChart':
            case 'highRiskAnalysisChart':
                filterField = 'RiskRatingName';
                filterValue = elementLabel;
                description = `Risk Level: ${elementLabel}`;
                break;

            case 'calculationTypeChart':
            case 'calculationTypePerDiseaseChart':
            case 'commonCalcTypesChart':
            case 'riskByCalcTypeChart':
            case 'calcMethodEffectivenessChart':
                filterField = 'RiskCalculationTypeName';
                filterValue = elementLabel;
                description = `Calculation Type: ${elementLabel}`;
                break;

            case 'protocolUsageChart':
            case 'riskPerProtocolChart':
                filterField = 'DiseaseProtocolName';
                filterValue = elementLabel;
                description = `Protocol: ${elementLabel}`;
                break;

            case 'peoplePerConditionChart':
                filterField = 'DiseaseProtocolName';
                filterValue = elementLabel;
                description = `Condition: ${elementLabel}`;
                break;

            case 'recordsOverTimeChart':
            case 'dataEntryPatternsChart':
            case 'riskTrendChart':
                // For time-based charts, filter by date range or specific period
                if (elementLabel.includes('-')) {
                    filterField = 'DateCalculated';
                    filterValue = elementLabel; // YYYY-MM format
                    description = `Time Period: ${elementLabel}`;
                } else {
                    return null; // Cannot filter by time period
                }
                break;

            default:
                console.warn('Unknown chart type for filtering:', chartId);
                return null;
        }

        return {
            chartId,
            chartType,
            elementType,
            elementLabel,
            elementValue,
            filterField,
            filterValue,
            description
        };
    }

    applyChartFilters() {
        // Start with all data
        let filtered = [...this.data];

        // Apply existing search and filter criteria first
        const searchTerm = this.searchInput.value.toLowerCase();
        const diseaseFilter = this.filterDisease.value;
        const riskFilter = this.filterRisk.value;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(row =>
                Object.values(row).some(value =>
                    value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }

        // Apply disease filter
        if (diseaseFilter) {
            filtered = filtered.filter(row => row.DiseaseProtocolName === diseaseFilter);
        }

        // Apply risk filter
        if (riskFilter) {
            filtered = filtered.filter(row => row.RiskRatingName === riskFilter);
        }

        // Apply chart-based filters
        this.chartFilters.forEach((filterInfo, chartId) => {
            filtered = filtered.filter(row => {
                const rowValue = row[filterInfo.filterField];
                return rowValue === filterInfo.filterValue;
            });
        });

        // Update filtered data and refresh table
        this.filteredData = filtered;
        this.currentPage = 1;
        this.renderTable();
    }

    clearChartFilter(chartId) {
        if (this.chartFilters.has(chartId)) {
            this.chartFilters.delete(chartId);
            this.applyChartFilters();
            this.updateActiveFilterIndicators();

            // Show confirmation
            this.showSuccessMessage(`Filter for ${this.getChartDisplayName(chartId)} cleared`);
        }
    }

    clearAllChartFilters() {
        this.chartFilters.clear();
        this.applyChartFilters();
        this.updateActiveFilterIndicators();

        // Show confirmation
        this.showSuccessMessage('All chart filters cleared');
    }

    getChartDisplayName(chartId) {
        const displayNames = {
            'diseaseChart': 'Disease Distribution',
            'riskChart': 'Risk Rating Distribution',
            'peoplePerConditionChart': 'People per Condition',
            'riskBreakdownChart': 'Risk Rating Breakdown',
            'calculationTypeChart': 'Calculation Types per Risk Rating',
            'calculationTypePerDiseaseChart': 'Calculation Types per Disease',
            'recordsOverTimeChart': 'Records Over Time',
            'commonCalcTypesChart': 'Most Common Calculation Types',
            'diseaseCooccurrenceChart': 'Disease Co-occurrence',
            'riskByCalcTypeChart': 'Risk by Calculation Type',
            'protocolUsageChart': 'Protocol Usage Frequency',
            'highRiskAnalysisChart': 'High Risk Patient Analysis',
            'dataEntryPatternsChart': 'Data Entry Patterns',
            'riskTrendChart': 'Risk Trend Analysis',
            'calcMethodEffectivenessChart': 'Calculation Method Effectiveness',
            'diseaseSeverityChart': 'Disease Severity Patterns',
            'riskPerProtocolChart': 'Risk Rating per Protocol'
        };

        return displayNames[chartId] || chartId;
    }

    updateActiveFilterIndicators() {
        // Remove existing filter indicators
        const existingIndicators = document.querySelectorAll('.chart-filter-indicator');
        existingIndicators.forEach(indicator => indicator.remove());

        // Add filter indicators to chart containers
        this.chartFilters.forEach((filterInfo, chartId) => {
            const chartContainer = document.querySelector(`[onclick*="${chartId}"]`)?.closest('.chart-container');
            if (chartContainer) {
                const indicator = document.createElement('div');
                indicator.className = 'chart-filter-indicator';
                indicator.innerHTML = `
                    <span class="filter-badge">
                        <i class="fas fa-filter"></i>
                        ${filterInfo.description}
                        <button class="filter-remove" onclick="app.clearChartFilter('${chartId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `;

                // Add styles
                indicator.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 1000;
                    background: rgba(40, 167, 69, 0.9);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                `;

                const badgeStyle = `
                    background: rgba(40, 167, 69, 0.9);
                    color: white;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                `;

                const removeButtonStyle = `
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    font-size: 0.7rem;
                    opacity: 0.8;
                `;

                indicator.querySelector('.filter-badge').style.cssText = badgeStyle;
                indicator.querySelector('.filter-remove').style.cssText = removeButtonStyle;

                chartContainer.style.position = 'relative';
                chartContainer.appendChild(indicator);
            }
        });
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

// Add CSS for drill-down timeline and chart filter indicators
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

    .chart-filter-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        pointer-events: none;
    }

    .filter-badge {
        background: rgba(40, 167, 69, 0.9);
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        pointer-events: auto;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .filter-badge:hover {
        background: rgba(32, 135, 56, 0.9);
    }

    .filter-remove {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        font-size: 0.7rem;
        opacity: 0.8;
        margin-left: 3px;
    }

    .filter-remove:hover {
        opacity: 1;
    }

    .filter-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        flex-wrap: wrap;
    }

    .drill-down-details {
        line-height: 1.6;
    }

    .drill-down-details h5 {
        margin-top: 15px;
        margin-bottom: 8px;
        color: #333;
        font-size: 1rem;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .detail-label {
        font-weight: 500;
        color: #555;
    }

    .detail-value {
        color: #777;
        text-align: right;
    }
`;
document.head.appendChild(style);
/**
 * Main Application Module
 * Coordinates all modules and provides main app logic
 */

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

        // Initialize modules
        this.dataManager = new DataManager();
        this.chartManager = new ChartManager(this.dataManager);
        this.uiManager = new UIManager(this.dataManager, this.chartManager);
        this.filterManager = new FilterManager(this.dataManager, this.uiManager, this.chartManager);
        this.contextMenuManager = new ContextMenuManager(this.dataManager, this.chartManager, this.uiManager, this.filterManager);

        this.initializeElements();
        this.bindEvents();
        this.updateDataSourceDisplay(); // Initialize the display state
        this.loadStoredData();
    }

    initializeElements() {
        this.uiManager.initializeElements();
    }

    bindEvents() {
        // File upload events - only bind if elements exist
        if (this.uiManager.uploadBtn) this.uiManager.uploadBtn.addEventListener('click', () => this.uiManager.fileInput.click());
        if (this.uiManager.uploadBtnMain) this.uiManager.uploadBtnMain.addEventListener('click', () => this.uiManager.fileInput.click());
        if (this.uiManager.fileInput) this.uiManager.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Sample data events
        if (this.uiManager.loadSampleBtn) this.uiManager.loadSampleBtn.addEventListener('click', () => this.loadSampleData());

        // Data source selection events
        if (this.uiManager.uploadOption) this.uiManager.uploadOption.addEventListener('change', () => this.updateDataSourceDisplay());
        if (this.uiManager.sampleOption) this.uiManager.sampleOption.addEventListener('change', () => this.updateDataSourceDisplay());

        // Chart type changes - only bind for existing chart types
        const chartTypeElements = [
            'multipleDiseasesChartType', 'multipleDiseasesDetailedChartType', 'diseaseCombinationsChartType',
            'multipleDiseaseRiskChartType', 'multipleDiseaseSeverityChartType', 'diseaseChartType', 'riskChartType',
            'peoplePerConditionChartType', 'riskBreakdownChartType', 'calculationTypeChartType',
            'calculationTypePerDiseaseChartType', 'recordsOverTimeChartType', 'commonCalcTypesChartType',
            'diseaseCooccurrenceChartType', 'riskByCalcTypeChartType', 'protocolUsageChartType',
            'highRiskAnalysisChartType', 'dataEntryPatternsChartType', 'riskTrendChartType',
            'calcMethodEffectivenessChartType', 'diseaseSeverityChartType', 'riskPerProtocolChartType',
            'highRiskDiabetesChartType'
        ];

        chartTypeElements.forEach(chartTypeId => {
            const element = document.getElementById(chartTypeId);
            if (element) {
                element.addEventListener('change', (e) => {
                    const methodName = `update${chartTypeId.replace('ChartType', 'Chart')}`;
                    if (this.chartManager[methodName]) {
                        this.chartManager[methodName](e.target.value);
                    }
                });
            }
        });

        // Search and filter events
        this.uiManager.searchInput.addEventListener('input', () => this.applyFilters());
        this.uiManager.filterDisease.addEventListener('change', () => this.applyFilters());
        this.uiManager.filterRisk.addEventListener('change', () => this.applyFilters());

        // High risk table events
        if (this.uiManager.highRiskFilter) {
            this.uiManager.highRiskFilter.addEventListener('change', () => this.renderHighRiskTable());
        }
        if (this.uiManager.highRiskSort) {
            this.uiManager.highRiskSort.addEventListener('change', () => this.renderHighRiskTable());
        }
        if (this.uiManager.refreshHighRiskTable) {
            this.uiManager.refreshHighRiskTable.addEventListener('click', () => this.renderHighRiskTable());
        }

        // Pagination events
        this.uiManager.prevPageBtn.addEventListener('click', () => this.changePage(-1));
        this.uiManager.nextPageBtn.addEventListener('click', () => this.changePage(1));

        // Modal events
        this.uiManager.closeModal.addEventListener('click', () => this.hideModal());

        // Close modal when clicking outside
        this.uiManager.drillDownModal.addEventListener('click', (e) => {
            if (e.target === this.uiManager.drillDownModal) {
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
        this.contextMenuManager.initializeChartContextMenus();
        this.contextMenuManager.initializeGlobalEventListeners();
    }

    async handleFileUpload(event) {
        try {
            const data = await this.dataManager.handleFileUpload(event);
            if (data) {
                this.data = data;
                this.dataManager.saveDataToStorage();
                this.initializeDashboard();
                // Refresh charts with new data
                this.chartManager.refreshChartsWithData();
            }
        } catch (error) {
            // Error handling is done in dataManager
        }
    }

    async loadSampleData() {
        try {
            this.uiManager.showLoading('Loading sample data...');
            const data = await this.dataManager.loadSampleData();
            this.data = data;
            this.initializeDashboard();
            // Refresh charts with new data
            this.chartManager.refreshChartsWithData();
            this.uiManager.hideLoading();
            this.uiManager.showSuccessMessage('Successfully loaded sample data');
        } catch (error) {
            this.uiManager.hideLoading();
            // Error handling is done in dataManager
        }
    }

    updateDataSourceDisplay() {
        this.uiManager.updateDataSourceDisplay();
    }

    initializeDashboard() {
        this.uiManager.initializeDashboard();
    }

    applyFilters() {
        this.uiManager.applyFilters();
    }

    renderTable() {
        this.uiManager.renderTable();
    }

    renderHighRiskTable() {
        this.uiManager.renderHighRiskTable();
    }

    updatePagination() {
        this.uiManager.updatePagination();
    }

    changePage(direction) {
        this.uiManager.changePage(direction);
    }

    showDrillDown(index) {
        this.uiManager.showDrillDown(index);
    }

    showHighRiskMemberDrillDown(index) {
        const filter = this.uiManager.highRiskFilter ? this.uiManager.highRiskFilter.value : 'all';
        const sort = this.uiManager.highRiskSort ? this.uiManager.highRiskSort.value : 'risk_desc';

        const highRiskMembers = this.dataManager.getHighRiskMembers({ filter, sort });
        const member = highRiskMembers[index];

        if (!member) return;

        this.uiManager.showHighRiskMemberDrillDown(member);
    }

    hideModal() {
        this.uiManager.hideModal();
    }

    showLoading(message = 'Loading...') {
        this.uiManager.showLoading(message);
    }

    hideLoading() {
        this.uiManager.hideLoading();
    }

    // Fullscreen functionality
    toggleFullscreen(chartId) {
        this.chartManager.toggleFullscreen(chartId);
    }

    // Chart Context Menu Functionality
    showChartContextMenu(event, chartId) {
        this.contextMenuManager.showChartContextMenu(event, chartId);
    }

    hideChartContextMenu() {
        this.contextMenuManager.hideChartContextMenu();
    }

    resetChartContext() {
        this.contextMenuManager.resetChartContext();
    }

    clearChartElementData() {
        this.contextMenuManager.clearChartElementData();
    }

    drillDownFromChart(action) {
        this.contextMenuManager.drillDownFromChart(action);
    }

    // Method to handle data updates and maintain chart filters
    updateDataAndMaintainFilters(newData) {
        this.data = newData;
        this.dataManager.saveDataToStorage();

        // Clear chart filters since the underlying data has changed
        this.clearAllChartFilters();

        // Reinitialize dashboard with new data
        this.initializeDashboard();
    }

    // Test method to verify chart filtering functionality
    testChartFiltering() {
        this.filterManager.testChartFiltering();
    }

    // Test method to verify chart element detection and context menu functionality
    testChartElementDetection() {
        console.log('=== Chart Element Detection Test ===');

        // Test each chart type
        const testCharts = ['diseaseChart', 'riskChart', 'peoplePerConditionChart'];

        testCharts.forEach(chartId => {
            const chart = this.chartManager.getChart(chartId);
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
            const chart = this.chartManager.getChart(chartId);
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

                    const elementData = this.contextMenuManager.getChartElementDataAtPosition(chart, canvasPosition);

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

        const chart = this.chartManager.getChart(chartId);
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

        const elementData = this.contextMenuManager.getChartElementDataAtPosition(chart, { x: centerX, y: centerY });

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

    loadStoredData() {
        try {
            const data = this.dataManager.loadStoredData();
            if (data && data.length > 0) {
                this.data = data;
                this.initializeDashboard();
                // Refresh charts with stored data
                this.chartManager.refreshChartsWithData();
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    // Chart filter methods
    clearChartFilter(chartId) {
        if (this.filterManager.clearChartFilter(chartId)) {
            this.uiManager.showSuccessMessage(`Filter for ${this.filterManager.getChartDisplayName(chartId)} cleared`);
        }
    }

    clearAllChartFilters() {
        this.filterManager.clearAllChartFilters();
        this.uiManager.showSuccessMessage('All chart filters cleared');
    }

    // Public methods for external access
    getData() {
        return this.dataManager.getData();
    }

    getFilteredData() {
        return this.uiManager.getFilteredData();
    }

    getCurrentPage() {
        return this.uiManager.getCurrentPage();
    }

    getChartFilters() {
        return this.filterManager.getChartFilters();
    }

    getChartElementData() {
        return this.filterManager.getChartElementData();
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
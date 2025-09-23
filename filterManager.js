/**
 * Filtering System Module
 * Handles search, filters, and chart-based filtering
 */

class FilterManager {
    constructor(dataManager, uiManager, chartManager) {
        this.dataManager = dataManager;
        this.uiManager = uiManager;
        this.chartManager = chartManager;
        this.chartFilters = new Map(); // Store active chart-based filters
        this.chartElementData = null; // Store clicked chart element data
    }

    applyChartFilters() {
        // Start with all data
        let filtered = [...this.dataManager.getData()];

        // Apply existing search and filter criteria first
        const searchTerm = this.uiManager.searchInput.value.toLowerCase();
        const diseaseFilter = this.uiManager.filterDisease.value;
        const riskFilter = this.uiManager.filterRisk.value;

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
        this.uiManager.setFilteredData(filtered);
        this.uiManager.setCurrentPage(1);
        this.uiManager.renderTable();
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
            case 'highRiskDiabetesChart':
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

    filterDataByChartSelection(chartId, elementLabel, elementValue, elementIndex, elementType, chartType) {
        // Create filter based on chart type and element
        const filterInfo = this.createChartFilter(chartId, elementLabel, elementValue, elementIndex, elementType, chartType);

        if (!filterInfo) {
            console.warn('Could not create filter for:', { chartId, elementLabel, elementType });
            return false;
        }

        // Add to active chart filters
        this.chartFilters.set(chartId, filterInfo);

        // Apply the filter
        this.applyChartFilters();

        return true;
    }

    clearChartFilter(chartId) {
        if (this.chartFilters.has(chartId)) {
            this.chartFilters.delete(chartId);
            this.applyChartFilters();
            return true;
        }
        return false;
    }

    clearAllChartFilters() {
        this.chartFilters.clear();
        this.applyChartFilters();
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
            'riskPerProtocolChart': 'Risk Rating per Protocol',
            'highRiskDiabetesChart': 'High Risk Diabetes - Adherence Risk Protocol'
        };

        return displayNames[chartId] || chartId;
    }

    updateActiveFilterIndicators() {
        this.uiManager.updateActiveFilterIndicators(this.chartFilters);
    }

    getChartFilters() {
        return this.chartFilters;
    }

    setChartElementData(elementData) {
        this.chartElementData = elementData;
    }

    getChartElementData() {
        return this.chartElementData;
    }

    clearChartElementData() {
        this.chartElementData = null;
    }

    // Test method to verify chart filtering functionality
    testChartFiltering() {
        console.log('=== Chart Filtering Test ===');
        console.log('Active chart filters:', this.chartFilters.size);
        console.log('Chart element data:', this.chartElementData);

        // Test with sample data if available
        const data = this.dataManager.getData();
        if (data.length > 0) {
            console.log('Sample data available:', data.length, 'records');

            // Test disease filtering
            const sampleDisease = data.find(row => row.DiseaseProtocolName)?.DiseaseProtocolName;
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
                console.log('Filtered data count:', this.uiManager.getFilteredData().length);
            }
        }

        console.log('=== Test Complete ===');
    }
}
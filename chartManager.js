/**
 * Chart Management Module
 * Handles chart creation, data processing, and chart configuration
 */

class ChartManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = {};
        this.fullscreenChart = null;
    }

    initializeCharts(canvasElements) {
        // Only create charts for canvas elements that exist
        if (canvasElements.multipleDiseasesChart) this.createMultipleDiseasesChart();
        if (canvasElements.multipleDiseasesDetailedChart) this.createMultipleDiseasesDetailedChart();
        if (canvasElements.diseaseCombinationsChart) this.createDiseaseCombinationsChart();
        if (canvasElements.multipleDiseaseRiskChart) this.createMultipleDiseaseRiskChart();
        if (canvasElements.multipleDiseaseSeverityChart) this.createMultipleDiseaseSeverityChart();
        if (canvasElements.diseaseChart) this.createDiseaseChart();
        if (canvasElements.riskChart) this.createRiskChart();
        if (canvasElements.peoplePerConditionChart) this.createPeoplePerConditionChart();
        if (canvasElements.riskBreakdownChart) this.createRiskBreakdownChart();
        if (canvasElements.calculationTypeChart) this.createCalculationTypeChart();
        if (canvasElements.calculationTypePerDiseaseChart) this.createCalculationTypePerDiseaseChart();
        if (canvasElements.recordsOverTimeChart) this.createRecordsOverTimeChart();
        if (canvasElements.commonCalcTypesChart) this.createCommonCalcTypesChart();
        if (canvasElements.diseaseCooccurrenceChart) this.createDiseaseCooccurrenceChart();
        if (canvasElements.riskByCalcTypeChart) this.createRiskByCalcTypeChart();
        if (canvasElements.protocolUsageChart) this.createProtocolUsageChart();
        if (canvasElements.highRiskAnalysisChart) this.createHighRiskAnalysisChart();
        if (canvasElements.dataEntryPatternsChart) this.createDataEntryPatternsChart();
        if (canvasElements.riskTrendChart) this.createRiskTrendChart();
        if (canvasElements.calcMethodEffectivenessChart) this.createCalcMethodEffectivenessChart();
        if (canvasElements.diseaseSeverityChart) this.createDiseaseSeverityChart();
        if (canvasElements.riskPerProtocolChart) this.createRiskPerProtocolChart();
        if (canvasElements.highRiskDiabetesChart) this.createHighRiskDiabetesChart();
    }

    createMultipleDiseasesChart(type = 'bar') {
        console.log('Creating multiple diseases chart...');

        const data = this.dataManager.getData();
        if (!data || data.length === 0) {
            console.warn('No data available - chart will be created when data is loaded');
            return;
        }

        const chartData = this.getMultipleDiseasesData();
        console.log('Chart data:', chartData);

        if (!chartData || !chartData.labels || !chartData.data || chartData.labels.length === 0) {
            console.warn('No valid data available for multiple diseases chart');
            return;
        }

        const chartConfig = this.getChartConfig(type, chartData, 'Members with Multiple Diseases');
        console.log('Chart config:', chartConfig);

        const canvas = document.getElementById('multipleDiseasesChart');
        if (!canvas) {
            console.error('Canvas element not found: multipleDiseasesChart');
            return;
        }

        if (this.charts.multipleDiseasesChart) {
            this.charts.multipleDiseasesChart.destroy();
        }

        try {
            this.charts.multipleDiseasesChart = new Chart(canvas, chartConfig);
            console.log('Chart created successfully');
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }

    createMultipleDiseasesDetailedChart(type = 'bar') {
        const chartData = this.getMultipleDiseasesDetailedData();
        const chartConfig = this.getChartConfig(type, chartData, 'Members with 3+ Diseases (Detailed)');

        if (this.charts.multipleDiseasesDetailedChart) {
            this.charts.multipleDiseasesDetailedChart.destroy();
        }

        this.charts.multipleDiseasesDetailedChart = new Chart(document.getElementById('multipleDiseasesDetailedChart'), chartConfig);
    }

    createDiseaseCombinationsChart(type = 'bar') {
        const chartData = this.getDiseaseCombinationsData();
        const chartConfig = this.getChartConfig(type, chartData, 'Common Disease Combinations (3+ Diseases)');

        if (this.charts.diseaseCombinationsChart) {
            this.charts.diseaseCombinationsChart.destroy();
        }

        this.charts.diseaseCombinationsChart = new Chart(document.getElementById('diseaseCombinationsChart'), chartConfig);
    }

    createMultipleDiseaseRiskChart(type = 'pie') {
        const chartData = this.getMultipleDiseaseRiskData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Levels for Multiple Disease Patients');

        if (this.charts.multipleDiseaseRiskChart) {
            this.charts.multipleDiseaseRiskChart.destroy();
        }

        this.charts.multipleDiseaseRiskChart = new Chart(document.getElementById('multipleDiseaseRiskChart'), chartConfig);
    }

    createMultipleDiseaseSeverityChart(type = 'bar') {
        const chartData = this.getMultipleDiseaseSeverityData();
        const chartConfig = this.getChartConfig(type, chartData, 'Disease Severity in Multiple Disease Cases');

        if (this.charts.multipleDiseaseSeverityChart) {
            this.charts.multipleDiseaseSeverityChart.destroy();
        }

        this.charts.multipleDiseaseSeverityChart = new Chart(document.getElementById('multipleDiseaseSeverityChart'), chartConfig);
    }

    createDiseaseChart(type = 'pie') {
        const diseaseData = this.getDiseaseDistribution();
        const chartConfig = this.getChartConfig(type, diseaseData, 'Disease Distribution');

        if (this.charts.diseaseChart) {
            this.charts.diseaseChart.destroy();
        }

        this.charts.diseaseChart = new Chart(document.getElementById('diseaseChart'), chartConfig);
    }

    createRiskChart(type = 'bar') {
        const riskData = this.getRiskDistribution();
        const chartConfig = this.getChartConfig(type, riskData, 'Risk Rating Distribution');

        if (this.charts.riskChart) {
            this.charts.riskChart.destroy();
        }

        this.charts.riskChart = new Chart(document.getElementById('riskChart'), chartConfig);
    }

    // New chart methods
    createPeoplePerConditionChart(type = 'bar') {
        const chartData = this.getPeoplePerConditionData();
        const chartConfig = this.getChartConfig(type, chartData, 'People per Condition');

        if (this.charts.peoplePerConditionChart) {
            this.charts.peoplePerConditionChart.destroy();
        }

        this.charts.peoplePerConditionChart = new Chart(document.getElementById('peoplePerConditionChart'), chartConfig);
    }

    createRiskBreakdownChart(type = 'pie') {
        const chartData = this.getRiskBreakdownData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Rating Breakdown');

        if (this.charts.riskBreakdownChart) {
            this.charts.riskBreakdownChart.destroy();
        }

        this.charts.riskBreakdownChart = new Chart(document.getElementById('riskBreakdownChart'), chartConfig);
    }

    createCalculationTypeChart(type = 'bar') {
        const chartData = this.getCalculationTypeData();
        const chartConfig = this.getChartConfig(type, chartData, 'Calculation Types per Risk Rating');

        if (this.charts.calculationTypeChart) {
            this.charts.calculationTypeChart.destroy();
        }

        this.charts.calculationTypeChart = new Chart(document.getElementById('calculationTypeChart'), chartConfig);
    }

    createCalculationTypePerDiseaseChart(type = 'bar') {
        const chartData = this.getCalculationTypePerDiseaseData();
        const chartConfig = this.getChartConfig(type, chartData, 'Calculation Types per Disease');

        if (this.charts.calculationTypePerDiseaseChart) {
            this.charts.calculationTypePerDiseaseChart.destroy();
        }

        this.charts.calculationTypePerDiseaseChart = new Chart(document.getElementById('calculationTypePerDiseaseChart'), chartConfig);
    }

    // New chart creation methods
    createRecordsOverTimeChart(type = 'line') {
        const chartData = this.getRecordsOverTimeData();
        const chartConfig = this.getChartConfig(type, chartData, 'Records Over Time');

        if (this.charts.recordsOverTimeChart) {
            this.charts.recordsOverTimeChart.destroy();
        }

        this.charts.recordsOverTimeChart = new Chart(document.getElementById('recordsOverTimeChart'), chartConfig);
    }

    createCommonCalcTypesChart(type = 'pie') {
        const chartData = this.getCommonCalcTypesData();
        const chartConfig = this.getChartConfig(type, chartData, 'Most Common Calculation Types');

        if (this.charts.commonCalcTypesChart) {
            this.charts.commonCalcTypesChart.destroy();
        }

        this.charts.commonCalcTypesChart = new Chart(document.getElementById('commonCalcTypesChart'), chartConfig);
    }

    createDiseaseCooccurrenceChart(type = 'bar') {
        const chartData = this.getDiseaseCooccurrenceData();
        const chartConfig = this.getChartConfig(type, chartData, 'Disease Co-occurrence');

        if (this.charts.diseaseCooccurrenceChart) {
            this.charts.diseaseCooccurrenceChart.destroy();
        }

        this.charts.diseaseCooccurrenceChart = new Chart(document.getElementById('diseaseCooccurrenceChart'), chartConfig);
    }

    createRiskByCalcTypeChart(type = 'bar') {
        const chartData = this.getRiskByCalcTypeData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk by Calculation Type');

        if (this.charts.riskByCalcTypeChart) {
            this.charts.riskByCalcTypeChart.destroy();
        }

        this.charts.riskByCalcTypeChart = new Chart(document.getElementById('riskByCalcTypeChart'), chartConfig);
    }

    createProtocolUsageChart(type = 'bar') {
        const chartData = this.getProtocolUsageData();
        const chartConfig = this.getChartConfig(type, chartData, 'Protocol Usage Frequency');

        if (this.charts.protocolUsageChart) {
            this.charts.protocolUsageChart.destroy();
        }

        this.charts.protocolUsageChart = new Chart(document.getElementById('protocolUsageChart'), chartConfig);
    }

    createHighRiskAnalysisChart(type = 'pie') {
        const chartData = this.getHighRiskAnalysisData();
        const chartConfig = this.getChartConfig(type, chartData, 'High Risk Patient Analysis');

        if (this.charts.highRiskAnalysisChart) {
            this.charts.highRiskAnalysisChart.destroy();
        }

        this.charts.highRiskAnalysisChart = new Chart(document.getElementById('highRiskAnalysisChart'), chartConfig);
    }

    createDataEntryPatternsChart(type = 'line') {
        const chartData = this.getDataEntryPatternsData();
        const chartConfig = this.getChartConfig(type, chartData, 'Data Entry Patterns');

        if (this.charts.dataEntryPatternsChart) {
            this.charts.dataEntryPatternsChart.destroy();
        }

        this.charts.dataEntryPatternsChart = new Chart(document.getElementById('dataEntryPatternsChart'), chartConfig);
    }

    createRiskTrendChart(type = 'line') {
        const chartData = this.getRiskTrendData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Trend Analysis');

        if (this.charts.riskTrendChart) {
            this.charts.riskTrendChart.destroy();
        }

        this.charts.riskTrendChart = new Chart(document.getElementById('riskTrendChart'), chartConfig);
    }

    createCalcMethodEffectivenessChart(type = 'bar') {
        const chartData = this.getCalcMethodEffectivenessData();
        const chartConfig = this.getChartConfig(type, chartData, 'Calculation Method Effectiveness');

        if (this.charts.calcMethodEffectivenessChart) {
            this.charts.calcMethodEffectivenessChart.destroy();
        }

        this.charts.calcMethodEffectivenessChart = new Chart(document.getElementById('calcMethodEffectivenessChart'), chartConfig);
    }

    createDiseaseSeverityChart(type = 'bar') {
        const chartData = this.getDiseaseSeverityData();
        const chartConfig = this.getChartConfig(type, chartData, 'Disease Severity Patterns');

        if (this.charts.diseaseSeverityChart) {
            this.charts.diseaseSeverityChart.destroy();
        }

        this.charts.diseaseSeverityChart = new Chart(document.getElementById('diseaseSeverityChart'), chartConfig);
    }

    createRiskPerProtocolChart(type = 'bar') {
        const chartData = this.getRiskPerProtocolData();
        const chartConfig = this.getChartConfig(type, chartData, 'Risk Rating per Protocol');

        if (this.charts.riskPerProtocolChart) {
            this.charts.riskPerProtocolChart.destroy();
        }

        this.charts.riskPerProtocolChart = new Chart(document.getElementById('riskPerProtocolChart'), chartConfig);
    }

    createHighRiskDiabetesChart(type = 'bar') {
        const chartData = this.getHighRiskDiabetesData();
        const chartConfig = this.getChartConfig(type, chartData, 'High Risk Diabetes - Adherence Risk Protocol');

        if (this.charts.highRiskDiabetesChart) {
            this.charts.highRiskDiabetesChart.destroy();
        }

        this.charts.highRiskDiabetesChart = new Chart(document.getElementById('highRiskDiabetesChart'), chartConfig);
    }

    // Update methods for charts
    updateMultipleDiseasesChart(type) {
        this.createMultipleDiseasesChart(type);
    }

    updateMultipleDiseasesDetailedChart(type) {
        this.createMultipleDiseasesDetailedChart(type);
    }

    updateDiseaseCombinationsChart(type) {
        this.createDiseaseCombinationsChart(type);
    }

    updateMultipleDiseaseRiskChart(type) {
        this.createMultipleDiseaseRiskChart(type);
    }

    updateMultipleDiseaseSeverityChart(type) {
        this.createMultipleDiseaseSeverityChart(type);
    }

    updateDiseaseChart(type) {
        this.createDiseaseChart(type);
    }

    updateRiskChart(type) {
        this.createRiskChart(type);
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

    updateCalculationTypePerDiseaseChart(type) {
        this.createCalculationTypePerDiseaseChart(type);
    }

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

    updateRiskPerProtocolChart(type) {
        this.createRiskPerProtocolChart(type);
    }

    updateHighRiskDiabetesChart(type) {
        this.createHighRiskDiabetesChart(type);
    }

    updateAllCharts() {
        // Update all charts with current data - only for existing charts
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
                const methodName = `update${chartTypeId.replace('ChartType', 'Chart')}`;
                if (this[methodName]) {
                    this[methodName](element.value);
                }
            }
        });
    }

    // Method to refresh charts when data becomes available
    refreshChartsWithData() {
        const data = this.dataManager.getData();
        if (data && data.length > 0) {
            console.log('Data available, refreshing charts...');
            this.updateAllCharts();
        }
    }

    // Data processing methods
    getMultipleDiseasesData() {
        console.log('Processing multiple diseases data...');
        const data = this.dataManager.getData();
        console.log('Total data rows:', data.length);

        // Debug: Check data structure
        if (data.length > 0) {
            console.log('Sample data row:', data[0]);
            console.log('Available fields:', Object.keys(data[0]));
        }

        // Count how many diseases each member has - ACTIVE MEMBERS ONLY
        const memberDiseaseCount = new Map();
        let activeMembers = 0;
        let membersWithDiseases = 0;

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;
            activeMembers++;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';

            if (!memberDiseaseCount.has(personKey)) {
                memberDiseaseCount.set(personKey, new Set());
            }
            memberDiseaseCount.get(personKey).add(disease);

            if (disease && disease !== 'Unknown') {
                membersWithDiseases++;
            }
        });

        console.log('Active members:', activeMembers);
        console.log('Members with diseases:', membersWithDiseases);

        console.log('Member disease count map size:', memberDiseaseCount.size);

        // Count members by number of diseases
        const diseaseCountDistribution = new Map();

        memberDiseaseCount.forEach(diseases => {
            const count = diseases.size;
            diseaseCountDistribution.set(count, (diseaseCountDistribution.get(count) || 0) + 1);
        });

        console.log('Disease count distribution:', diseaseCountDistribution);

        // Convert to chart data - sort by disease count
        const sortedEntries = Array.from(diseaseCountDistribution.entries()).sort((a, b) => a[0] - b[0]);
        const labels = sortedEntries.map(([count]) => `${count} Disease${count > 1 ? 's' : ''}`);
        const dataValues = sortedEntries.map(([, memberCount]) => memberCount);

        console.log('Final chart data:', { labels, data: dataValues });

        const result = {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length)
        };

        console.log('Returning chart data:', result);
        return result;
    }

    getMultipleDiseasesDetailedData() {
        const data = this.dataManager.getData();
        const memberDiseaseCount = new Map();

        // Count diseases per member - ACTIVE MEMBERS ONLY
        data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';

            if (!memberDiseaseCount.has(personKey)) {
                memberDiseaseCount.set(personKey, new Set());
            }
            memberDiseaseCount.get(personKey).add(disease);
        });

        // Filter to only include members with 3+ diseases
        const multipleDiseaseMembers = new Map();
        memberDiseaseCount.forEach((diseases, personKey) => {
            if (diseases.size >= 3) {
                multipleDiseaseMembers.set(personKey, diseases);
            }
        });

        // Count members by exact number of diseases (3, 4, 5, 6+)
        const diseaseCountDistribution = new Map();
        multipleDiseaseMembers.forEach(diseases => {
            const count = diseases.size;
            const category = count >= 6 ? '6+ Diseases' : `${count} Diseases`;
            diseaseCountDistribution.set(category, (diseaseCountDistribution.get(category) || 0) + 1);
        });

        // Convert to chart data - sort by disease count
        const sortedEntries = Array.from(diseaseCountDistribution.entries()).sort((a, b) => {
            const aNum = a[0].includes('+') ? 6 : parseInt(a[0]);
            const bNum = b[0].includes('+') ? 6 : parseInt(b[0]);
            return aNum - bNum;
        });

        const labels = sortedEntries.map(([category]) => category);
        const dataValues = sortedEntries.map(([, memberCount]) => memberCount);

        return {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length)
        };
    }

    getDiseaseCombinationsData() {
        const data = this.dataManager.getData();
        const memberDiseases = new Map();

        // Build person-to-diseases mapping - ACTIVE MEMBERS ONLY
        data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';

            if (!memberDiseases.has(personKey)) {
                memberDiseases.set(personKey, new Set());
            }
            memberDiseases.get(personKey).add(disease);
        });

        // Filter to only include members with 3+ diseases
        const multipleDiseaseMembers = new Map();
        memberDiseases.forEach((diseases, personKey) => {
            if (diseases.size >= 3) {
                multipleDiseaseMembers.set(personKey, diseases);
            }
        });

        // Count disease combinations
        const combinationCount = new Map();
        multipleDiseaseMembers.forEach(diseases => {
            const diseaseArray = Array.from(diseases).sort();
            // Create combination key (limit to top 3 diseases for readability)
            const topDiseases = diseaseArray.slice(0, 3);
            const combinationKey = topDiseases.join(' + ');

            if (diseaseArray.length > 3) {
                combinationCount.set(`${combinationKey} + ${diseaseArray.length - 3} more`, (combinationCount.get(`${combinationKey} + ${diseaseArray.length - 3} more`) || 0) + 1);
            } else {
                combinationCount.set(combinationKey, (combinationCount.get(combinationKey) || 0) + 1);
            }
        });

        // Get top 15 combinations
        const sortedCombinations = Array.from(combinationCount.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15);

        return {
            labels: sortedCombinations.map(([combination]) => combination),
            data: sortedCombinations.map(([,count]) => count),
            backgroundColor: this.generateColors(sortedCombinations.length)
        };
    }

    getMultipleDiseaseRiskData() {
        const data = this.dataManager.getData();
        const riskDistribution = { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 };
        let totalMultipleDiseaseMembers = 0;

        // Build person-to-diseases mapping - ACTIVE MEMBERS ONLY
        const memberDiseases = new Map();
        data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';

            if (!memberDiseases.has(personKey)) {
                memberDiseases.set(personKey, new Set());
            }
            memberDiseases.get(personKey).add(disease);
        });

        // Count risk levels for members with 3+ diseases
        data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const memberDiseaseSet = memberDiseases.get(personKey);

            if (memberDiseaseSet && memberDiseaseSet.size >= 3) {
                const risk = row.RiskRatingName || 'Unknown';
                if (riskDistribution.hasOwnProperty(risk)) {
                    riskDistribution[risk]++;
                    totalMultipleDiseaseMembers++;
                }
            }
        });

        // Convert to chart data
        const labels = Object.keys(riskDistribution);
        const dataValues = Object.values(riskDistribution);

        return {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length, true)
        };
    }

    getMultipleDiseaseSeverityData() {
        const data = this.dataManager.getData();
        const memberDiseases = new Map();
        const memberRiskProfiles = new Map();

        // Build person-to-diseases mapping - ACTIVE MEMBERS ONLY
        data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';

            if (!memberDiseases.has(personKey)) {
                memberDiseases.set(personKey, new Set());
            }
            memberDiseases.get(personKey).add(disease);
        });

        // Build risk profiles for members with 3+ diseases
        data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const memberDiseaseSet = memberDiseases.get(personKey);

            if (memberDiseaseSet && memberDiseaseSet.size >= 3) {
                const risk = row.RiskRatingName || 'Unknown';

                if (!memberRiskProfiles.has(personKey)) {
                    memberRiskProfiles.set(personKey, { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0, total: 0 });
                }
                memberRiskProfiles.get(personKey)[risk]++;
                memberRiskProfiles.get(personKey).total++;
            }
        });

        // Calculate average severity scores for different numbers of diseases
        const severityByDiseaseCount = new Map();

        memberRiskProfiles.forEach((profile, personKey) => {
            const diseaseCount = memberDiseases.get(personKey).size;
            const severityScore = profile.total > 0 ?
                ((profile['High Risk'] * 3 + profile['Medium Risk'] * 2 + profile['Low Risk'] * 1) / profile.total) : 0;

            if (!severityByDiseaseCount.has(diseaseCount)) {
                severityByDiseaseCount.set(diseaseCount, { total: 0, sum: 0 });
            }
            severityByDiseaseCount.get(diseaseCount).total++;
            severityByDiseaseCount.get(diseaseCount).sum += severityScore;
        });

        // Convert to chart data
        const sortedEntries = Array.from(severityByDiseaseCount.entries()).sort((a, b) => a[0] - b[0]);
        const labels = sortedEntries.map(([count]) => `${count} Diseases`);
        const avgSeverityScores = sortedEntries.map(([, data]) => data.sum / data.total);

        return {
            labels: labels,
            datasets: [{
                label: 'Average Severity Score',
                data: avgSeverityScores,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false
            }]
        };
    }

    getDiseaseDistribution() {
        const data = this.dataManager.getData();
        // Count unique people per disease (not records) - ACTIVE MEMBERS ONLY
        const peoplePerDisease = new Map();

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const disease = row.DiseaseProtocolName || 'Unknown';
            const personKey = `${row.MemberNumber}-${row.DependantCode}`;

            if (!peoplePerDisease.has(disease)) {
                peoplePerDisease.set(disease, new Set());
            }
            peoplePerDisease.get(disease).add(personKey);
        });

        // Convert to chart data
        const labels = Array.from(peoplePerDisease.keys());
        const dataValues = labels.map(disease => peoplePerDisease.get(disease).size);

        return {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length)
        };
    }

    getRiskDistribution() {
        const data = this.dataManager.getData();
        // Count unique people per risk level (not records) - ACTIVE MEMBERS ONLY
        const peoplePerRisk = new Map();

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const risk = row.RiskRatingName || 'Unknown';
            const personKey = `${row.MemberNumber}-${row.DependantCode}`;

            if (!peoplePerRisk.has(risk)) {
                peoplePerRisk.set(risk, new Set());
            }
            peoplePerRisk.get(risk).add(personKey);
        });

        // Convert to chart data
        const labels = Array.from(peoplePerRisk.keys());
        const dataValues = labels.map(risk => peoplePerRisk.get(risk).size);

        return {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length, true)
        };
    }

    getPeoplePerConditionData() {
        const data = this.dataManager.getData();
        // Track which conditions each person has - ACTIVE MEMBERS ONLY
        const peopleConditions = new Map();

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const memberNumber = row.MemberNumber;
            const dependentCode = row.DependantCode;
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
        const data = this.dataManager.getData();
        // Count unique people per risk level (not records) - ACTIVE MEMBERS ONLY
        const peoplePerRisk = new Map();

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const risk = row.RiskRatingName || 'Unknown';
            const personKey = `${row.MemberNumber}-${row.DependantCode}`;

            if (!peoplePerRisk.has(risk)) {
                peoplePerRisk.set(risk, new Set());
            }
            peoplePerRisk.get(risk).add(personKey);
        });

        // Convert to chart data
        const labels = Array.from(peoplePerRisk.keys());
        const dataValues = labels.map(risk => peoplePerRisk.get(risk).size);

        return {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length, true)
        };
    }

    getCalculationTypeData() {
        const data = this.dataManager.getData();
        const calculationByRisk = {};

        data.forEach(row => {
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
        const data = this.dataManager.getData();
        const monthlyData = {};

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const date = this.dataManager.formatDate(row.DateCalculated);
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
        const data = this.dataManager.getData();
        const calcTypeCount = {};

        data.forEach(row => {
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
        const data = this.dataManager.getData();
        const peopleDiseases = new Map();

        // Build person-to-diseases mapping - ACTIVE MEMBERS ONLY
        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
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
        const data = this.dataManager.getData();
        const riskByCalc = {};

        data.forEach(row => {
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
        const data = this.dataManager.getData();
        const protocolCount = {};

        data.forEach(row => {
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
        const data = this.dataManager.getData();
        const highRiskData = data.filter(row => row.RiskRatingName === 'High Risk' && row.isActive);
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
        const data = this.dataManager.getData();
        const hourlyData = {};
        const dailyData = {};

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const date = this.dataManager.formatDate(row.DateCalculated);
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
        const data = this.dataManager.getData();
        const monthlyRiskData = {};

        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const date = this.dataManager.formatDate(row.DateCalculated);
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
        const data = this.dataManager.getData();
        const methodStats = {};

        data.forEach(row => {
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
        const data = this.dataManager.getData();
        const diseaseRiskProfile = {};

        data.forEach(row => {
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
        const data = this.dataManager.getData();
        const protocolRiskData = {};

        data.forEach(row => {
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

    getHighRiskDiabetesData() {
        const data = this.dataManager.getData();
        const diabetesData = {};

        // Filter for diabetes patients with high risk using adherence protocol
        data.forEach(row => {
            // Only include active members
            if (!row.isActive) return;

            const disease = row.DiseaseProtocolName || 'Unknown';
            const risk = row.RiskRatingName || 'Unknown';
            const calcType = row.RiskCalculationTypeName || 'Unknown';

            // Check if it's diabetes and high risk with adherence protocol
            if (disease.toLowerCase().includes('diabetes') &&
                risk === 'High Risk' &&
                calcType.toLowerCase().includes('adherence')) {

                if (!diabetesData[disease]) {
                    diabetesData[disease] = 0;
                }
                diabetesData[disease]++;
            }
        });

        // Convert to chart data format
        const labels = Object.keys(diabetesData);
        const dataValues = Object.values(diabetesData);

        return {
            labels: labels,
            data: dataValues,
            backgroundColor: this.generateColors(labels.length)
        };
    }

    getCalculationTypePerDiseaseData() {
        const data = this.dataManager.getData();
        const calculationByDisease = {};

        data.forEach(row => {
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
            case 'multipleDiseasesChart':
                chartData = this.getMultipleDiseasesData();
                break;
            case 'multipleDiseasesDetailedChart':
                chartData = this.getMultipleDiseasesDetailedData();
                break;
            case 'diseaseCombinationsChart':
                chartData = this.getDiseaseCombinationsData();
                break;
            case 'multipleDiseaseRiskChart':
                chartData = this.getMultipleDiseaseRiskData();
                break;
            case 'multipleDiseaseSeverityChart':
                chartData = this.getMultipleDiseaseSeverityData();
                break;
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
            case 'highRiskDiabetesChart':
                chartData = this.getHighRiskDiabetesData();
                break;
            default:
                return;
        }

        // Create new chart with updated type
        const chartConfig = this.getChartConfig(newType, chartData, document.getElementById('fullscreenModalTitle').textContent);
        this.fullscreenChart = new Chart(ctx, chartConfig);
    }

    getCharts() {
        return this.charts;
    }

    getChart(chartId) {
        return this.charts[chartId.replace('Chart', 'Chart')];
    }
}
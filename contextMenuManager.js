/**
 * Context Menu System Module
 * Handles chart right-click functionality, element detection, and drill-down actions
 */

class ContextMenuManager {
    constructor(dataManager, chartManager, uiManager, filterManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.uiManager = uiManager;
        this.filterManager = filterManager;
        this.currentChartInfo = null;
    }

    initializeChartContextMenus() {
        const chartIds = [
            'diseaseChart', 'riskChart', 'peoplePerConditionChart', 'riskBreakdownChart',
            'calculationTypeChart', 'calculationTypePerDiseaseChart', 'recordsOverTimeChart',
            'commonCalcTypesChart', 'diseaseCooccurrenceChart', 'riskByCalcTypeChart',
            'protocolUsageChart', 'highRiskAnalysisChart', 'dataEntryPatternsChart',
            'riskTrendChart', 'calcMethodEffectivenessChart', 'diseaseSeverityChart',
            'riskPerProtocolChart', 'highRiskDiabetesChart'
        ];

        chartIds.forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
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
                console.log(`⚠️ Context menu not initialized for ${chartId} - canvas missing`);
            }
        });

        console.log('Context menu initialization complete');
    }

    // Hide context menu when clicking elsewhere
    initializeGlobalEventListeners() {
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
        const chart = this.chartManager.getChart(chartId);
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
            this.filterManager.setChartElementData({
                chartId: chartId,
                chartType: chart ? chart.config.type : '',
                ...elementData
            });

            console.log('✅ Element data successfully detected and stored:', elementData);
        } else {
            // Enhanced fallback mechanism
            console.log('⚠️ Right-click element detection failed, attempting fallbacks...');

            // Fallback 1: Use previously stored data for the same chart
            const existingElementData = this.filterManager.getChartElementData();
            if (existingElementData && existingElementData.chartId === chartId) {
                console.log('📋 Using previously stored element data as fallback');
                contextMenu.setAttribute('data-element-label', existingElementData.label || '');
                contextMenu.setAttribute('data-element-value', existingElementData.value || '');
                contextMenu.setAttribute('data-element-index', existingElementData.index || '');
                contextMenu.setAttribute('data-element-type', existingElementData.elementType || '');
                contextMenu.setAttribute('data-chart-type', existingElementData.chartType || '');

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
        this.filterManager.clearChartElementData();
        this.hideChartContextMenu();
    }

    // Clear chart element data when starting a new operation
    clearChartElementData() {
        this.filterManager.clearChartElementData();
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
        const chart = this.chartManager.getChart(chartId);
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

            const chart = this.chartManager.getChart(chartId);
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
        const data = this.chartManager.getDiseaseDistribution();
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
        const data = this.chartManager.getRiskDistribution();
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
        const data = this.chartManager.getPeoplePerConditionData();
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
        const data = this.chartManager.getCalculationTypeData();
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
        const data = this.chartManager.getProtocolUsageData();
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
        const data = this.chartManager.getHighRiskAnalysisData();
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
        const data = this.chartManager.getRiskPerProtocolData();
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
        const chart = this.chartManager.getChart(chartId);
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
                            <p><strong>Debug Info:</strong> Chart: ${this.filterManager.getChartDisplayName(chartId)}, Position: ${contextMenu.getAttribute('data-click-x')}, ${contextMenu.getAttribute('data-click-y')}</p>
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
                            <p><strong>Debug Info:</strong> Chart: ${this.filterManager.getChartDisplayName(chartId)}, Position: ${contextMenu.getAttribute('data-click-x')}, ${contextMenu.getAttribute('data-click-y')}</p>
                        </div>
                    `;
                }

                this.showDrillDownModal('Filter Error', errorMessage);
                return;
            }

            // Validate chart exists
            const chart = this.chartManager.getChart(chartId);
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

            // Apply the filter
            const success = this.filterManager.filterDataByChartSelection(chartId, elementLabel, elementValue, elementIndex, elementType, chartType);

            if (success) {
                // Show success message with more detailed information
                this.showDrillDownModal('Filter Applied Successfully', `
                    <div class="drill-down-details">
                        <p><strong>✅ Filter applied successfully!</strong></p>
                        <p><strong>Chart:</strong> ${this.filterManager.getChartDisplayName(chartId)}</p>
                        <p><strong>Filter:</strong> ${elementLabel}</p>
                        <p><strong>Records found:</strong> ${this.uiManager.getFilteredData().length} (filtered from ${this.dataManager.getData().length} total)</p>
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
                this.filterManager.updateActiveFilterIndicators();

                console.log('Chart filter applied successfully:', { chartId, elementLabel });
            } else {
                this.showDrillDownModal('Filter Error', `
                    <div class="drill-down-details">
                        <p><strong>Unsupported chart element</strong></p>
                        <p>This type of chart element cannot be used for filtering. Please try a different chart or element.</p>
                    </div>
                `);
            }

        } catch (error) {
            console.error('Error applying chart filter:', error);
            this.showDrillDownModal('Filter Error', `
                <div class="drill-down-details">
                    <p><strong>An error occurred while applying the filter.</strong></p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Please try again or contact support if the problem persists.</p>
                </div>
            `);
        }
    }

    exportChartData(chartId) {
        try {
            if (!chartId) {
                console.warn('No chart ID provided for export');
                return;
            }

            const chart = this.chartManager.getChart(chartId);
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
        this.uiManager.showDrillDownModal(title, content);
    }
}
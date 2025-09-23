/**
 * UI Management Module
 * Handles DOM manipulation, modals, notifications, table rendering, and pagination
 */

class UIManager {
    constructor(dataManager, chartManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.filteredData = [];
        this.searchInput = null;
        this.filterDisease = null;
        this.filterRisk = null;
        this.dataTableBody = null;
        this.prevPageBtn = null;
        this.nextPageBtn = null;
        this.pageInfo = null;
        this.drillDownModal = null;
        this.modalTitle = null;
        this.modalBody = null;
        this.closeModal = null;
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

        // Data table
        this.dataTableBody = document.getElementById('dataTableBody');
        this.searchInput = document.getElementById('searchInput');
        this.filterDisease = document.getElementById('filterDisease');
        this.filterRisk = document.getElementById('filterRisk');

        // High risk table
        this.highRiskTableBody = document.getElementById('highRiskTableBody');
        this.highRiskSummary = document.getElementById('highRiskSummary');
        this.highRiskFilter = document.getElementById('highRiskFilter');
        this.highRiskSort = document.getElementById('highRiskSort');
        this.refreshHighRiskTable = document.getElementById('refreshHighRiskTable');

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
        this.renderHighRiskTable();
        this.chartManager.initializeCharts({
            multipleDiseasesChart: document.getElementById('multipleDiseasesChart'),
            multipleDiseasesDetailedChart: document.getElementById('multipleDiseasesDetailedChart'),
            diseaseCombinationsChart: document.getElementById('diseaseCombinationsChart'),
            multipleDiseaseRiskChart: document.getElementById('multipleDiseaseRiskChart'),
            multipleDiseaseSeverityChart: document.getElementById('multipleDiseaseSeverityChart'),
            diseaseChart: document.getElementById('diseaseChart'),
            riskChart: document.getElementById('riskChart'),
            peoplePerConditionChart: document.getElementById('peoplePerConditionChart'),
            riskBreakdownChart: document.getElementById('riskBreakdownChart'),
            calculationTypeChart: document.getElementById('calculationTypeChart'),
            calculationTypePerDiseaseChart: document.getElementById('calculationTypePerDiseaseChart'),
            recordsOverTimeChart: document.getElementById('recordsOverTimeChart'),
            commonCalcTypesChart: document.getElementById('commonCalcTypesChart'),
            diseaseCooccurrenceChart: document.getElementById('diseaseCooccurrenceChart'),
            riskByCalcTypeChart: document.getElementById('riskByCalcTypeChart'),
            protocolUsageChart: document.getElementById('protocolUsageChart'),
            highRiskAnalysisChart: document.getElementById('highRiskAnalysisChart'),
            dataEntryPatternsChart: document.getElementById('dataEntryPatternsChart'),
            riskTrendChart: document.getElementById('riskTrendChart'),
            calcMethodEffectivenessChart: document.getElementById('calcMethodEffectivenessChart'),
            diseaseSeverityChart: document.getElementById('diseaseSeverityChart'),
            riskPerProtocolChart: document.getElementById('riskPerProtocolChart'),
            highRiskDiabetesChart: document.getElementById('highRiskDiabetesChart')
        });
    }

    updateSummaryCards() {
        const summary = this.dataManager.getDataSummary();

        // Update DOM elements with null checks
        if (this.totalMembers) {
            this.totalMembers.textContent = summary.totalMembers.toLocaleString();
        }
        if (this.totalProtocols) {
            this.totalProtocols.textContent = summary.totalProtocols.toLocaleString();
        }
        if (this.highRiskCases) {
            this.highRiskCases.textContent = summary.highRiskCases.toLocaleString();
        }

        // Update active/inactive counts if elements exist
        const activeMembersEl = document.getElementById('activeMembers');
        const inactiveMembersEl = document.getElementById('inactiveMembers');

        if (activeMembersEl) {
            activeMembersEl.textContent = summary.activeMembers.toLocaleString();
        }
        if (inactiveMembersEl) {
            inactiveMembersEl.textContent = summary.inactiveMembers.toLocaleString();
        }

        // Update lastUpdated if element exists (was removed from HTML)
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = new Date().toLocaleString();
        }
    }

    populateFilters() {
        const data = this.dataManager.getData();
        const diseases = [...new Set(data.map(row => row.DiseaseProtocolName))].filter(Boolean);
        const risks = [...new Set(data.map(row => row.RiskRatingName))].filter(Boolean);

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
        // Apply search and filter criteria
        const searchTerm = this.searchInput.value.toLowerCase();
        const diseaseFilter = this.filterDisease.value;
        const riskFilter = this.filterRisk.value;

        let filtered = [...this.dataManager.getData()];

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

        // Update filtered data and refresh table
        this.filteredData = filtered;
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
                <td>${this.dataManager.formatDate(row.DateCalculated)}</td>
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

    renderHighRiskTable() {
        const filter = this.highRiskFilter ? this.highRiskFilter.value : 'all';
        const sort = this.highRiskSort ? this.highRiskSort.value : 'risk_desc';

        const highRiskMembers = this.dataManager.getHighRiskMembers({ filter, sort });

        this.highRiskTableBody.innerHTML = '';

        if (highRiskMembers.length === 0) {
            this.highRiskTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-info-circle"></i> No high risk members found with current filter settings.
                    </td>
                </tr>
            `;
            this.highRiskSummary.textContent = 'No high risk members found';
            return;
        }

        highRiskMembers.forEach((member, index) => {
            const tr = document.createElement('tr');

            // Priority rank with color coding
            const priorityClass = member.priorityScore >= 10 ? 'priority-high' :
                                member.priorityScore >= 6 ? 'priority-medium' : 'priority-low';

            // Disease tags
            const diseaseTags = Array.from(member.diseases).map(disease => {
                const isMultiple = member.diseases.size >= 3;
                return `<span class="disease-tag${isMultiple ? ' disease-tag-multiple' : ''}">${disease}</span>`;
            }).join(' ');

            // Risk level badge
            const riskClass = member.highestRisk === 'High Risk' ? 'risk-level-high' :
                            member.highestRisk === 'Medium Risk' ? 'risk-level-medium' : 'risk-level-low';

            // Calculation type badges
            const calcBadges = Array.from(member.calcTypes).map(calcType =>
                `<span class="calc-badge">${calcType}</span>`
            ).join(' ');

            tr.innerHTML = `
                <td><span class="${priorityClass}">#${member.rank}</span></td>
                <td>${member.memberNumber}</td>
                <td>${member.dependentCode}</td>
                <td>
                    <div style="max-width: 200px; overflow: hidden;">
                        ${diseaseTags}
                        ${member.diseases.size > 3 ? `<span class="disease-tag disease-tag-multiple">+${member.diseases.size - 3} more</span>` : ''}
                    </div>
                </td>
                <td><span class="${riskClass}">${member.highestRisk}</span></td>
                <td><strong>${member.priorityScore.toFixed(1)}</strong></td>
                <td>
                    <div style="max-width: 150px; overflow: hidden;">
                        ${calcBadges}
                    </div>
                </td>
                <td>${this.dataManager.formatDate(member.latestDate)}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="app.showHighRiskMemberDrillDown(${index})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;

            this.highRiskTableBody.appendChild(tr);
        });

        this.highRiskSummary.textContent = `Showing ${highRiskMembers.length} high risk members (filtered by: ${filter}, sorted by: ${sort})`;
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;

        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderTable();
        }
    }

    showDrillDown(index) {
        const record = this.dataManager.getData()[index];
        if (!record) return;

        this.modalTitle.textContent = `Record Details - Member ${record.MemberNumber || 'Unknown'}`;
        this.modalBody.innerHTML = this.generateDrillDownContent(record);
        this.drillDownModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    showHighRiskMemberDrillDown(member) {
        this.modalTitle.textContent = `High Risk Member Details - Priority #${member.rank}`;
        this.modalBody.innerHTML = this.generateHighRiskMemberDrillDownContent(member);
        this.drillDownModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    generateDrillDownContent(record) {
        const data = this.dataManager.getData();
        const relatedRecords = data.filter(r =>
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
                    <p><strong>Date Calculated:</strong> ${this.dataManager.formatDate(record.DateCalculated)}</p>
                    <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <div class="drill-down-section" style="grid-column: 1 / -1;">
                    <h4>Risk History</h4>
                    <div class="risk-timeline">
                        ${relatedRecords.map(r => `
                            <div class="timeline-item">
                                <div class="timeline-date">${this.dataManager.formatDate(r.DateCalculated)}</div>
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

    generateHighRiskMemberDrillDownContent(member) {
        const priorityClass = member.priorityScore >= 10 ? 'priority-high' :
                            member.priorityScore >= 6 ? 'priority-medium' : 'priority-low';

        const riskClass = member.highestRisk === 'High Risk' ? 'risk-level-high' :
                        member.highestRisk === 'Medium Risk' ? 'risk-level-medium' : 'risk-level-low';

        // Disease tags
        const diseaseTags = Array.from(member.diseases).map(disease =>
            `<span class="disease-tag${member.diseases.size >= 3 ? ' disease-tag-multiple' : ''}">${disease}</span>`
        ).join(' ');

        // Calculation type badges
        const calcBadges = Array.from(member.calcTypes).map(calcType =>
            `<span class="calc-badge">${calcType}</span>`
        ).join(' ');

        // Risk distribution
        const riskDistribution = member.records.reduce((acc, record) => {
            acc[record.risk] = (acc[record.risk] || 0) + 1;
            return acc;
        }, {});

        const riskDistributionHtml = Object.entries(riskDistribution).map(([risk, count]) => {
            const riskBadgeClass = risk === 'High Risk' ? 'risk-level-high' :
                                 risk === 'Medium Risk' ? 'risk-level-medium' : 'risk-level-low';
            return `<div style="margin: 0.25rem 0;"><span class="${riskBadgeClass}">${risk}</span>: ${count} record${count > 1 ? 's' : ''}</div>`;
        }).join('');

        return `
            <div class="drill-down-content">
                <div class="drill-down-section">
                    <h4>Priority Assessment</h4>
                    <div class="priority-indicator">
                        <span class="${priorityClass}">Priority #${member.rank}</span>
                        <span style="margin-left: 1rem; font-weight: bold;">Score: ${member.priorityScore.toFixed(1)}</span>
                    </div>
                    <p><strong>Highest Risk Level:</strong> <span class="${riskClass}">${member.highestRisk}</span></p>
                    <p><strong>Disease Count:</strong> ${member.diseaseCount} condition${member.diseaseCount > 1 ? 's' : ''}</p>
                    <p><strong>Multiple Diseases:</strong> ${member.diseaseCount >= 3 ? 'Yes' : 'No'}</p>
                </div>

                <div class="drill-down-section">
                    <h4>Medical Conditions</h4>
                    <div class="disease-list">
                        ${diseaseTags}
                    </div>
                    <p><strong>Total Conditions:</strong> ${member.diseases.size}</p>
                </div>

                <div class="drill-down-section">
                    <h4>Risk Distribution</h4>
                    ${riskDistributionHtml}
                </div>

                <div class="drill-down-section">
                    <h4>Calculation Methods Used</h4>
                    <div class="calculation-methods">
                        ${calcBadges}
                    </div>
                    <p><strong>Unique Methods:</strong> ${member.calcTypes.size}</p>
                </div>

                <div class="drill-down-section">
                    <h4>Patient Information</h4>
                    <p><strong>Member Number:</strong> ${member.memberNumber}</p>
                    <p><strong>Dependent Code:</strong> ${member.dependentCode}</p>
                    <p><strong>Last Assessment:</strong> ${this.dataManager.formatDate(member.latestDate)}</p>
                    <p><strong>Total Records:</strong> ${member.records.length}</p>
                </div>

                <div class="drill-down-section" style="grid-column: 1 / -1;">
                    <h4>Assessment History</h4>
                    <div class="risk-timeline">
                        ${member.records.map((record, index) => `
                            <div class="timeline-item">
                                <div class="timeline-date">${this.dataManager.formatDate(record.date)}</div>
                                <div class="timeline-content">
                                    <strong>${record.disease}</strong> -
                                    <span class="${record.risk === 'High Risk' ? 'risk-level-high' : record.risk === 'Medium Risk' ? 'risk-level-medium' : 'risk-level-low'}">${record.risk}</span>
                                    (${record.calcType})
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

    showDrillDownModal(title, content) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = content;
        this.drillDownModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    updateActiveFilterIndicators(chartFilters) {
        // Remove existing filter indicators
        const existingIndicators = document.querySelectorAll('.chart-filter-indicator');
        existingIndicators.forEach(indicator => indicator.remove());

        // Add filter indicators to chart containers
        chartFilters.forEach((filterInfo, chartId) => {
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

    getFilteredData() {
        return this.filteredData;
    }

    setFilteredData(data) {
        this.filteredData = data;
    }

    getCurrentPage() {
        return this.currentPage;
    }

    setCurrentPage(page) {
        this.currentPage = page;
    }
}
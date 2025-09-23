/**
 * Data Management Module
 * Handles file upload, parsing, storage, and data compression
 */

class DataManager {
    constructor() {
        this.data = [];
        this.compressionEnabled = true;
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
            // Process main data file
            if (files.length > 0) {
                // Only process the first main data file (in case multiple are selected)
                const mainFile = files[0];
                const data = await this.parseExcelFile(mainFile);
                this.data = data;
                this.saveDataToStorage();
                return data;
            }

        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files. Please check the file formats and try again.');
            throw error;
        }
    }

    async loadSampleData() {
        try {
            // Load the sample data from Azure blob storage
            const response = await fetch('https://samapiimages.blob.core.windows.net/sam/jsonfile.json');
            if (!response.ok) {
                throw new Error('Failed to load sample data');
            }

            const sampleData = await response.json();
            this.data = this.processSampleData(sampleData);
            this.saveDataToStorage();
            return this.data;

        } catch (error) {
            console.error('Error loading sample data:', error);
            alert('Error loading sample data. Please try again.');
            throw error;
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

                return this.data;
            }
            return [];
        } catch (error) {
            console.error('Error loading stored data:', error);
            return [];
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

    // Method to handle data updates and maintain chart filters
    updateDataAndMaintainFilters(newData) {
        this.data = newData;
        this.saveDataToStorage();
        return newData;
    }

    getData() {
        return this.data;
    }

    setData(data) {
        this.data = data;
    }

    getDataSummary() {
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

        return {
            totalMembers: uniquePeople.size,
            totalProtocols: uniqueProtocols.size,
            highRiskCases: highRiskPeople.size,
            activeMembers: activePeople.size,
            inactiveMembers: inactivePeople.size
        };
    }

    getHighRiskMembers(options = {}) {
        const { filter = 'all', sort = 'risk_desc', limit = 50 } = options;

        // Build member profiles
        const memberProfiles = new Map();

        this.data.forEach(row => {
            if (!row.isActive) return;

            const personKey = `${row.MemberNumber}-${row.DependantCode}`;
            const disease = row.DiseaseProtocolName || 'Unknown';
            const risk = row.RiskRatingName || 'Unknown';
            const calcType = row.RiskCalculationTypeName || 'Unknown';
            const dateCalculated = row.DateCalculated;

            if (!memberProfiles.has(personKey)) {
                memberProfiles.set(personKey, {
                    memberNumber: row.MemberNumber,
                    dependentCode: row.DependantCode || '0',
                    diseases: new Set(),
                    riskLevels: new Set(),
                    calcTypes: new Set(),
                    latestDate: dateCalculated,
                    records: []
                });
            }

            const profile = memberProfiles.get(personKey);
            profile.diseases.add(disease);
            profile.riskLevels.add(risk);
            profile.calcTypes.add(calcType);
            if (dateCalculated > profile.latestDate) {
                profile.latestDate = dateCalculated;
            }
            profile.records.push({
                disease: disease,
                risk: risk,
                calcType: calcType,
                date: dateCalculated
            });
        });

        // Convert to array and filter
        let members = Array.from(memberProfiles.values());

        // Apply filters
        if (filter === 'multiple_diseases') {
            members = members.filter(member => member.diseases.size >= 3);
        } else if (filter === 'single_disease') {
            members = members.filter(member => member.diseases.size === 1);
        }

        // Calculate priority scores and filter for high risk
        members = members.filter(member => {
            return Array.from(member.riskLevels).some(risk => risk === 'High Risk');
        });

        // Calculate priority scores
        members.forEach(member => {
            const riskScore = Array.from(member.riskLevels).reduce((score, risk) => {
                switch (risk) {
                    case 'High Risk': return score + 3;
                    case 'Medium Risk': return score + 2;
                    case 'Low Risk': return score + 1;
                    default: return score + 1;
                }
            }, 0);

            const diseaseCount = member.diseases.size;
            const hasMultipleDiseases = diseaseCount >= 3;

            // Priority score calculation
            member.priorityScore = (riskScore * 2) + (diseaseCount * 1.5) + (hasMultipleDiseases ? 2 : 0);
            member.diseaseCount = diseaseCount;
            member.highestRisk = Array.from(member.riskLevels).sort((a, b) => {
                const scores = { 'High Risk': 3, 'Medium Risk': 2, 'Low Risk': 1 };
                return scores[b] - scores[a];
            })[0];
        });

        // Sort members
        members.sort((a, b) => {
            switch (sort) {
                case 'risk_desc':
                    return b.priorityScore - a.priorityScore;
                case 'risk_asc':
                    return a.priorityScore - b.priorityScore;
                case 'diseases_desc':
                    return b.diseaseCount - a.diseaseCount;
                case 'diseases_asc':
                    return a.diseaseCount - b.diseaseCount;
                default:
                    return b.priorityScore - a.priorityScore;
            }
        });

        // Add rank and limit results
        members.forEach((member, index) => {
            member.rank = index + 1;
        });

        return members.slice(0, limit);
    }
}
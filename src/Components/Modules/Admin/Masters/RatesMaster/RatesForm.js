import React, { useState, useEffect } from 'react';
import './RatesForm.css';
import baseURL from "../../../ApiUrl/NodeBaseURL";
import Navbar from '../../../../Pages/Navbar/Navbar';

const RateManagement = () => {
    const [rates, setRates] = useState({
        currentDate: new Date().toISOString().split('T')[0],
        gold16: '',
        gold18: '',
        gold22: '',
        gold24: '',
        silverRate: '',
        rateDate: '',
        rateTime: ''
    });

    const [allowEdit16, setAllowEdit16] = useState(false);
    const [allowEdit18, setAllowEdit18] = useState(false);
    const [allowEdit24, setAllowEdit24] = useState(false);
    const [historicalRates, setHistoricalRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [hasTodayRates, setHasTodayRates] = useState(false);

    // Fetch current rates and historical data
    useEffect(() => {
        const fetchRates = async () => {
            try {
                setLoading(true);
                
                // Fetch current rates (most recent)
                const currentResponse = await fetch(`${baseURL}/rates/current`);
                const currentResult = await currentResponse.json();

                // Check if there are rates for today
                const todayResponse = await fetch(`${baseURL}/rates/today`);
                const todayResult = await todayResponse.json();
                
                // Fetch historical rates
                const historyResponse = await fetch(`${baseURL}/rates/history`);
                const historyResult = await historyResponse.json();

                if (currentResponse.ok) {
                    // Check if we have valid rates data
                    if (currentResult.rate_22crt > 0) {
                        setHasTodayRates(true);
                        
                        const utcDate = new Date(currentResult.rate_date);
                        const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
                        const formattedDate = localDate.toISOString().split('T')[0];

                        setRates({
                            currentDate: new Date().toISOString().split('T')[0],
                            gold16: currentResult.rate_16crt || '',
                            gold18: currentResult.rate_18crt || '',
                            gold22: currentResult.rate_22crt || '',
                            gold24: currentResult.rate_24crt || '',
                            silverRate: currentResult.silver_rate || '',
                            rateDate: formattedDate,
                            rateTime: currentResult.rate_time || ''
                        });
                    } else {
                        // No rates set yet
                        setHasTodayRates(false);
                        setRates(prev => ({
                            ...prev,
                            currentDate: new Date().toISOString().split('T')[0],
                            rateDate: new Date().toISOString().split('T')[0]
                        }));
                    }
                }

                if (historyResponse.ok) {
                    setHistoricalRates(historyResult);
                }
            } catch (error) {
                console.error('An error occurred while fetching rates:', error);
                // Set default state if fetch fails
                setRates(prev => ({
                    ...prev,
                    currentDate: new Date().toISOString().split('T')[0],
                    rateDate: new Date().toISOString().split('T')[0]
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
    }, []);

    const calculateRatesFrom22K = (gold22) => {
        const gold22Value = parseFloat(gold22) || 0;
        if (gold22Value <= 0) return { gold24: '', gold18: '', gold16: '' };
        
        const gold24 = Math.round((gold22Value * 24) / 22);
        const gold18 = Math.round(gold24 * 0.75); // 18/24 = 0.75
        const gold16 = Math.round(gold24 * (16/24)); // 16/24 = 0.6667

        return {
            gold24,
            gold18,
            gold16,
        };
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'gold16' && !allowEdit16) {
            setAllowEdit16(true);
        }

        if (name === 'gold18' && !allowEdit18) {
            setAllowEdit18(true);
        }

        if (name === 'gold24' && !allowEdit24) {
            setAllowEdit24(true);
        }

        if (name === 'gold22') {
            const calculated = calculateRatesFrom22K(value);
            setRates((prevRates) => ({
                ...prevRates,
                gold22: value,
                gold24: allowEdit24 ? prevRates.gold24 : calculated.gold24,
                gold18: allowEdit18 ? prevRates.gold18 : calculated.gold18,
                gold16: allowEdit16 ? prevRates.gold16 : calculated.gold16,
            }));
        } else {
            setRates((prevRates) => ({
                ...prevRates,
                [name]: value,
            }));
        }
    };

    const handleUpdateRates = async () => {
        const { gold16, gold18, gold22, gold24, silverRate, currentDate } = rates;

        // Validate all fields
        if (!gold22 || !silverRate) {
            return;
        }

        if (parseFloat(gold22) <= 0 || parseFloat(silverRate) <= 0) {
            return;
        }

        const requestData = {
            rate_date: currentDate,
            rate_16crt: Math.round(gold16),
            rate_18crt: Math.round(gold18),
            rate_22crt: Math.round(gold22),
            rate_24crt: Math.round(gold24),
            silver_rate: Math.round(silverRate),
        };

        setUpdating(true);
        try {
            const response = await fetch(`${baseURL}/rates/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (response.ok) {
                // Refresh all data
                await refreshRatesData();
                
                // Reset edit flags
                setAllowEdit16(false);
                setAllowEdit18(false);
                setAllowEdit24(false);
                setHasTodayRates(true);
                
            } else {
                console.error('Error updating rates:', result.error);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setUpdating(false);
        }
    };

    const refreshRatesData = async () => {
        try {
            // Fetch updated current rates
            const currentResponse = await fetch(`${baseURL}/rates/current`);
            const currentResult = await currentResponse.json();

            if (currentResponse.ok && currentResult.rate_22crt > 0) {
                const utcDate = new Date(currentResult.rate_date);
                const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
                const formattedDate = localDate.toISOString().split('T')[0];

                setRates(prev => ({
                    ...prev,
                    gold16: currentResult.rate_16crt,
                    gold18: currentResult.rate_18crt,
                    gold22: currentResult.rate_22crt,
                    gold24: currentResult.rate_24crt,
                    silverRate: currentResult.silver_rate,
                    rateDate: formattedDate,
                    rateTime: currentResult.rate_time
                }));
            }

            // Refresh history
            const historyResponse = await fetch(`${baseURL}/rates/history`);
            const historyResult = await historyResponse.json();
            if (historyResponse.ok) {
                setHistoricalRates(historyResult);
            }
        } catch (error) {
            console.error('Error refreshing rates:', error);
        }
    };

    const formatDisplayDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTableDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="rates-management-container">
                <div className="rates-loading-container">
                    <div className="rates-spinner"></div>
                    <p>Loading rates...</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <Navbar />
        <div className="rates-management-container" style={{marginTop:"100px"}}>
            {/* <div className="dashboard-header">
                <div className="dashboard-tabs">
                    <span className="dashboard-tab active">DASHBOARD</span>
                    <span className="dashboard-tab">VENDORS</span>
                    <span className="dashboard-tab">MASTERS</span>
                    <span className="dashboard-tab">PRODUCTS</span>
                    <span className="dashboard-tab">ORDERS</span>
                    <span className="dashboard-tab">DELIVERY AGENTS</span>
                    <span className="dashboard-tab">SALES DETAILS</span>
                </div>
            </div> */}
            
            <h1 className="rates-management-title">
                ENTER TODAY RATE
            </h1>
            
            {/* Current Rates Section */}
            <div className="rates-current-section">
                <div className="current-date-display">
                    <span className="current-date-label">Current Date</span>
                    <span className="current-date-value">{formatDisplayDate(rates.currentDate)}</span>
                </div>
                
                <div className="rates-form-container">
                    {/* Gold Rates Section */}
                    <div className="rates-field-group">
                        <h5 className="rates-sub-section-title">Enter Today Gold Rate</h5>
                        
                        <div className="rates-form-grid">
                            <div className="rate-input-group">
                                <div className="rate-input-label">24 Crt</div>
                                <input
                                    className="rate-input-field"
                                    name="gold24"
                                    type="number"
                                    value={rates.gold24}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    readOnly={!allowEdit24}
                                    style={{ 
                                        backgroundColor: !allowEdit24 ? '#e9ecef' : 'white',
                                        cursor: allowEdit24 ? 'text' : 'pointer'
                                    }}
                                    min="0"
                                    step="0.01"
                                    onClick={(e) => {
                                        if (!allowEdit24) {
                                            e.target.focus();
                                            setAllowEdit24(true);
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="rate-input-group">
                                <div className="rate-input-label">22 Crt</div>
                                <input
                                    className="rate-input-field"
                                    name="gold22"
                                    type="number"
                                    value={rates.gold22}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    autoFocus
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            
                            <div className="rate-input-group">
                                <div className="rate-input-label">18 Crt</div>
                                <input
                                    className="rate-input-field"
                                    name="gold18"
                                    type="number"
                                    value={rates.gold18}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    readOnly={!allowEdit18}
                                    style={{ 
                                        backgroundColor: !allowEdit18 ? '#e9ecef' : 'white',
                                        cursor: allowEdit18 ? 'text' : 'pointer'
                                    }}
                                    min="0"
                                    step="0.01"
                                    onClick={(e) => {
                                        if (!allowEdit18) {
                                            e.target.focus();
                                            setAllowEdit18(true);
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="rate-input-group">
                                <div className="rate-input-label">16 Crt</div>
                                <input
                                    className="rate-input-field"
                                    name="gold16"
                                    type="number"
                                    value={rates.gold16}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    readOnly={!allowEdit16}
                                    style={{ 
                                        backgroundColor: !allowEdit16 ? '#e9ecef' : 'white',
                                        cursor: allowEdit16 ? 'text' : 'pointer'
                                    }}
                                    min="0"
                                    step="0.01"
                                    onClick={(e) => {
                                        if (!allowEdit16) {
                                            e.target.focus();
                                            setAllowEdit16(true);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Silver Rate Section */}
                    <div className="rates-field-group">
                        <h5 className="rates-sub-section-title">Enter Today Silver Rate</h5>
                        <div className="rate-input-group single-input">
                            <div className="rate-input-label">Silver Rate</div>
                            <input
                                className="rate-input-field"
                                name="silverRate"
                                type="number"
                                value={rates.silverRate}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                <div className="rates-button-container">
                    <button 
                        className="rates-update-button" 
                        onClick={handleUpdateRates}
                        disabled={updating || !rates.gold22 || !rates.silverRate}
                    >
                        {updating ? 'PROCESSING...' : 'UPDATE'}
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default RateManagement;
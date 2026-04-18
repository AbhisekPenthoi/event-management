import React, { useState, useEffect } from 'react';
import './SeatingMap.css';

const SeatingMap = ({ config, onSeatSelect, selectedSeats = [] }) => {
    const { rows, cols, vip_rows = [] } = config;

    // Legend: 0: Available, 1: Selected, 2: Booked (Mocked for now)
    const [seatStates, setSeatStates] = useState({});

    useEffect(() => {
        // Generate some random booked seats for demo purposes
        const mockBooked = {};
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.8) {
                    mockBooked[`${r}-${c}`] = 2; // Booked
                }
            }
        }
        setSeatStates(mockBooked);
    }, [rows, cols]);

    const toggleSeat = (r, c) => {
        const key = `${r}-${c}`;
        if (seatStates[key] === 2) return; // Can't select booked

        const isCurrentlySelected = selectedSeats.includes(key);
        let newSelected;
        if (isCurrentlySelected) {
            newSelected = selectedSeats.filter(s => s !== key);
        } else {
            newSelected = [...selectedSeats, key];
        }
        onSeatSelect(newSelected);
    };

    const getSeatClass = (r, c) => {
        const key = `${r}-${c}`;
        if (seatStates[key] === 2) return 'seat booked';
        if (selectedSeats.includes(key)) return 'seat selected';
        if (vip_rows.includes(r)) return 'seat vip';
        return 'seat available';
    };

    const renderGrid = () => {
        const grid = [];
        for (let r = 0; r < rows; r++) {
            const rowSeats = [];
            for (let c = 0; c < cols; c++) {
                rowSeats.push(
                    <div
                        key={`${r}-${c}`}
                        className={getSeatClass(r, c)}
                        onClick={() => toggleSeat(r, c)}
                        title={`Row ${r + 1}, Seat ${c + 1} ${vip_rows.includes(r) ? '(VIP)' : ''}`}
                    >
                        {c + 1}
                    </div>
                );
            }
            grid.push(
                <div key={r} className="seating-row">
                    <div className="row-label">Row {String.fromCharCode(65 + r)}</div>
                    {rowSeats}
                </div>
            );
        }
        return grid;
    };

    return (
        <div className="seating-container">
            <div className="screen">STAGE / SCREEN</div>
            <div className="seating-grid">
                {renderGrid()}
            </div>
            <div className="seating-legend">
                <div className="legend-item"><div className="seat available"></div> Available</div>
                <div className="legend-item"><div className="seat vip"></div> VIP</div>
                <div className="legend-item"><div className="seat selected"></div> Selected</div>
                <div className="legend-item"><div className="seat booked"></div> Booked</div>
            </div>
        </div>
    );
};

export default SeatingMap;

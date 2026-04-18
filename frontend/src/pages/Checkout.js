import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Checkout.css';

const Checkout = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [cardData, setCardData] = useState({
        cardNumber: '',
        expiry: '',
        cvv: '',
        name: ''
    });
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'upi'
    const [selectedUpi, setSelectedUpi] = useState('paytm'); // 'paytm', 'phonepe', 'gpay', 'other'
    const [upiId, setUpiId] = useState('');
    const [couponData, setCouponData] = useState(null); // { discount_value, discount_type }

    const fetchBooking = useCallback(async () => {
        try {
            const response = await axios.get(`/api/bookings/${bookingId}`);
            if (response.data.payment_status === 'paid') {
                toast.info('This booking is already paid');
                navigate(`/ticket/${bookingId}`);
                return;
            }
            setBooking(response.data);
        } catch (error) {
            console.error('Error fetching booking:', error);
            toast.error('Booking not found');
            navigate('/bookings');
        } finally {
            setLoading(false);
        }
    }, [bookingId, navigate]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    const handleChange = (e) => {
        setCardData({ ...cardData, [e.target.name]: e.target.value });
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        try {
            const response = await axios.post('/api/coupons/validate', { 
                code: couponCode,
                totalAmount: booking.total_cost
            });
            setCouponData({
                discount_value: response.data.discount_value,
                discount_type: response.data.discount_type
            });
            setAppliedCoupon(response.data.code);
            
            const discountLabel = response.data.discount_type === 'percentage' 
                ? `${response.data.discount_value}%` 
                : `₹${response.data.discount_value}`;
            toast.success(`Coupon applied! ${discountLabel} off`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Invalid coupon');
            setCouponData(null);
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const calculateSavings = () => {
        if (!booking || !couponData) return 0;
        const base = parseFloat(booking.total_cost);
        const val = parseFloat(couponData.discount_value);
        if (couponData.discount_type === 'percentage') {
            return base * (val / 100);
        } else {
            return Math.min(base, val);
        }
    };

    const calculateTotal = () => {
        if (!booking) return 0;
        const base = parseFloat(booking.total_cost);
        const savings = calculateSavings();
        return (base - savings).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (paymentMethod === 'upi' && !upiId.includes('@')) {
            toast.warning('Please enter a valid UPI ID');
            return;
        }

        setProcessing(true);

        // Simulate banking network delay
        setTimeout(async () => {
            try {
                const methodLabel = paymentMethod === 'card' ? 'Credit Card' : `UPI-${selectedUpi.toUpperCase()}`;
                
                await axios.post(`/api/bookings/${bookingId}/payment`, {
                    paymentMethod: methodLabel,
                    cardNumber: cardData.cardNumber.slice(-4),
                    upiId: upiId
                });
                
                toast.success('Payment Successful!');
                navigate(`/ticket/${bookingId}`);
            } catch (error) {
                toast.error('Payment failed. Please try again.');
                setProcessing(false);
            }
        }, 2500);
    };

    if (loading) return (
        <div className="checkout-loading">
            <div className="spinner"></div>
            <p>Securing your transaction...</p>
        </div>
    );
    
    if (!booking) return null;

    return (
        <div className="checkout-page elite-theme">
            <div className="container">
                <div className="checkout-grid">
                    <div className="order-summary-card">
                        <div className="card-header">
                            <h3>Order Summary</h3>
                            <span className="booking-id">ID: #{bookingId}</span>
                        </div>
                        
                        <div className="summary-body">
                            <div className="event-mini-card">
                                <h4>{booking.event_title}</h4>
                                <p><i className="far fa-calendar"></i> {new Date(booking.event_date).toLocaleDateString()}</p>
                            </div>

                            <div className="price-breakdown">
                                <div className="price-row">
                                    <span>Base Tickets ({booking.number_of_tickets})</span>
                                    <span>₹{(booking.number_of_tickets * booking.price).toFixed(2)}</span>
                                </div>
                                
                                {booking.selected_seats && (
                                    (() => {
                                        const config = typeof booking.seating_config === 'string' ? JSON.parse(booking.seating_config) : booking.seating_config;
                                        const seats = typeof booking.selected_seats === 'string' ? JSON.parse(booking.selected_seats) : booking.selected_seats;
                                        let vipCount = 0;
                                        if (Array.isArray(seats)) {
                                            seats.forEach(s => {
                                                const r = parseInt(s.split('-')[0]);
                                                if (config?.vip_rows?.includes(r)) vipCount++;
                                            });
                                        }
                                        
                                        if (vipCount > 0) {
                                            const multiplier = parseFloat(config.vip_price_multiplier || 1.5);
                                            const premium = (multiplier - 1) * vipCount * booking.price;
                                            return (
                                                <div className="price-row vip-row">
                                                    <span>VIP Premium ({vipCount} seats)</span>
                                                    <span>+ ₹{premium.toFixed(2)}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()
                                )}
                                
                                {couponData && (
                                    <div className="price-row discount-row">
                                        <span>
                                            Discount ({appliedCoupon})
                                            <small>{couponData.discount_type === 'percentage' ? `${couponData.discount_value}% off` : 'Flat ₹' + couponData.discount_value}</small>
                                        </span>
                                        <span className="minus">- ₹{calculateSavings().toFixed(2)}</span>
                                    </div>
                                ) || (
                                    <div className="coupon-promo">
                                        <div className="promo-header">
                                            <label>Have a coupon?</label>
                                            <span className="coupon-tip" title="Try: WELCOME10, FLAT500, MEGA25">View Offers</span>
                                        </div>
                                        <div className="promo-input">
                                            <input
                                                type="text"
                                                placeholder="Enter Code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            />
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={validatingCoupon}
                                            >
                                                {validatingCoupon ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="price-row total-row">
                                    <span>Total Amount Payable</span>
                                    <span className="final-price">₹{calculateTotal()}</span>
                                </div>
                            </div>
                        </div>
                        
                        {appliedCoupon && (
                            <div className="coupon-applied-tag">
                                <i className="fas fa-check-circle"></i>
                                <span>You are saving ₹{calculateSavings().toFixed(2)} on this booking!</span>
                                <button className="remove-coupon" onClick={() => {
                                    setAppliedCoupon(null);
                                    setCouponData(null);
                                    setCouponCode('');
                                }}>×</button>
                            </div>
                        )}
                    </div>

                    <div className="payment-gateway-card">
                        <div className="gateway-header">
                            <h3>Secure Checkout</h3>
                            <div className="trust-badges">
                                <i className="fas fa-shield-alt"></i> SSL SECURED
                            </div>
                        </div>

                        <div className="method-selector">
                            <button 
                                className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <i className="fas fa-credit-card"></i> Card
                            </button>
                            <button 
                                className={`method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('upi')}
                            >
                                <i className="fas fa-mobile-alt"></i> UPI
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="gateway-content">
                            {paymentMethod === 'card' ? (
                                <div className="card-payment-view fadeIn">
                                    <div className="form-group">
                                        <label>Cardholder Name</label>
                                        <div className="input-with-icon">
                                            <i className="far fa-user"></i>
                                            <input type="text" name="name" placeholder="Name on card" required value={cardData.name} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Card Number</label>
                                        <div className="input-with-icon">
                                            <i className="far fa-credit-card"></i>
                                            <input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" required maxLength="16" value={cardData.cardNumber} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Expiry</label>
                                            <input type="text" name="expiry" placeholder="MM/YY" required maxLength="5" value={cardData.expiry} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>CVV</label>
                                            <input type="password" name="cvv" placeholder="***" required maxLength="3" value={cardData.cvv} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="upi-payment-view fadeIn">
                                    <label>Select UPI App</label>
                                    <div className="upi-apps-grid">
                                        <div className={`upi-app ${selectedUpi === 'paytm' ? 'selected' : ''}`} onClick={() => setSelectedUpi('paytm')}>
                                            <div className="upi-icon paytm"></div>
                                            <span>Paytm</span>
                                        </div>
                                        <div className={`upi-app ${selectedUpi === 'phonepe' ? 'selected' : ''}`} onClick={() => setSelectedUpi('phonepe')}>
                                            <div className="upi-icon phonepe"></div>
                                            <span>PhonePe</span>
                                        </div>
                                        <div className={`upi-app ${selectedUpi === 'gpay' ? 'selected' : ''}`} onClick={() => setSelectedUpi('gpay')}>
                                            <div className="upi-icon gpay"></div>
                                            <span>GPay</span>
                                        </div>
                                        <div className={`upi-app ${selectedUpi === 'other' ? 'selected' : ''}`} onClick={() => setSelectedUpi('other')}>
                                            <div className="upi-icon bhim"></div>
                                            <span>BhIM</span>
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>UPI ID</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-at"></i>
                                            <input 
                                                type="text" 
                                                placeholder="username@bank" 
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <small className="upi-hint">Transaction will be verified via your UPI app</small>
                                    </div>
                                    
                                    <div className="qr-preview-section">
                                        <div className="qr-placeholder">
                                            <i className="fas fa-qrcode"></i>
                                            <span>Scan to pay securely</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="gateway-submit-btn"
                                disabled={processing}
                            >
                                {processing ? (
                                    <><span className="processing-dot"></span> Securely Processing...</>
                                ) : (
                                    `Complete Payment • ₹${calculateTotal()}`
                                )}
                            </button>
                            
                            <p className="security-note">
                                <i className="fas fa-lock"></i> 
                                Your payment details are encrypted and nunca stored on our servers.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

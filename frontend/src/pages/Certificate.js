import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Certificate.css';

const Certificate = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const response = await axios.get(`/api/bookings/${bookingId}`);
                setBooking(response.data);
            } catch (error) {
                console.error('Error fetching booking details:', error);
                toast.error('Could not load certificate data');
                navigate('/bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId, navigate]);

    const downloadCertificate = async () => {
        const element = certificateRef.current;
        if (!element) return;

        try {
            // Force dimensions to match CSS for consistent capture
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 1000,
                height: 700,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('.certificate-outer');
                    if (clonedElement) {
                        clonedElement.style.animation = 'none'; // Prevent animation issues
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1000, 700]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, 1000, 700);
            pdf.save(`Certificate_${booking.event_title.replace(/\s+/g, '_')}.pdf`);
            toast.success('Certificate downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    if (loading) return <div className="loading">Generating your certificate...</div>;
    if (!booking) return null;

    return (
        <div className="certificate-page">
            <div className="certificate-actions">
                <button className="btn btn-primary" onClick={downloadCertificate}>
                    📥 Download Certificate (PDF)
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>
                    🔙 Back to Bookings
                </button>
            </div>

            <div className="certificate-scaler">
                <div className="certificate-outer" ref={certificateRef}>
                    <div className="certificate-inner">
                        <div className="certificate-border">
                            <div className="certificate-header">
                                <div className="logo">EventHub</div>
                                <h1>Certificate of Participation</h1>
                                <div className="certificate-id">No: CERT-{bookingId}-{new Date().getFullYear()}</div>
                            </div>

                            <div className="certificate-body">
                                <p className="this-is-to-certify">This is to certify that</p>
                                <h2 className="participant-name">{booking.full_name || booking.username || 'Attendee'}</h2>
                                <p className="has-participated">has successfully participated in</p>
                                <h3 className="event-title">"{booking.event_title}"</h3>
                                <p className="event-meta-info">
                                    held on <span>{new Date(booking.event_date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</span>
                                </p>
                                <p className="organized-by">Organized with excellence by EventHub</p>
                            </div>

                            <div className="certificate-footer">
                                <div className="signature-block">
                                    <div className="signature-line"></div>
                                    <p>Event Coordinator</p>
                                    <p>EventHub Team</p>
                                </div>
                                <div className="seal">
                                    <div className="seal-inner">
                                        <span>VERIFIED</span>
                                        <div className="seal-star">★</div>
                                    </div>
                                </div>
                                <div className="date-block">
                                    <p className="issue-date">{new Date().toLocaleDateString()}</p>
                                    <div className="signature-line"></div>
                                    <p>Date of Issue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;

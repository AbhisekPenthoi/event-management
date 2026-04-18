import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Ticket.css';

const Ticket = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBooking = useCallback(async () => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Error loading ticket');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const ticketElement = document.getElementById('ticket-to-download');
    if (!ticketElement) return;

    toast.info('Generating your PDF ticket...');

    try {
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Ticket-${booking.event_title.replace(/\s+/g, '-')}-${booking.id}.pdf`);

      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try printing instead.');
    }
  };

  if (loading) {
    return <div className="loading">Loading ticket...</div>;
  }

  if (!booking) {
    return null;
  }

  const ticketData = JSON.stringify({
    bookingId: booking.id,
    eventTitle: booking.event_title,
    numberOfTickets: booking.number_of_tickets,
    bookingDate: booking.created_at
  });

  return (
    <div className="ticket-page">
      <div className="container">
        <div className="ticket-container">
          <button onClick={() => navigate('/bookings')} className="back-btn">← Back to Bookings</button>

          <div className="ticket-card" id="ticket-to-download">
            <div className="ticket-header">
              <h2>🎫 Entry Ticket</h2>
            </div>

            <div className="ticket-body">
              <div className="ticket-left">
                <div className="event-info">
                  <h3>{booking.event_title}</h3>
                  <div className="info-row">
                    <span className="label">📅 Date:</span>
                    <span>{new Date(booking.event_date).toLocaleString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📍 Location:</span>
                    <span>{booking.location}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">🎟️ Tickets:</span>
                    <span>{booking.number_of_tickets}</span>
                  </div>
                  {booking.selected_seats && (
                    <div className="info-row seat-info-row">
                      <span className="label">💺 Seats:</span>
                      <span className="seat-numbers">{booking.selected_seats.map(s => {
                        const [r, c] = s.split('-');
                        return `${String.fromCharCode(65 + parseInt(r))}${parseInt(c) + 1}`;
                      }).join(', ')}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">💰 Cost:</span>
                    <span>₹{booking.total_cost}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📅 Booked On:</span>
                    <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="ticket-right">
                <div className="qr-container">
                  <QRCodeSVG value={ticketData} size={200} />
                  <p className="qr-note">Scan at venue</p>
                </div>
              </div>
            </div>

            <div className="ticket-footer">
              <div className="ticket-number">Booking ID: #{booking.id}</div>
              <div className="footer-actions">
                <button onClick={handlePrint} className="print-btn">🖨️ Print</button>
                <button onClick={handleDownloadPDF} className="download-btn">📥 Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;


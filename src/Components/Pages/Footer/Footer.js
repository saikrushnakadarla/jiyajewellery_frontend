import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="toll-footer">
      <div className="toll-footer-content">
        <div className="footer-line"></div>

        <div className="footer-text">
          <h5 className="footer-company">Jiya Jewellery</h5>

          <span className="footer-label">Toll Free No</span>

          <a href="tel:18005695028" className="footer-number">
            1800 569 5028
          </a>
        </div>

        <div className="footer-line"></div>
      </div>
    </footer>
  );
};

export default Footer;
import logo from '../images/jiya_logo.png';
import './WaterMark.css';

const Watermark = () => {
  return (
    <div className="watermark-container">
      <div className="watermark-pattern"></div>

      <img
        src={logo}
        alt="Jiya Jewellery"
        className="watermark-logo"
        draggable={false}
      />
    </div>
  );
};

export default Watermark;
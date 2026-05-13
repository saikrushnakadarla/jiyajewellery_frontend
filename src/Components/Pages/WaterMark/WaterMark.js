import logo from '../images/jiya_logo.png'; // Update the path to your logo

const Watermark = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none', // Allows clicking through the watermark
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <img 
        src={logo} 
        alt="Jiya Jewellery"
        style={{
          width: '800px', // Adjust size as needed
          opacity: 0.1, // Very subtle watermark
          objectFit: 'contain',
          userSelect: 'none',
          filter: 'grayscale(100%)', // Optional: makes it look more watermark-like
        }}
      />
    </div>
  );
};

export default Watermark;